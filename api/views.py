# api/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction # For database transaction safety
from .models import Category, Product, Customer, Tax, Discount, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductSerializer, CustomerSerializer,
    TaxSerializer, DiscountSerializer, OrderSerializer
)

# 1. SIMPLE CRUD (Class-Based Views - CBV)
# Using ViewSets for standard data that doesn't need complex logic

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all()
    serializer_class = TaxSerializer

class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer


# 2. COMPLEX LOGIC (Function-Based Views - FBV)
# Using FBV for checkout because we need to calculate totals and deduct stock

@api_view(['POST'])
def create_order(request):
    """
    Custom API to handle POS checkout process.
    It expects a JSON payload containing payment details and a list of items.
    """
    data = request.data
    items_data = data.get('items', []) # Get items array from frontend

    if not items_data:
        return Response({'error': 'No items provided'}, status=status.HTTP_400_BAD_REQUEST)

    # transaction.atomic() ensures that if anything fails (e.g., out of stock), 
    # the entire database operation cancels. No half-saved orders!
    try:
        with transaction.atomic():
            # 1. Create the main Order record first
            order = Order.objects.create(
                cashier_id=data.get('cashier'),
                customer_id=data.get('customer'),
                payment_method=data.get('payment_method', 'CASH'),
                subtotal=data.get('subtotal', 0),
                tax_amount=data.get('tax_amount', 0),
                discount_amount=data.get('discount_amount', 0),
                final_total=data.get('final_total', 0)
            )

            # 2. Loop through each item to create OrderItems and update Stock
            for item in items_data:
                product = Product.objects.get(id=item['product_id'])
                quantity = item['quantity']

                # Check if we have enough stock
                if product.stock_quantity < quantity:
                    raise ValueError(f"Not enough stock for {product.name}. Only {product.stock_quantity} left.")

                # Deduct stock and save
                product.stock_quantity -= quantity
                product.save()

                # Create the OrderItem associated with the new Order
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=item['unit_price'],
                    item_subtotal=item['item_subtotal']
                )

            # Return the successfully created order using our existing Serializer
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    except ValueError as e:
        # Catch stock errors
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Catch any other database errors
        return Response({'error': 'Something went wrong during checkout'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
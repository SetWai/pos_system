from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction 
from rest_framework.permissions import IsAuthenticated
from .models import Category, Product, Customer, Tax, Discount, Order, OrderItem, POSSetting
from .serializers import (
    CategorySerializer, ProductSerializer, CustomerSerializer,
    TaxSerializer, DiscountSerializer, OrderSerializer
)
from .permissions import IsAdminOrReadOnly

# 1. SIMPLE CRUD (Class-Based Views - CBV)
# Using ViewSets for standard data that doesn't need complex logic

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminOrReadOnly]

class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all()
    serializer_class = TaxSerializer

class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    # Orders can be viewed by any authenticated user (Cashiers can view past receipts)
    permission_classes = [IsAuthenticated]

# 2. COMPLEX LOGIC (Function-Based Views - FBV)
# Using FBV for checkout because we need to calculate totals and deduct stock

@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
                cashier=request.user,
                cashier_id=data.get('cashier'),
                customer_id=data.get('customer'),
                payment_method=data.get('payment_method', 'CASH'),
                subtotal=data.get('subtotal', 0),
                tax_amount=data.get('tax_amount', 0),
                discount_amount=data.get('discount_amount', 0),
                final_total=data.get('final_total', 0),
                cash_tendered=data.get('cash_tendered'),
                change_amount=data.get('change_amount'),
                card_last4=data.get('card_last4'),
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_void_pin(request):
    """
    Check if the provided PIN matches the dynamic Void Passcode in POSSetting.
    """
    provided_pin = request.data.get('pin', '')
    
    # Get the first setting row (Create one automatically if it doesn't exist)
    setting = POSSetting.objects.first()
    if not setting:
        setting = POSSetting.objects.create(void_passcode="1234")
        
    if setting.void_passcode == str(provided_pin):
        return Response({"valid": True})
    else:
        return Response({"valid": False, "error": "Invalid Passcode"}, status=status.HTTP_403_FORBIDDEN)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    user_info = {
        'id': user.id,
        'username': user.username,
        'is_staff': user.is_staff,
    }
    return Response(user_info)
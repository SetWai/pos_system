from rest_framework import serializers
from .models import Category, Product, Customer, Tax, Discount, Order, OrderItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    # Read-only field to display the category name in the frontend instead of just the category ID
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = '__all__'

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    # Include product details within the order item for the receipt UI
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'item_subtotal']

class OrderSerializer(serializers.ModelSerializer):
    # Nested serializer to fetch all items related to this order in a single API call
    items = OrderItemSerializer(many=True, read_only=True)
    cashier_name = serializers.ReadOnlyField(source='cashier.username')

    class Meta:
        model = Order
        fields = '__all__'
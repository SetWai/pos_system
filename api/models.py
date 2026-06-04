from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    # Category name (e.g., Beverages, Snacks)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    # Barcode for physical scanning in supermarkets
    barcode = models.CharField(max_length=50, unique=True, blank=True, null=True)

    def __str__(self):
        return self.name

class Customer(models.Model):
    # Customer details for loyalty program tracking
    name = models.CharField(max_length=200)
    # Phone number is often used as a unique ID for supermarket memberships
    phone_number = models.CharField(max_length=20, unique=True)
    loyalty_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.phone_number}"

class Tax(models.Model):
    # Tax configuration (e.g., VAT 5%, Commercial Tax)
    name = models.CharField(max_length=50)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.percentage}%)"

class Discount(models.Model):
    # Discount campaigns (e.g., Summer Sale 10%, Member Discount)
    name = models.CharField(max_length=100)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.percentage}%)"

class Order(models.Model):
    # Link to the cashier (User) who processed the transaction
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    # Customer is optional (for walk-in customers without accounts)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Financial breakdown for the receipt
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    final_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Standard payment methods in the real world
    PAYMENT_CHOICES = [
        ('CASH', 'Cash'),
        ('CARD', 'Credit/Debit Card'),
        ('EWALLET', 'E-Wallet (e.g., KPay, Apple Pay)'),
    ]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='CASH')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - Total: {self.final_total}"

class OrderItem(models.Model):
    # The specific items inside an order
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(default=1)
    
    # Store price at the time of sale, in case the product price changes in the future
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    item_subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
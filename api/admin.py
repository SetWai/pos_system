from django.contrib import admin
from .models import Category, Product, Customer, Tax, Discount, Order, OrderItem

# Register models to manage them easily from the Django Admin interface
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Customer)
admin.site.register(Tax)
admin.site.register(Discount)
admin.site.register(Order)
admin.site.register(OrderItem)
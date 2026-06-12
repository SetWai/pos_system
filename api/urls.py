from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# 1. Router for Class-Based Views
router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'taxes', views.TaxViewSet)
router.register(r'discounts', views.DiscountViewSet)
router.register(r'orders', views.OrderViewSet)

urlpatterns = [
    # Include all generated routes from the router
    path('', include(router.urls)),
    
    # 2. Custom Path for Function-Based View (Checkout API)
    path('checkout/', views.create_order, name='api-checkout'),
    path('me/', views.get_user_info, name='user-info'),
]
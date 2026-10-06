from django.urls import path
from . import views
from .views import ReviewListCreateView, ReviewRetrieveEditDeleteView, ProductManagementView, ProductListView, ProductDetailView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('product/', ProductListView.as_view(), name='product_list'),
    path('product/<int:pk>/', ProductDetailView.as_view(), name='product_details'),
    path('category/', views.category_list, name='category'),
    path('cart/', views.get_cart, name='cart'),
    path('cart/add/', views.add_to_cart, name='add'),
    path('cart/update/', views.update_cart, name='update'),
    path('cart/remove/', views.remove_from_cart, name='remove'),
    path('order/create/', views.create_order, name='create'),
    path('order/list/', views.order_list, name='order_list'),
    path('order/cancel/<int:pk>/', views.order_cancel, name='order_cancel'),
    path('product/<int:pk>/management/', ProductManagementView.as_view(), name='management'),
    path('products/<int:pk>/review/', ReviewListCreateView.as_view(), name='reviews'),
    path('review/<int:pk>/', ReviewRetrieveEditDeleteView.as_view(), name='review'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')

]
from rest_framework import serializers
from .models import Product, Category, CartItem, Cart, UserProfile, OrderItem, Order
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    stock_message = serializers.CharField(read_only=True)
    dynamic_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'category', 'name', 'description', 'image', 'dynamic_price', 'stock_message']

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.dynamic_price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    class Meta:
        model = CartItem
        fields = '__all__'

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    class Meta:
        model = Cart
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'password2', 'email']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Password does not match")
        return data

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data.get('email', '')
        password = validated_data['password']
        user = User.objects.create_user(username=username, email=email, password=password)
        return user

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.dynamic_price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source = 'product.image', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status = serializers.CharField(max_length=20, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = Order
        fields = '__all__' 
        
class UserProfileSerialiser(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone', 'save_address']
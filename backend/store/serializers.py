from rest_framework import serializers
from .models import Product, Category, CartItem, Cart, UserProfile, OrderItem, Order, Review, ProductVarient
from django.contrib.auth.models import User
import json

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    stock_message = serializers.CharField(read_only=True)
    dynamic_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'category', 'name', 'description', 'image', 'dynamic_price', 'stock_message', 'review_count', 'average_rating']

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.dynamic_price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    subtotal = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
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
        
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone', 'save_address']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    product =  serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'title', 'review',  'rating', 'created_at', 'updated_at']

class ProductVarientSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVarient
        fields = ['id', 'product', 'sku', 'attributes', 'combination_key', 'price', 'stock', 'active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'combination_key', 'created_at', 'updated_at']

    def validate_attributes(self, value):
        if not isinstance(value, dict) or not value:
            raise serializers.ValidationError("Attributes must be non empty object")
        allowed_attributes = {'size', 'color', 'storage'}

        for attribute_name,  attribute_value in value.items():
            if attribute_name not in allowed_attributes:
                raise serializers.ValidationError(f"Unsupported attribute : {attribute_name}")
            if not isinstance(attribute_value, str):
                raise serializers.ValidationError(f"Value for {attribute_name} must be a string")
            if not attribute_value.strip():
                raise serializers.ValidationError(f"Value of {attribute_name} can not be empty")
        return {
            key.strip().lower():str(value).strip().lower()
            for key, value in value.items()
        }
    def validate_sku(self, value):
        value = value.strip().lower()

        if not value:
            raise serializers.ValidationError("Sku can not be empty")
        return value

    def validate(self, atr):
        attributes = atr.get('attributes', getattr(self.instance, 'attributes', {}))
        product = atr.get('product', getattr(self.instance, 'product', None))
        sorted_attributes = dict(sorted(attributes.items()))
        combination_key = json.dumps(sorted_attributes, separators=(',', ':'))
        if ProductVarient.objects.filter(product=product, combination_key=combination_key).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError(
                {
                    'attributes' : ("This attribute combination already exist for this product")
                }
            )
        atr['attributes']=sorted_attributes
        atr['combination_key'] = combination_key
        return atr

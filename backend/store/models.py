from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)  #whats slug

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)   #whats cascade
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/',blank=True, null= True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def stock_message(self):
        stock = self.stock
        if stock >= 20:
            return "In Stock"
        elif stock < 20 and stock > 0:
            return "Limited Stock left"
        else:
            return "Out of Stock"
    @property
    def dynamic_price(self):
        stock = self.stock
        dynamic_price = self.price
        if stock >= 50:
            return dynamic_price - (dynamic_price * Decimal('0.02')).quantize(Decimal('0.01'))
        elif stock >= 20:
            return dynamic_price
        elif stock < 20 and stock > 0:
            return dynamic_price + (dynamic_price * Decimal('0.02')).quantize(Decimal('0.01'))
        else:
            return dynamic_price

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=10)
    save_address = models.TextField()

    def __str__(self):
        return self.user.username 

class Order(models.Model):
    status_choices = [('pending', 'Pending'),('cancelled', 'Cancelled')]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=50, default='COD')
    shipping_address = models.TextField(default='save_address')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=status_choices, default='pending')

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

    @property
    def total(self):
        return sum(items.subtotal for items in self.items.all())

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2) 

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def subtotal(self):
        return self.quantity * self.price

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart{self.id} for {self.user.username}"
    
    @property
    def total(self):
        return sum(items.subtotal for items in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def subtotal(self):
        return self.quantity * self.product.dynamic_price


from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import Product, Category, Cart, CartItem, Order, OrderItem, UserProfile
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer, RegistrationSerializer, UserSerializer, OrderItemSerializer, OrderSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    product = Product.objects.all()
    serializer = ProductSerializer(product, many=True, context={'request':request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def product_details(request, pk):
    try:
        product = Product.objects.get(pk=pk)
        serializer = ProductSerializer(product, context={'request':request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error':"Product Not Found"},status=status.HTTP_404_NOT_FOUND)
    

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    category = Category.objects.all()
    serializer = CategorySerializer(category, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart,  context={'request':request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    if not product_id:   #will remove this
        return Response({'message':'Product ID is required'}, status=400) 
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'message':'Product does not exist'}, status=400)
    cart, created = Cart.objects.get_or_create(user=request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    if not created:
        item.quantity += 1
        item.save()
    return Response({'message':'Items Added to the cart', "cart":CartSerializer(cart, context={'request':request}).data})
    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request):
    product_id = request.data.get('product_id')
    if not product_id:
        return Response({'message':'Product ID is required'}, status=400)
    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        return Response({'message':'Cart does not exist'}, status=400)
    CartItem.objects.filter(cart=cart, product_id=product_id).delete()
    return Response({'message':'Item removed from cart'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cart(request):
    item_id = request.data.get('item_id')
    quantity = request.data.get('quantity')

    if not item_id or quantity is None:
        return Response({"message":"Item Id and Quantity is required"}, status=400)

    try:
        cart = Cart.objects.get(user=request.user)
        item = CartItem.objects.get(id=item_id, cart=cart)
        if int(quantity) < 1:
            return Response({"message":"Atleast one item should be added"}, status=400)
        item.quantity = quantity
        item.save()
        serializer = CartItemSerializer(item, context={'request':request})
        return Response(serializer.data)
    except Cart.DoesNotExist:
        return Response({"message":"No cart found"}, status=404)
    except CartItem.DoesNotExist:
        return Response({"message":"No item found"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        data = request.data
        name = data.get('name')
        save_address = data.get('save_address')
        new_address = data.get('new_address')
        phone = data.get('phone')
        payment_method = data.get('payment_method')

        if not phone.isdigit() or len(phone) < 10:
            return Response({"message":'Invalid phone number'}, status=400)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        request.user.first_name = name
        request.user.save()
        profile.phone = phone
        profile.save()
        if save_address:
            shipping_address = save_address
        else:
            if not new_address:
                return Response({'error':'New Adress is required'}, status=404)
            shipping_address = new_address
        
        cart = Cart.objects.get(user=request.user)
        if not cart.items.exists():
            return Response({'error':'No items found to order'}, status=400)
        
        
        for items in cart.items.all():
            stock = items.product.stock
            if stock < items.quantity:
                return Response({'message' : 'This number of quantity is not available', 'name':items.product.name}, status=400)

        order = Order.objects.create(user=request.user, shipping_address=shipping_address, payment_method=payment_method)
        for items in cart.items.all():
            stock = items.product.stock
            OrderItem.objects.create(order=order, product=items.product, quantity=items.quantity, price=items.product.dynamic_price)           
            items.product.stock = stock - items.quantity
            items.product.save()

        total = cart.total
        cart.items.all().delete()
        return Response({"message":"Order is created successfully", "order_id":order.id, "total":total}, status=201)
        

    except Cart.DoesNotExist:
        return Response({'error':'No Cart found'}, status=404)
    except Exception as e:
        return Response({"error":str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list(request):
    order = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(order, many=True, context={'request':request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_cancel(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'message':"Order Does not exist"}, status=404)
    if order.status == 'cancelled':
        return Response({'message':'Order is already cancelled'}, status=400)
    for items in order.items.all():
        quantity = items.quantity
        stock = items.product.stock
        items.product.stock = stock + quantity
        items.product.save()
    order.status = 'cancelled'
    order.save()
    return Response({'message':'Your Order has been cancelled'}, status=200)

@api_view(['POST']) 
@permission_classes([AllowAny]) 
def register_view(request):
    serializer = RegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        return Response({'message': 'User Created successfully', "user":user_serializer.data}, status=201)
    return Response(serializer.errors, status=400)




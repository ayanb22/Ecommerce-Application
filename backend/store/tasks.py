from celery import shared_task
from django.conf import settings
from .models import Product

@shared_task
def check_low_stock(product_id):
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return ({'status':'Skipped', 'message':'Product Does not exist'})

    threshold = settings.LOW_STOCK_THRESHOLD
    if product.stock <= threshold:
        if product.low_stock_alert_sent:
            return ({'status':'skipped','message':'Low Stock alert already sent'})
        Product.objects.filter(pk=product_id).update(low_stock_alert_sent=True)
        return ({'status':'low_stock_alert', 'product_id':product.id, 'product_name':product.name, 'stock':product.stock})
    if product.low_stock_alert_sent:
        Product.objects.filter(pk=product_id).update(low_stock_alert_sent=False)
    return ({'status':'stock_normal', 'product_id':product.id, 'stock':product.stock})
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product
from .tasks import check_low_stock

@receiver(post_save, sender=Product)
def product_save(sender, instance, **kwargs):
    check_low_stock.delay_on_commit(instance.pk)
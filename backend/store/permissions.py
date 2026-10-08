from rest_framework.permissions import BasePermission

class ProductVarientWritePermission(BasePermission):
    message = "You do not have the permission to manage the product varients"

    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.has_perm('store.change_productvarient')
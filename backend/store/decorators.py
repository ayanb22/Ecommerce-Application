from functools import wraps
from rest_framework.response import Response
from rest_framework import status

def require_django_permission(permission_code):
    def decorator(view_method):
        @wraps(view_method)
        def wrapper(request, *args, **kwargs):
            if not request.user.has_perm(permission_code):
                return Response({"detail":"You do not have permission to do this"}, status=status.HTTP_403_FORBIDDEN)
            return view_method(request, *args, **kwargs)

        return wrapper
    
    return decorator
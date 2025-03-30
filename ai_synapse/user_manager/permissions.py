from rest_framework.permissions import BasePermission

class IsAuthenticatedUser(BasePermission):
    """Allow only authenticated users to access APIs"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class IsAdminUser(BasePermission):
    """Allow only admin users to perform certain actions"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser

from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins (staff) to edit objects.
    Cashiers (authenticated normal users) can only read.
    """
    def has_permission(self, request, view):
        # Allow reading (GET, HEAD, OPTIONS) for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Allow writing (POST, PUT, DELETE) ONLY if the user is an Admin (is_staff)
        return request.user and request.user.is_staff
from rest_framework import generics, permissions
from ..serializers import UserProfileSerializer # Import the specific serializer
# Import your Account model if needed (though serializer handles it)
# from .models import Account

# --- Add this View ---

class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    Allows authenticated users to retrieve (GET) and update (PUT/PATCH)
    their own profile information (specifically ssh_public_key here).
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated] # User must be logged in

    def get_object(self):
        """
        Ensures users can only access their own profile.
        """
        return self.request.user


    
# user_manager/views.py
# Current time: Sunday, April 13, 2025 at 5:35 PM IST. Location: Bengaluru, Karnataka, India.

import logging
from django.contrib.auth import login, authenticate, logout
from django.middleware.csrf import get_token # For potentially returning token

# DRF Imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny # Permissions for views

# Import only the Account model (Serializer import removed)
from user_manager.models import Account

logger = logging.getLogger(__name__)

class LoginAPIView(APIView):
    """
    API View for user login using Session Authentication.
    Expects JSON: {"username": "...", "password": "..."}
    Returns user data manually constructed, without using a DRF serializer.
    """
    permission_classes = [AllowAny] # Anyone can attempt to log in

    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            if not email or not password:
                logger.warning(f"Login API failed: Missing username or password. User: '{email}'")
                return Response(
                    {'error': 'email and password are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Authenticate using Django's backend
            user = authenticate(request, email=email, password=password)

            if user is not None:
                login(request, user)
                logger.info(f"Login API successful for user: '{email}'")

                # --- Manually Construct User Data for Response (No Serializer) ---
                user_data = {
                    'username': user.username,
                    'email': user.email,
                    # Add any other fields from your Account model needed by the frontend
                }
                # # --------------------------------------------------------------------

                response_data = {'user': user_data} # Nest user data under 'user' key

                # Optionally include CSRF token if frontend needs it explicitly after login
                csrf_token = get_token(request)
                response_data['csrf_token'] = csrf_token

                return Response(status=status.HTTP_200_OK)
            else:
                logger.error(f"Login API failed: Invalid credentials for username '{email}'.")
                return Response(status=status.HTTP_401_UNAUTHORIZED)
        except Exception:
            logger.exception(f"Login API error")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutAPIView(APIView):
    """
    API View for user logout. Clears the session.
    Requires user to be authenticated. (Does not use a serializer).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            logout(request)
            return Response(status=status.HTTP_200_OK)
        except Exception:   
            logger.exception(f"Logout API error")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)



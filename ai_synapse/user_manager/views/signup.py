import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


from ..serializers import SignupSerializer

logger = logging.getLogger(__name__)

class SignupAPIView(APIView):
    """
    API View for user signup using DRF Serializer.
    Expects JSON: {username, email, password, password2}
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            serializer = SignupSerializer(data=request.data)
            if serializer.is_valid():
                try:
                    user = serializer.save()
                    logger.info(f"Signup API successful (via serializer): {user.username} ({user.email})")
                    respose_data = {
                        'username': user.username,
                        'email': user.email,
                    }

                    return Response(respose_data, status=status.HTTP_201_CREATED)

                except Exception as e:
                    logger.exception(f"Unexpected error during user save via serializer: {e}")
                    return Response(status=status.HTTP_400_BAD_REQUEST)
            else:
                logger.warning(f"Signup API validation failed: {serializer.errors}")
                return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception(f"Signup API error")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)


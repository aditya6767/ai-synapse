import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Image
from user_manager.permissions import IsAuthenticatedUser

logger = logging.getLogger(__name__)

class ListImagesView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        try:
            images = Image.list_all() 
            images = {
                "images": images
            }
            return Response(images, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Unexpected error occurred: {str(e)}")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

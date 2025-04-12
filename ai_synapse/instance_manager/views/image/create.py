import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ai_synapse.instance_manager.models import Image
from ai_synapse.user_manager.permissions import IsAuthenticatedUser

logger = logging.getLogger(__name__)

class CreateImageView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        try:
            data = request.data
            name = data.get("name", None)
            tag = data.get("tag", None)
            description = data.get("description", "")
            os_name = data.get("os_name", "")
            os_version = data.get("os_version", "")
            cuda_version = data.get("cuda_version", "")
            cudnn_version = data.get("cudnn_version", "")
            is_available = data.get("is_available", False)
            Image.create(
                name=name,
                tag=tag,
                description=description,
                os_name=os_name,
                os_version=os_version,
                cuda_version=cuda_version,
                cudnn_version=cudnn_version,
                is_available=is_available
            )
            return Response(status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception(f"Unexpected error occurred")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
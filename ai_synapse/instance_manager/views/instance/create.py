import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Server, Instance
from user_manager.permissions import IsAuthenticatedUser

logger = logging.getLogger(__name__)

class CreateInstanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        try:
            account = request.user
            image = request.data.get("image", "default_image:latest")
            n_gpus = request.data.get("n_gpus") or 1 

            logger.info(f"User {account.username} requested an instance with image '{image}' and {n_gpus} GPUs.")

            available_server = Server.get_available_server()

            if not available_server:
                logger.error(f"No available servers for user {account.username} to start instance")
                return Response(status=status.HTTP_409_CONFLICT)

            instance_id: str = Instance.create(account, available_server, image, n_gpus)
            logger.info(f"Instance {instance_id} created successfully for user {account.username}")
            return Response(status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception(f"Unexpected error occurred")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
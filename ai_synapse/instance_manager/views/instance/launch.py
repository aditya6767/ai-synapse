import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Server, Instance
from user_manager.permissions import IsAuthenticatedUser

logger = logging.getLogger(__name__)

class LaunchInstanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        try:
            account = request.user
            email = account.email
            image_id = request.data.get("image_id", None)
            n_gpus = request.data.get("n_gpus") or 1 

            if image_id is None:
                logger.error(f"Image not provided for user {email}")
                return Response({"error": "Image not provided"}, status=status.HTTP_400_BAD_REQUEST)
            logger.info(f"User {account.username} requested an instance with image '{image_id}' and {n_gpus} GPUs.")

            available_server = Server.get_available_server()

            if not available_server:
                logger.error(f"No available servers for user {email} to start instance")
                return Response(status=status.HTTP_409_CONFLICT)

            instance_id: str = Instance.launch(account, available_server, image_id, n_gpus)
            logger.info(f"Instance {instance_id} launched successfully for user {email}")
            return Response(status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception(f"Unexpected error occurred")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
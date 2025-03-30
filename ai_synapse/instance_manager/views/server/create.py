import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ai_synapse.instance_manager.models import Server
from ai_synapse.user_manager.permissions import IsAdminUser

logger = logging.getLogger(__name__)

class CreateServerView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            account = request.user
            n_gpus = request.data.get("n_gpus") or 1 

            if not image:
                logger.warning("No image provided")
                image = "default_image:latest" #TODO: Replace with a default image

            # Find an available server without a running instance
            available_server = Server.objects.filter(is_active=True).exclude(instances__status="running").first()

            if not available_server:
                logger.error(f"No available servers for user {account.username} to start instance")
                return Response({"error": "No available servers"}, status=status.HTTP_400_BAD_REQUEST)

            tailscale_ip = Instance.start(account, available_server, image, n_gpus)

            if tailscale_ip is None:
                return Response({"error": "Couldn't start the instance"}, status=status.HTTP_400_BAD_REQUEST)

            return Response(status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception(f"Unexpected error occurred")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
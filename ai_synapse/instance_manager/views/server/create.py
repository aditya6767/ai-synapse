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
            server_name = request.data.get("name", None)
            n_gpus = request.data.get("n_gpus") or 1 
            ip_address = request.data.get("ip_address", None)

            if not server_name or not ip_address:
                logger.error("Server name and IP address are required to create a server")
                return Response(status=status.HTTP_400_BAD_REQUEST)

            Server.create(server_name, ip_address, n_gpus)
            return Response(status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception(f"Unexpected error occurred")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
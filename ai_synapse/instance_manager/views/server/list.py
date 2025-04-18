import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Server
from user_manager.permissions import IsAdminUser

logger = logging.getLogger(__name__)

class ListServersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            servers = Server.list_all() 
            servers_data = {
                "servers": servers
            }
            return Response(servers_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Unexpected error occurred: {str(e)}")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

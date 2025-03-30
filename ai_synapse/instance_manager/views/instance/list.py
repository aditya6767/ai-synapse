import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Instance
from user_manager.permissions import IsAuthenticatedUser

logger = logging.getLogger(__name__)

class ListInstancesView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def get(self, request):
        try:
            account = request.user
            instances = Instance.list_all(account) 
            instances_data = {
                "instances": instances
            }
            return Response(instances_data.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Unexpected error occurred: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

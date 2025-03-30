import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Instance
from user_manager.permissions import IsAuthenticatedUser

logger = logging.getLogger(__name__)


class StopInstanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        try:
            account = request.user
            instance_id = request.data.get("instance_id")

            if not instance_id:
                return Response({"error": "Instance ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                instance = Instance.objects.get(id=instance_id, account=account, status="running")
            except Instance.DoesNotExist:
                return Response({"error": "No running instance found with this ID"}, status=status.HTTP_404_NOT_FOUND)

            instance.stop()
            return Response({"message": "Instance stopped successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Unexpected error while stopping instance: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

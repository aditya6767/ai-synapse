import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Instance
from user_manager.permissions import IsAuthenticatedUser

logger = logging.getLogger(__name__)


class StartInstanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request):
        try:
            account = request.user
            instance_id = request.data.get("instance_id", None)

            if not instance_id:
                logger.error("Instance ID is required to stop the instance")
                return Response(status=status.HTTP_400_BAD_REQUEST)

            instance = Instance.objects.get(id=instance_id, account=account, status="running")
            instance.start()
            return Response(status=status.HTTP_200_OK)
        except Instance.DoesNotExist:
            logger.error(f"Instance with ID {instance_id} not found for user {account.username}")
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Unexpected error while stopping instance: {str(e)}")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

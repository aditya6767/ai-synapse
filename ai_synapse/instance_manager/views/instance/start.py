import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from instance_manager.models import Instance
from user_manager.permissions import IsAuthenticatedUser
from instance_manager.exceptions import InstanceAlreadyRunningException

logger = logging.getLogger(__name__)


class StartInstanceView(APIView):
    permission_classes = [IsAuthenticatedUser]

    def post(self, request, instance_id):
        try:
            account = request.user
            instance = Instance.objects.get(id=instance_id)
            instance.start()
            return Response(status=status.HTTP_200_OK)
        except InstanceAlreadyRunningException:
            logger.error(f"Instance with ID {instance_id} is already running for user {account.username}")
            return Response(status=status.HTTP_409_CONFLICT)
        except Instance.DoesNotExist:
            logger.error(f"Instance with ID {instance_id} not found for user {account.username}")
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Unexpected error while stopping instance: {str(e)}")
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

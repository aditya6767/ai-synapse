from django.urls import path
from .views import (
    LaunchInstanceView, 
    StopInstanceView, 
    StartInstanceView, 
    ListInstancesView, 
    ListImagesView,
    CreateImageView,
    ListServersView,
    CreateServerView,
)

urlpatterns = [
    path('api/instance/launch/', LaunchInstanceView.as_view(), name='create-instance'),
    path('api/instance/<int:instance_id>/stop/', StopInstanceView.as_view(), name='stop-instance'),
    path('api/instance/<int:instance_id>/start/', StartInstanceView.as_view(), name='start-instance'),
    path('api/instance/list/', ListInstancesView.as_view(), name='list-instance'),
    path('api/image/create/', CreateImageView.as_view(), name='create-image'),
    path('api/image/list/', ListImagesView.as_view(), name='list-image'),
    path('api/server/create/', CreateServerView.as_view(), name='create-server'),
    path('api/server/list/', ListServersView.as_view(), name='list-server'),
]

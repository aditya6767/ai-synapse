from django.urls import path
from .views import (
    CreateInstanceView, 
    StopInstanceView, 
    StartInstanceView, 
    ListInstancesView, 
    dashboard_view,
    ListImagesView,
    CreateImageView,
    ListServersView,
    CreateServerView,
)

urlpatterns = [
    path('', dashboard_view, name='dashboard'),
    path('api/instance/create/', CreateInstanceView.as_view(), name='create-instance'),
    path('api/instance/stop/', StopInstanceView.as_view(), name='stop-instance'),
    path('api/instance/start/', StartInstanceView.as_view(), name='start-instance'),
    path('api/instance/list/', ListInstancesView.as_view(), name='list-instance'),
    path('api/image/create/', CreateImageView.as_view(), name='create-image'),
    path('api/image/list/', ListImagesView.as_view(), name='list-image'),
    path('api/server/create/', CreateServerView.as_view(), name='create-server'),
    path('api/server/list/', ListServersView.as_view(), name='list-server'),
]

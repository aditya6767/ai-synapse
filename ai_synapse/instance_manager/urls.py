from django.urls import path
from .views import CreateInstanceView, StopInstanceView, StartInstanceView

urlpatterns = [
    path('instances/create/', CreateInstanceView.as_view(), name='create-instance'),
    path('instances/stop/', StopInstanceView.as_view(), name='stop-instance'),
    path('instances/start/', StartInstanceView.as_view(), name='start-instance'),
    path("admin/start-instance/", CreateInstanceView.as_view(), name="start_instance"),
]

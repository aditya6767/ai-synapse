from django.urls import path
from .views import LogoutAPIView, SignupAPIView, LoginAPIView

urlpatterns = [
    path('api/login/', LoginAPIView.as_view(), name='login'),
    path('api/logout/', LogoutAPIView.as_view(), name='logout'),
    path('api/signup/', SignupAPIView.as_view(), name='signup'),
]

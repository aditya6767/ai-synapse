from django.urls import path
from .views import LogoutAPIView, SignupAPIView, LoginAPIView, UserProfileAPIView

urlpatterns = [
    path('api/login/', LoginAPIView.as_view(), name='login'),
    path('api/logout/', LogoutAPIView.as_view(), name='logout'),
    path('api/signup/', SignupAPIView.as_view(), name='signup'),
    path('api/profile/', UserProfileAPIView.as_view(), name='profile'),
]

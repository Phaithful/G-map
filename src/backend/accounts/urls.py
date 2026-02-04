from django.urls import path
from . import views

urlpatterns = [
    path("auth/signup/", views.signup),
    path("auth/verify-email/", views.verify_email),
    path("auth/login/", views.login),

    path("auth/forgot-password/", views.forgot_password),
    path("auth/verify-reset-otp/", views.verify_reset_otp),
    path("auth/reset-password/", views.reset_password),
]

import uuid
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, EmailVerificationToken, PasswordResetOTP
from .serializers import (
    SignupSerializer, LoginSerializer, VerifyEmailSerializer,
    ForgotPasswordSerializer, VerifyResetOTPSerializer, ResetPasswordSerializer
)
from .utils import generate_otp, send_verification_email, send_reset_otp_email

def tokens_for_user(user: User):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    s = SignupSerializer(data=request.data)
    if not s.is_valid():
        return Response({"error": s.errors}, status=status.HTTP_400_BAD_REQUEST)

    name = s.validated_data["name"]
    email = s.validated_data["email"].lower()
    password = s.validated_data["password"]

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        user = User.objects.create_user(email=email, name=name, password=password)

        token_obj = EmailVerificationToken.objects.create(
            user=user,
            expires_at=EmailVerificationToken.expiry_time()
        )

        verify_link = f"{settings.FRONTEND_BASE_URL}/verify-email?token={token_obj.token}"
        send_verification_email(email, verify_link)

    return Response({"message": "Verification link sent to your email."}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    s = VerifyEmailSerializer(data=request.data)
    if not s.is_valid():
        return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

    token = s.validated_data["token"]

    try:
        token_obj = EmailVerificationToken.objects.select_related("user").get(token=token)
    except EmailVerificationToken.DoesNotExist:
        return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

    if token_obj.is_expired():
        token_obj.delete()
        return Response({"error": "Token expired. Please signup again."}, status=status.HTTP_400_BAD_REQUEST)

    user = token_obj.user
    user.is_verified = True
    user.save(update_fields=["is_verified"])

    # token used once
    token_obj.delete()

    # ✅ auto-login return JWT
    t = tokens_for_user(user)
    return Response({
        "message": "Email verified.",
        "access": t["access"],
        "refresh": t["refresh"],
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    s = LoginSerializer(data=request.data)
    if not s.is_valid():
        return Response({"error": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

    email = s.validated_data["email"].lower()
    password = s.validated_data["password"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(password):
        return Response({"error": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_verified:
        return Response({"error": "Please verify your email before logging in."}, status=status.HTTP_403_FORBIDDEN)

    t = tokens_for_user(user)
    return Response({
        "access": t["access"],
        "refresh": t["refresh"],
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    s = ForgotPasswordSerializer(data=request.data)
    if not s.is_valid():
        return Response({"error": "Enter a valid email."}, status=status.HTTP_400_BAD_REQUEST)

    email = s.validated_data["email"].lower()

    # IMPORTANT: don't reveal if email exists
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"message": "If that email exists, a code was sent."}, status=status.HTTP_200_OK)

    # create OTP
    code = generate_otp()
    expires_at = timezone.now() + timedelta(minutes=10)

    PasswordResetOTP.objects.filter(user=user).delete()  # keep only one active code
    PasswordResetOTP.objects.create(user=user, code=code, expires_at=expires_at)

    send_reset_otp_email(email, code)

    return Response({"message": "If that email exists, a code was sent."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_reset_otp(request):
    s = VerifyResetOTPSerializer(data=request.data)
    if not s.is_valid():
        return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

    email = s.validated_data["email"].lower()
    otp = s.validated_data["otp"]

    try:
        user = User.objects.get(email=email)
        otp_obj = PasswordResetOTP.objects.get(user=user)
    except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
        return Response({"error": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

    if otp_obj.is_expired():
        otp_obj.delete()
        return Response({"error": "Code expired. Please resend."}, status=status.HTTP_400_BAD_REQUEST)

    otp_obj.attempts += 1
    otp_obj.save(update_fields=["attempts"])

    if otp_obj.attempts > 5:
        otp_obj.delete()
        return Response({"error": "Too many attempts. Please resend code."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    if otp_obj.code != otp:
        return Response({"error": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

    # success -> generate resetToken (uuid)
    reset_token = str(uuid.uuid4())

    # store reset token temporarily in the otp record (simple & effective)
    otp_obj.code = reset_token
    otp_obj.expires_at = timezone.now() + timedelta(minutes=15)  # token expires
    otp_obj.attempts = 0
    otp_obj.save(update_fields=["code", "expires_at", "attempts"])

    return Response({"resetToken": reset_token}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    s = ResetPasswordSerializer(data=request.data)
    if not s.is_valid():
        return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

    reset_token = s.validated_data["resetToken"]
    new_password = s.validated_data["password"]

    # find the reset token in OTP table (we replaced code with reset token)
    try:
        otp_obj = PasswordResetOTP.objects.select_related("user").get(code=reset_token)
    except PasswordResetOTP.DoesNotExist:
        return Response({"error": "Invalid or expired reset token."}, status=status.HTTP_400_BAD_REQUEST)

    if otp_obj.is_expired():
        otp_obj.delete()
        return Response({"error": "Reset token expired. Please restart."}, status=status.HTTP_400_BAD_REQUEST)

    user = otp_obj.user
    user.set_password(new_password)
    user.save()

    otp_obj.delete()

    return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)

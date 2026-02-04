import random
from django.conf import settings
from django.core.mail import send_mail

def generate_otp():
    return f"{random.randint(0, 999999):06d}"

def send_verification_email(to_email: str, verify_link: str):
    subject = "Verify your G-Map account"
    message = f"Welcome to G-Map!\n\nClick this link to verify your email:\n{verify_link}\n\nThis link expires in 24 hours."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)

def send_reset_otp_email(to_email: str, code: str):
    subject = "G-Map password reset code"
    message = f"Your password reset code is: {code}\n\nThis code expires in 10 minutes."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)

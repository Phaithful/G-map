from django.core.mail import send_mail
from django.conf import settings

send_mail(
    "G-Map Email Test",
    "If you received this, email is working 🎉",
    settings.DEFAULT_FROM_EMAIL,
    ["faithfulmadu07@gmail.com"],
    fail_silently=False,
)

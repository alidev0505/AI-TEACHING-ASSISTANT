"""
Quick SMTP test — run this to check if your Gmail credentials work.
Usage:  python test_email.py
"""
import smtplib
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

SMTP_EMAIL    = os.getenv('SMTP_EMAIL', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
TEST_TO       = SMTP_EMAIL   # sends a test email to yourself

print(f"\n📧 SMTP_EMAIL    = {SMTP_EMAIL!r}")
print(f"📧 SMTP_PASSWORD = {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else '(empty)'}\n")

if not SMTP_EMAIL or SMTP_EMAIL == 'your-gmail@gmail.com':
    print("❌  SMTP_EMAIL is not set. Update backend/.env first.")
    exit(1)

if not SMTP_PASSWORD or SMTP_PASSWORD == 'your-app-password':
    print("❌  SMTP_PASSWORD is not set. Update backend/.env first.")
    print("   Get an App Password at: https://myaccount.google.com/apppasswords")
    exit(1)

try:
    msg = MIMEMultipart('alternative')
    msg['Subject'] = '✅ SMTP Test — AI Teaching Assistant'
    msg['From']    = SMTP_EMAIL
    msg['To']      = TEST_TO
    msg.attach(MIMEText('<h2>It works! 🎉</h2><p>Your email configuration is set up correctly.</p>', 'html'))

    print("🔗 Connecting to smtp.gmail.com:587 ...")
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.ehlo()
        server.starttls()
        print("🔑 Logging in ...")
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, TEST_TO, msg.as_string())

    print(f"\n✅ SUCCESS! Test email sent to {TEST_TO}")
    print("   Check your inbox (and spam folder).")

except smtplib.SMTPAuthenticationError:
    print("\n❌  AUTH FAILED — Gmail rejected your password.")
    print("   → You must use a Gmail APP PASSWORD, not your regular password.")
    print("   → Steps:")
    print("     1. Go to https://myaccount.google.com/security")
    print("     2. Enable 2-Step Verification (if not already on)")
    print("     3. Go to https://myaccount.google.com/apppasswords")
    print("     4. Create an app password → copy the 16 characters")
    print("     5. Paste it as SMTP_PASSWORD in backend/.env  (no spaces)")

except Exception as e:
    print(f"\n❌  Error: {type(e).__name__}: {e}")

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import resend
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'leocelestine.s@gmail.com')
SUPER_ADMIN_EMAIL = "leocelestine.s@gmail.com"
ADMIN_PHONE = os.environ.get('ADMIN_PHONE', '9600130807')
JWT_SECRET = os.environ.get('JWT_SECRET', 'hogwarts_secret')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================
# MODELS
# =========================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AdminOTPRequest(BaseModel):
    email: EmailStr

class AdminOTPVerify(BaseModel):
    email: EmailStr
    otp: str
    name: str
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    user_type: str = "admin"  # "admin" or "user"

class ResetPasswordVerify(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    user_type: str = "admin"

class ServiceCreate(BaseModel):
    name: str
    description: str
    price: Optional[str] = None
    price_type: str = "project"
    icon: str = "mic"
    image_url: Optional[str] = None
    requires_hours: bool = False

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    price_type: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    requires_hours: Optional[bool] = None

class ProjectCreate(BaseModel):
    name: str
    description: str
    work_type: str
    image_url: str
    featured: bool = True

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    work_type: Optional[str] = None
    image_url: Optional[str] = None
    featured: Optional[bool] = None

class BookingCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    service_id: str
    service_name: str
    description: str
    preferred_date: str
    preferred_time: str
    hours: Optional[int] = None

class BookingStatusUpdate(BaseModel):
    status: str

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class SiteSettingsUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_background: Optional[str] = None
    hero_gradient_from: Optional[str] = None
    hero_gradient_to: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    about_title: Optional[str] = None
    about_description: Optional[str] = None
    services_title: Optional[str] = None
    projects_title: Optional[str] = None
    cta_title: Optional[str] = None
    cta_subtitle: Optional[str] = None
    background_type: Optional[str] = None  # gradient, solid, texture, image
    background_value: Optional[str] = None  # color hex or image URL

class AdminAccessUpdate(BaseModel):
    access_level: str  # "basic", "full", "super"

class AdminSuspendUpdate(BaseModel):
    suspended: bool
    reason: Optional[str] = None

class ContactInfoUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    phone2: Optional[str] = None
    address: Optional[str] = None
    location_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    twitter_url: Optional[str] = None

class SiteContentUpdate(BaseModel):
    # Logo
    logo_url: Optional[str] = None
    logo_alt: Optional[str] = None
    # Navbar
    navbar_brand: Optional[str] = None
    navbar_brand_sub: Optional[str] = None
    nav_home: Optional[str] = None
    nav_services: Optional[str] = None
    nav_projects: Optional[str] = None
    nav_about: Optional[str] = None
    nav_careers: Optional[str] = None
    nav_booking: Optional[str] = None
    # Hero Section
    hero_badge: Optional[str] = None
    hero_title: Optional[str] = None
    hero_title_gradient: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_cta_text: Optional[str] = None
    hero_cta_secondary: Optional[str] = None
    # Services Section
    services_badge: Optional[str] = None
    services_title: Optional[str] = None
    services_subtitle: Optional[str] = None
    services_cta: Optional[str] = None
    # Projects Section
    projects_badge: Optional[str] = None
    projects_title: Optional[str] = None
    projects_subtitle: Optional[str] = None
    projects_cta: Optional[str] = None
    # About Section
    about_badge: Optional[str] = None
    about_title: Optional[str] = None
    about_subtitle: Optional[str] = None
    about_description: Optional[str] = None
    founder_name: Optional[str] = None
    founder_title: Optional[str] = None
    founder_bio: Optional[str] = None
    founder_imdb_url: Optional[str] = None
    founder_imdb_text: Optional[str] = None
    # CTA Section
    cta_title: Optional[str] = None
    cta_subtitle: Optional[str] = None
    cta_button_text: Optional[str] = None
    # Careers Section
    careers_badge: Optional[str] = None
    careers_title: Optional[str] = None
    careers_subtitle: Optional[str] = None
    careers_description: Optional[str] = None
    careers_intern_title: Optional[str] = None
    careers_intern_desc: Optional[str] = None
    careers_job_title: Optional[str] = None
    careers_job_desc: Optional[str] = None
    careers_form_title: Optional[str] = None
    careers_form_subtitle: Optional[str] = None
    # Applications Tab (Admin)
    applications_title: Optional[str] = None
    applications_subtitle: Optional[str] = None
    applications_empty_text: Optional[str] = None
    # Footer
    footer_tagline: Optional[str] = None
    footer_quick_links_title: Optional[str] = None
    footer_services_title: Optional[str] = None
    footer_contact_title: Optional[str] = None
    copyright_text: Optional[str] = None
    # Booking Page
    booking_badge: Optional[str] = None
    booking_title: Optional[str] = None
    booking_subtitle: Optional[str] = None

class AdminApprovalRequest(BaseModel):
    email: EmailStr
    name: str

class JobApplicationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    city: str
    position_type: str  # "intern" or "engineer"
    note: str
    portfolio_url: Optional[str] = None

# =========================
# AUTH HELPERS
# =========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(data: dict, expires_delta: timedelta = timedelta(days=7)) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_token(credentials.credentials)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

async def get_super_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "admin" or payload.get("email") != SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return payload

async def get_admin_with_full_access(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if payload.get("email") == SUPER_ADMIN_EMAIL:
        return payload
    admin = await db.admins.find_one({"id": payload.get("admin_id")}, {"_id": 0})
    if not admin or admin.get("access_level", "basic") not in ["full", "super"]:
        raise HTTPException(status_code=403, detail="Full access required")
    return payload

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

# =========================
# EMAIL HELPERS
# =========================

async def send_email(to: str, subject: str, html: str):
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}")
        return result
    except Exception as e:
        logger.error(f"Email error: {str(e)}")
        return None

async def send_booking_confirmation(booking: dict):
    """Send initial enquiry confirmation - NOT booking confirmation"""
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a1a1f 0%, #0d2229 100%); color: white; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: black; font-size: 28px;">Enquiry Received!</h1>
        </div>
        <div style="padding: 30px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 16px;">Thank you for your interest in Hogwarts Music Studio!</p>
            <p style="color: rgba(255,255,255,0.6); font-size: 14px;">We have received your enquiry and our team will review it shortly. You will receive a confirmation email once your booking is approved.</p>
            
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #f97316; margin-top: 0;">Enquiry Details</h3>
                <p><strong>Service:</strong> {booking['service_name']}</p>
                <p><strong>Preferred Date:</strong> {booking['preferred_date']}</p>
                <p><strong>Preferred Time:</strong> {booking['preferred_time']}</p>
                {"<p><strong>Hours Requested:</strong> " + str(booking.get('hours')) + " hours</p>" if booking.get('hours') else ""}
                <p><strong>Reference ID:</strong> <span style="color: #00d4d4;">{booking['id']}</span></p>
                <p><strong>Status:</strong> <span style="color: #fbbf24;">Pending Review</span></p>
            </div>
            
            <div style="background: rgba(0,212,212,0.1); border: 1px solid rgba(0,212,212,0.3); border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #00d4d4; font-size: 14px;">
                    <strong>Tip:</strong> Create an account on our website to track your booking status in real-time! (Optional)
                </p>
            </div>
            
            {('<div style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3); border-radius: 8px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #f97316; font-size: 14px;"><strong>Note:</strong> If extra hours are needed during the live session, additional charges will apply at the same hourly rate.</p></div>' if booking.get('hours') else '')}
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center;">
            <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                Hogwarts Music Studio | {ADMIN_EMAIL} | {ADMIN_PHONE}
            </p>
        </div>
    </div>
    """
    await send_email(booking['email'], f"Enquiry Received - {booking['service_name']} | Hogwarts Music Studio", html)

async def send_booking_status_update(booking: dict):
    """Send email when admin updates booking status"""
    status = booking['status']
    
    if status == 'confirmed' or status == 'approved':
        # Booking approved - send confirmation email
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a1a1f 0%, #0d2229 100%); color: white; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 28px;">🎉 Booking Confirmed!</h1>
            </div>
            <div style="padding: 30px;">
                <p style="color: rgba(255,255,255,0.9); font-size: 18px;">Great news! Your booking has been approved.</p>
                
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #10b981; margin-top: 0;">Confirmed Session Details</h3>
                    <p><strong>Service:</strong> {booking['service_name']}</p>
                    <p><strong>Date:</strong> {booking['preferred_date']}</p>
                    <p><strong>Time:</strong> {booking['preferred_time']}</p>
                    {"<p><strong>Hours Booked:</strong> " + str(booking.get('hours')) + " hours</p>" if booking.get('hours') else ""}
                    <p><strong>Booking ID:</strong> <span style="color: #00d4d4;">{booking['id']}</span></p>
                </div>
                
                <div style="background: rgba(16,185,129,0.1); border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #10b981; font-size: 14px;">
                        ✅ Your session is confirmed! We look forward to working with you.
                    </p>
                </div>
                
                <p style="color: rgba(255,255,255,0.6); font-size: 14px;">
                    Login to your account to track more details and manage your bookings.
                </p>
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center;">
                <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                    Hogwarts Music Studio | {ADMIN_EMAIL} | {ADMIN_PHONE}
                </p>
            </div>
        </div>
        """
        subject = f"✅ Booking Confirmed - {booking['service_name']} | Hogwarts Music Studio"
    elif status == 'completed':
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a1f; color: white; border-radius: 16px; padding: 30px;">
            <h2 style="color: #00d4d4;">Thank You! 🎵</h2>
            <p>Your session for <strong>{booking['service_name']}</strong> has been marked as completed.</p>
            <p style="color: rgba(255,255,255,0.6);">Thank you for choosing Hogwarts Music Studio. We hope you loved the experience!</p>
            <p style="color: #fbbf24;">We'd love to work with you again. Book your next session anytime!</p>
        </div>
        """
        subject = f"Session Completed - {booking['service_name']} | Hogwarts Music Studio"
    elif status == 'rejected' or status == 'cancelled':
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a1f; color: white; border-radius: 16px; padding: 30px;">
            <h2 style="color: #ef4444;">Booking Update</h2>
            <p>We regret to inform you that your booking for <strong>{booking['service_name']}</strong> could not be confirmed at this time.</p>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p><strong>Requested Date:</strong> {booking['preferred_date']}</p>
                <p><strong>Requested Time:</strong> {booking['preferred_time']}</p>
            </div>
            <p style="color: rgba(255,255,255,0.6);">Please feel free to submit a new enquiry for a different date/time, or contact us directly for assistance.</p>
            <p>Contact: <a href="mailto:{ADMIN_EMAIL}" style="color: #00d4d4;">{ADMIN_EMAIL}</a></p>
        </div>
        """
        subject = f"Booking Update - {booking['service_name']} | Hogwarts Music Studio"
    else:
        # Default/pending
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a1f; color: white; border-radius: 16px; padding: 30px;">
            <h2 style="color: #fbbf24;">Booking Status Update</h2>
            <p>Your booking for <strong>{booking['service_name']}</strong> has been updated.</p>
            <p><strong>Status:</strong> {status.title()}</p>
        </div>
        """
        subject = f"Booking Update - Hogwarts Music Studio"
    
    await send_email(booking['email'], subject, html)

async def send_admin_notification(booking: dict):
    html = f"""
    <div style="font-family: sans-serif; padding: 30px; background: #0a1a1f; color: white;">
        <h2 style="color: #f97316;">New Booking Received!</h2>
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Client:</strong> {booking['full_name']}</p>
            <p><strong>Email:</strong> {booking['email']}</p>
            <p><strong>Phone:</strong> {booking['phone']}</p>
            <p><strong>Service:</strong> {booking['service_name']}</p>
            <p><strong>Date:</strong> {booking['preferred_date']} at {booking['preferred_time']}</p>
            {"<p><strong>Hours:</strong> " + str(booking.get('hours', 'N/A')) + "</p>" if booking.get('hours') else ""}
            <p><strong>Description:</strong> {booking['description']}</p>
        </div>
        <p style="color: #fbbf24;">Please approve this booking in your admin dashboard.</p>
    </div>
    """
    await send_email(ADMIN_EMAIL, f"New Booking - {booking['full_name']}", html)

# =========================
# FILE UPLOAD
# =========================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_admin_with_full_access)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Return the API URL path that will work
    return {"url": f"/api/uploads/{filename}", "filename": filename}

@api_router.get("/uploads/{filename}")
async def get_upload(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)

# =========================
# USER AUTH
# =========================

@api_router.post("/auth/register")
async def register_user(user: UserCreate):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token({"user_id": user_doc["id"], "email": user.email, "role": "user"})
    return {"token": token, "user": {"id": user_doc["id"], "name": user.name, "email": user.email}}

@api_router.post("/auth/login")
async def login_user(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"user_id": user["id"], "email": user["email"], "role": "user"})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "admin":
        admin = await db.admins.find_one({"id": current_user.get("admin_id")}, {"_id": 0, "password": 0})
        if admin:
            admin["is_super_admin"] = admin.get("email") == SUPER_ADMIN_EMAIL
            return {"user": admin, "role": "admin"}
    
    user = await db.users.find_one({"id": current_user.get("user_id")}, {"_id": 0, "password": 0})
    if user:
        return {"user": user, "role": "user"}
    raise HTTPException(status_code=404, detail="User not found")

# =========================
# ADMIN AUTH
# =========================

@api_router.post("/admin/request-otp")
async def request_admin_otp(data: AdminOTPRequest):
    """Request OTP for admin registration. 
    For super admin email: OTP goes directly to them.
    For other emails: OTP goes to super admin for approval."""
    
    existing_admin = await db.admins.find_one({}, {"_id": 0})
    if not existing_admin and data.email != SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="First admin must be the super admin email")
    
    # Check if admin already exists
    existing = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered as an admin")
    
    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)  # Longer expiry for approval
    
    await db.otp_codes.delete_many({"email": data.email, "type": "admin_registration"})
    await db.otp_codes.insert_one({
        "email": data.email, 
        "otp": otp, 
        "expires": expires.isoformat(),
        "type": "admin_registration"
    })
    
    if data.email == SUPER_ADMIN_EMAIL:
        # Super admin gets OTP directly
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a1a1f 0%, #0d2229 100%); color: white; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #00d4d4 0%, #14b8a6 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: black; font-size: 28px;">Admin Registration</h1>
            </div>
            <div style="padding: 30px; text-align: center;">
                <p style="color: rgba(255,255,255,0.8); font-size: 16px;">Your verification code to register as Super Admin:</p>
                <h1 style="color: #00d4d4; letter-spacing: 10px; font-size: 48px; margin: 20px 0;">{otp}</h1>
                <p style="color: rgba(255,255,255,0.5); font-size: 14px;">This code expires in 30 minutes.</p>
            </div>
        </div>
        """
        await send_email(data.email, "Hogwarts Music Studio - Admin OTP", html)
        return {"message": "OTP sent to your email"}
    else:
        # For other admins, send OTP to super admin for approval
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a1a1f 0%, #0d2229 100%); color: white; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: black; font-size: 28px;">New Admin Registration Request</h1>
            </div>
            <div style="padding: 30px;">
                <p style="color: rgba(255,255,255,0.8); font-size: 16px;">Someone is requesting admin access:</p>
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 0; color: #f97316; font-size: 18px;"><strong>Email:</strong> {data.email}</p>
                </div>
                <p style="color: rgba(255,255,255,0.6);">To approve this registration, share this OTP with them:</p>
                <h1 style="color: #f97316; letter-spacing: 10px; font-size: 48px; margin: 20px 0; text-align: center;">{otp}</h1>
                <p style="color: rgba(255,255,255,0.5); font-size: 14px; text-align: center;">This code expires in 30 minutes.</p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #f97316;">
                    <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px;">If you did not expect this request, you can ignore this email.</p>
                </div>
            </div>
        </div>
        """
        await send_email(SUPER_ADMIN_EMAIL, f"Admin Registration Request - {data.email}", html)
        logger.info(f"Admin registration OTP for {data.email} sent to super admin")
        return {"message": "Registration request sent to super admin for approval. They will share the OTP with you."}

@api_router.post("/admin/verify-otp")
async def verify_admin_otp(data: AdminOTPVerify):
    otp_doc = await db.otp_codes.find_one({"email": data.email, "otp": data.otp, "type": "admin_registration"}, {"_id": 0})
    if not otp_doc:
        # Also check legacy format without type
        otp_doc = await db.otp_codes.find_one({"email": data.email, "otp": data.otp}, {"_id": 0})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if datetime.fromisoformat(otp_doc["expires"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    existing = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    is_super = data.email == SUPER_ADMIN_EMAIL
    admin_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "access_level": "super" if is_super else "basic",  # Default to basic for non-super admins
        "suspended": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    await db.otp_codes.delete_many({"email": data.email})
    
    token = create_token({"admin_id": admin_doc["id"], "email": data.email, "role": "admin"})
    return {"token": token, "admin": {"id": admin_doc["id"], "name": data.name, "email": data.email, "access_level": admin_doc["access_level"]}}

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if admin is suspended
    if admin.get("suspended") and admin["email"] != SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Your account has been suspended. Contact the super admin.")
    
    # Ensure super admin always has super access
    if admin["email"] == SUPER_ADMIN_EMAIL and admin.get("access_level") != "super":
        await db.admins.update_one({"email": SUPER_ADMIN_EMAIL}, {"$set": {"access_level": "super"}})
        admin["access_level"] = "super"
    
    token = create_token({"admin_id": admin["id"], "email": admin["email"], "role": "admin"})
    return {
        "token": token,
        "admin": {
            "id": admin["id"],
            "name": admin["name"],
            "email": admin["email"],
            "access_level": admin.get("access_level", "basic"),
            "is_super_admin": admin["email"] == SUPER_ADMIN_EMAIL
        }
    }

# =========================
# FORGOT PASSWORD & RESEND OTP
# =========================

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Request OTP for password reset - works for both admin and user"""
    if data.user_type == "admin":
        user = await db.admins.find_one({"email": data.email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Admin not found with this email")
    else:
        user = await db.users.find_one({"email": data.email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found with this email")
    
    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.otp_codes.delete_many({"email": data.email, "type": "password_reset"})
    await db.otp_codes.insert_one({
        "email": data.email, 
        "otp": otp, 
        "expires": expires.isoformat(),
        "type": "password_reset",
        "user_type": data.user_type
    })
    
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a1a1f 0%, #0d2229 100%); color: white; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: black; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 30px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); font-size: 16px;">You requested a password reset for your Hogwarts Music Studio account.</p>
            <p style="color: rgba(255,255,255,0.6);">Your verification code is:</p>
            <h1 style="color: #f97316; letter-spacing: 10px; font-size: 48px; margin: 20px 0;">{otp}</h1>
            <p style="color: rgba(255,255,255,0.5); font-size: 14px;">This code expires in 10 minutes.</p>
            <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        </div>
    </div>
    """
    await send_email(data.email, "Password Reset OTP - Hogwarts Music Studio", html)
    logger.info(f"Password reset OTP sent to {data.email}")
    return {"message": "OTP sent to your email", "email": data.email}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordVerify):
    """Verify OTP and reset password"""
    otp_doc = await db.otp_codes.find_one({
        "email": data.email, 
        "otp": data.otp, 
        "type": "password_reset"
    }, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if datetime.fromisoformat(otp_doc["expires"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    new_password_hash = hash_password(data.new_password)
    
    if data.user_type == "admin":
        result = await db.admins.update_one(
            {"email": data.email}, 
            {"$set": {"password": new_password_hash}}
        )
    else:
        result = await db.users.update_one(
            {"email": data.email}, 
            {"$set": {"password": new_password_hash}}
        )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.otp_codes.delete_many({"email": data.email, "type": "password_reset"})
    logger.info(f"Password reset successful for {data.email}")
    return {"message": "Password reset successful"}

@api_router.post("/admin/resend-otp")
async def resend_admin_otp(data: AdminOTPRequest):
    """Resend OTP for admin registration"""
    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.otp_codes.delete_many({"email": data.email, "type": {"$ne": "password_reset"}})
    await db.otp_codes.insert_one({"email": data.email, "otp": otp, "expires": expires.isoformat()})
    
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a1a1f 0%, #0d2229 100%); color: white; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00d4d4 0%, #14b8a6 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: black; font-size: 28px;">Verification Code</h1>
        </div>
        <div style="padding: 30px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); font-size: 16px;">Here's your new verification code:</p>
            <h1 style="color: #00d4d4; letter-spacing: 10px; font-size: 48px; margin: 20px 0;">{otp}</h1>
            <p style="color: rgba(255,255,255,0.5); font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
    </div>
    """
    await send_email(data.email, "New OTP - Hogwarts Music Studio", html)
    logger.info(f"OTP resent to {data.email}")
    return {"message": "OTP resent to email"}

# =========================
# ADMIN MANAGEMENT (Super Admin Only)
# =========================

@api_router.get("/admin/list")
async def list_admins(super_admin: dict = Depends(get_super_admin)):
    admins = await db.admins.find({}, {"_id": 0, "password": 0}).to_list(100)
    return admins

@api_router.put("/admin/{admin_id}/access")
async def update_admin_access(admin_id: str, data: AdminAccessUpdate, super_admin: dict = Depends(get_super_admin)):
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin.get("email") == SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot modify super admin")
    
    if data.access_level not in ["basic", "full"]:
        raise HTTPException(status_code=400, detail="Invalid access level")
    
    await db.admins.update_one({"id": admin_id}, {"$set": {"access_level": data.access_level}})
    return {"message": f"Access updated to {data.access_level}", "admin_id": admin_id}

@api_router.delete("/admin/{admin_id}")
async def delete_admin(admin_id: str, super_admin: dict = Depends(get_super_admin)):
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin.get("email") == SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot delete super admin")
    await db.admins.delete_one({"id": admin_id})
    return {"message": "Admin deleted"}

@api_router.put("/admin/{admin_id}/suspend")
async def suspend_admin(admin_id: str, data: AdminSuspendUpdate, super_admin: dict = Depends(get_super_admin)):
    """Suspend or unsuspend an admin (Super admin only)"""
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin.get("email") == SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot suspend the primary super admin")
    
    update_data = {"suspended": data.suspended}
    if data.reason:
        update_data["suspension_reason"] = data.reason
    if not data.suspended:
        update_data["suspension_reason"] = None
    
    await db.admins.update_one({"id": admin_id}, {"$set": update_data})
    action = "suspended" if data.suspended else "unsuspended"
    return {"message": f"Admin {action} successfully", "admin_id": admin_id}

# =========================
# CONTACT INFO & SITE CONTENT
# =========================

DEFAULT_CONTACT_INFO = {
    "id": "contact",
    "email": "leocelestine.s@gmail.com",
    "phone": "+91 9600130807",
    "phone2": "",
    "address": "Professional Recording Studio, India",
    "location_url": "https://share.google/g4DuYSZUP4hRejYRQ",
    "instagram_url": "",
    "youtube_url": "",
    "twitter_url": ""
}

DEFAULT_SITE_CONTENT = {
    "id": "content",
    # Logo
    "logo_url": "https://customer-assets.emergentagent.com/job_audio-haven-21/artifacts/kjwts159_HOGWARTS%20%20white%20bg%20only%20logo%20.jpg",
    "logo_alt": "Hogwarts Music Studio",
    # Navbar
    "navbar_brand": "Hogwarts",
    "navbar_brand_sub": "Music Studio",
    "nav_home": "Home",
    "nav_services": "Services",
    "nav_projects": "Projects",
    "nav_about": "About",
    "nav_careers": "Careers",
    "nav_booking": "Book Now",
    # Hero Section
    "hero_badge": "Professional Audio Post-Production",
    "hero_title": "Crafting",
    "hero_title_gradient": "Sonic Excellence",
    "hero_subtitle": "Where vision meets sound. Professional dubbing, mixing, mastering, and music production for films, series, and content creators.",
    "hero_cta_text": "Book a Session",
    "hero_cta_secondary": "Our Services",
    # Services Section
    "services_badge": "What We Offer",
    "services_title": "Our Services",
    "services_subtitle": "Professional audio services tailored to your needs",
    "services_cta": "View All Services",
    # Projects Section
    "projects_badge": "Our Work",
    "projects_title": "Featured Projects",
    "projects_subtitle": "Explore our latest work and collaborations",
    "projects_cta": "View All Projects",
    # About Section
    "about_badge": "About Us",
    "about_title": "Crafting Sound Since 2018",
    "about_subtitle": "Where passion meets precision",
    "about_description": "Hogwarts Music Studio is a professional audio post-production facility dedicated to delivering exceptional sound experiences. We combine cutting-edge technology with artistic vision to bring your projects to life.",
    "founder_name": "Leo Celestine",
    "founder_title": "Music Composer & Founder",
    "founder_bio": "With years of experience in music composition and audio production, Leo has worked on numerous films, series, and commercial projects, bringing creative vision to life through sound.",
    "founder_imdb_url": "https://www.imdb.com/name/nm15867951/?ref_=ext_shr_lnk",
    "founder_imdb_text": "View IMDB Profile",
    # CTA Section
    "cta_title": "Ready to Create Something Amazing?",
    "cta_subtitle": "Let's bring your audio vision to life. Book a session today.",
    "cta_button_text": "Start Your Project",
    # Careers Section
    "careers_badge": "Join Our Team",
    "careers_title": "Work With Us",
    "careers_subtitle": "Join Hogwarts Music Studio and be part of something extraordinary",
    "careers_description": "We're always looking for talented individuals to join our team. Whether you're an experienced sound engineer or a passionate intern looking to learn, we have opportunities for you.",
    "careers_intern_title": "Internship Program",
    "careers_intern_desc": "Learn from industry professionals and work on real projects. Perfect for students and aspiring audio engineers.",
    "careers_job_title": "Sound Engineers",
    "careers_job_desc": "Join our team of professional sound engineers. We offer competitive salaries and the chance to work on exciting projects.",
    "careers_form_title": "Apply Now",
    "careers_form_subtitle": "Tell us about yourself and we'll get back to you",
    # Applications Tab (Admin)
    "applications_title": "Job Applications",
    "applications_subtitle": "Review and manage job applications",
    "applications_empty_text": "No applications received yet.",
    # Footer
    "footer_tagline": "Professional audio post-production studio crafting sonic excellence for films, music, and content creators.",
    "footer_quick_links_title": "Quick Links",
    "footer_services_title": "Services",
    "footer_contact_title": "Contact",
    "copyright_text": "Hogwarts Music Studio. All rights reserved.",
    # Booking Page
    "booking_badge": "Book a Session",
    "booking_title": "Schedule Your Studio Session",
    "booking_subtitle": "No account required. Fill out the form and we'll handle the rest.",
}

@api_router.get("/settings/contact")
async def get_contact_info():
    """Get contact information (public)"""
    contact = await db.contact_info.find_one({"id": "contact"}, {"_id": 0})
    if not contact:
        await db.contact_info.insert_one(DEFAULT_CONTACT_INFO.copy())
        return DEFAULT_CONTACT_INFO
    return contact

@api_router.put("/settings/contact")
async def update_contact_info(data: ContactInfoUpdate, admin: dict = Depends(get_super_admin)):
    """Update contact information (Super admin only)"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    
    await db.contact_info.update_one({"id": "contact"}, {"$set": update_data}, upsert=True)
    updated = await db.contact_info.find_one({"id": "contact"}, {"_id": 0})
    return updated

@api_router.get("/settings/content")
async def get_site_content():
    """Get all site content/text (public)"""
    content = await db.site_content.find_one({"id": "content"}, {"_id": 0})
    if not content:
        await db.site_content.insert_one(DEFAULT_SITE_CONTENT.copy())
        return DEFAULT_SITE_CONTENT
    return content

@api_router.put("/settings/content")
async def update_site_content(data: SiteContentUpdate, admin: dict = Depends(get_super_admin)):
    """Update site content/text (Super admin only)"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    
    await db.site_content.update_one({"id": "content"}, {"$set": update_data}, upsert=True)
    updated = await db.site_content.find_one({"id": "content"}, {"_id": 0})
    return updated

# =========================
# SITE SETTINGS
# =========================

DEFAULT_SETTINGS = {
    "id": "main",
    "hero_title": "Crafting",
    "hero_title_gradient": "Sonic Excellence",
    "hero_subtitle": "Where vision meets sound. Professional dubbing, mixing, mastering, and music production for films, series, and content creators.",
    "hero_gradient_from": "#14b8a6",
    "hero_gradient_to": "#0a1a1f",
    "primary_color": "#00d4d4",
    "secondary_color": "#f97316",
    "accent_color": "#14b8a6",
    "about_title": "Crafting Sound Since 2018",
    "about_description": "Hogwarts Music Studio is a professional audio post-production facility dedicated to delivering exceptional sound experiences.",
    "services_title": "Our Services",
    "projects_title": "Featured Projects",
    "cta_title": "Ready to Create Something Amazing?",
    "cta_subtitle": "Let's bring your audio vision to life. Book a session today."
}

@api_router.get("/settings/site")
async def get_site_settings():
    settings = await db.site_settings.find_one({"id": "main"}, {"_id": 0})
    if not settings:
        await db.site_settings.insert_one(DEFAULT_SETTINGS.copy())
        return DEFAULT_SETTINGS
    return settings

@api_router.put("/settings/site")
async def update_site_settings(settings: SiteSettingsUpdate, admin: dict = Depends(get_super_admin)):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    
    await db.site_settings.update_one({"id": "main"}, {"$set": update_data}, upsert=True)
    updated = await db.site_settings.find_one({"id": "main"}, {"_id": 0})
    return updated

# =========================
# SERVICES
# =========================

DEFAULT_SERVICES = [
    {"id": str(uuid.uuid4()), "name": "Dubbing", "description": "Professional voice-over and dubbing services for films, series, and content.", "price": "₹299/hr", "price_type": "fixed", "icon": "mic-vocal", "image_url": "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&q=80", "requires_hours": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Vocal Recording", "description": "Crystal-clear vocal recording in our acoustically treated studio.", "price": "₹399/hr", "price_type": "fixed", "icon": "mic", "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80", "requires_hours": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Mixing", "description": "Expert audio mixing to achieve the perfect balance and clarity.", "price": None, "price_type": "project", "icon": "sliders", "image_url": "https://images.unsplash.com/photo-1563330232-57114bb0823c?auto=format&fit=crop&q=80", "requires_hours": False, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Mastering", "description": "Final polish and optimization for distribution-ready audio.", "price": None, "price_type": "project", "icon": "disc", "image_url": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80", "requires_hours": False, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "SFX & Foley", "description": "Custom sound effects and foley artistry for immersive audio.", "price": None, "price_type": "project", "icon": "volume-2", "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80", "requires_hours": False, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Music Production", "description": "Full-scale music production from composition to final master.", "price": None, "price_type": "project", "icon": "music", "image_url": "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80", "requires_hours": False, "created_at": datetime.now(timezone.utc).isoformat()}
]

@api_router.get("/services")
async def get_services():
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    if not services:
        for s in DEFAULT_SERVICES:
            await db.services.insert_one(s.copy())
        services = DEFAULT_SERVICES
    return services

@api_router.post("/services")
async def create_service(service: ServiceCreate, admin: dict = Depends(get_admin_with_full_access)):
    service_doc = {
        "id": str(uuid.uuid4()),
        **service.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.services.insert_one(service_doc)
    return await db.services.find_one({"id": service_doc["id"]}, {"_id": 0})

@api_router.put("/services/{service_id}")
async def update_service(service_id: str, service: ServiceUpdate, admin: dict = Depends(get_admin_with_full_access)):
    update_data = {k: v for k, v in service.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    result = await db.services.update_one({"id": service_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return await db.services.find_one({"id": service_id}, {"_id": 0})

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(get_admin_with_full_access)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# =========================
# PROJECTS
# =========================

DEFAULT_PROJECTS = [
    {"id": str(uuid.uuid4()), "name": "The Midnight Chronicles", "description": "Complete audio post-production for an indie feature film.", "work_type": "Mixing & Mastering", "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Echoes of Tomorrow", "description": "Original soundtrack composition and production.", "work_type": "Music Production", "image_url": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Voice of India", "description": "Hindi dubbing for international documentary series.", "work_type": "Dubbing", "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Neon Dreams Album", "description": "Full album production for electronic music artist.", "work_type": "Music Production", "image_url": "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
    {"id": str(uuid.uuid4()), "name": "Horror Soundscapes", "description": "Custom SFX and foley for horror game.", "work_type": "SFX & Foley", "image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()}
]

@api_router.get("/projects")
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    if not projects:
        for p in DEFAULT_PROJECTS:
            await db.projects.insert_one(p.copy())
        projects = DEFAULT_PROJECTS
    return projects

@api_router.post("/projects")
async def create_project(project: ProjectCreate, admin: dict = Depends(get_admin_with_full_access)):
    project_doc = {
        "id": str(uuid.uuid4()),
        **project.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project_doc)
    return await db.projects.find_one({"id": project_doc["id"]}, {"_id": 0})

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate, admin: dict = Depends(get_admin_with_full_access)):
    update_data = {k: v for k, v in project.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    result = await db.projects.update_one({"id": project_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, admin: dict = Depends(get_admin_with_full_access)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# =========================
# BOOKINGS
# =========================

@api_router.post("/bookings")
async def create_booking(booking: BookingCreate):
    booking_doc = {
        "id": str(uuid.uuid4()),
        **booking.model_dump(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    inserted = await db.bookings.find_one({"id": booking_doc["id"]}, {"_id": 0})
    
    # Send emails
    await send_booking_confirmation(inserted)
    await send_admin_notification(inserted)
    
    return {"message": "Booking created successfully", "booking": inserted}

@api_router.get("/bookings")
async def get_all_bookings(admin: dict = Depends(get_current_admin)):
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings

@api_router.get("/bookings/user")
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.get("user_id")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    bookings = await db.bookings.find({"email": user["email"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.get("/bookings/track/{booking_id}")
async def track_booking(booking_id: str, email: str):
    """Public endpoint to track booking by ID and email"""
    booking = await db.bookings.find_one({"id": booking_id, "email": email}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status_update: BookingStatusUpdate, admin: dict = Depends(get_current_admin)):
    result = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status_update.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    
    # Send status update email to client
    await send_booking_status_update(updated)
    
    return updated

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking deleted"}

# =========================
# JOB APPLICATIONS
# =========================

@api_router.post("/applications")
async def submit_application(data: JobApplicationCreate):
    """Submit a job application (public)"""
    application = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "city": data.city,
        "position_type": data.position_type,
        "note": data.note,
        "portfolio_url": data.portfolio_url,
        "status": "pending",  # pending, reviewed, contacted, rejected, hired
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.insert_one(application)
    
    # Send notification to admin
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a1f; color: white; border-radius: 16px; padding: 30px;">
        <h2 style="color: #00d4d4;">New Job Application Received</h2>
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Position:</strong> {'Internship' if data.position_type == 'intern' else 'Sound Engineer'}</p>
            <p><strong>Email:</strong> {data.email}</p>
            <p><strong>Phone:</strong> {data.phone}</p>
            <p><strong>City:</strong> {data.city}</p>
            {f'<p><strong>Portfolio:</strong> <a href="{data.portfolio_url}" style="color: #00d4d4;">{data.portfolio_url}</a></p>' if data.portfolio_url else ''}
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px;">
            <p><strong>Note from Applicant:</strong></p>
            <p style="color: rgba(255,255,255,0.8);">{data.note}</p>
        </div>
    </div>
    """
    await send_email(SUPER_ADMIN_EMAIL, f"New Application - {data.position_type.title()} - {data.name}", html)
    
    # Send confirmation to applicant
    applicant_html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a1a1f; color: white; border-radius: 16px; padding: 30px;">
        <h2 style="color: #00d4d4;">Application Received!</h2>
        <p>Hi {data.name},</p>
        <p>Thank you for your interest in joining Hogwarts Music Studio! We have received your application for the {'Internship Program' if data.position_type == 'intern' else 'Sound Engineer position'}.</p>
        <p style="color: rgba(255,255,255,0.6);">Our team will review your application and get back to you soon.</p>
        <div style="background: rgba(0,212,212,0.1); border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #00d4d4;">Application Reference: {application['id'][:8].upper()}</p>
        </div>
    </div>
    """
    await send_email(data.email, "Application Received - Hogwarts Music Studio", applicant_html)
    
    return {"message": "Application submitted successfully", "id": application["id"]}

@api_router.get("/applications")
async def get_applications(admin: dict = Depends(get_super_admin)):
    """Get all job applications (Super admin only)"""
    applications = await db.applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return applications

@api_router.put("/applications/{app_id}/status")
async def update_application_status(app_id: str, status: str, admin: dict = Depends(get_super_admin)):
    """Update application status (Super admin only)"""
    if status not in ["pending", "reviewed", "contacted", "rejected", "hired"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.applications.update_one(
        {"id": app_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"message": f"Application status updated to {status}"}

@api_router.delete("/applications/{app_id}")
async def delete_application(app_id: str, admin: dict = Depends(get_super_admin)):
    """Delete an application (Super admin only)"""
    result = await db.applications.delete_one({"id": app_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}

# =========================
# CHAT
# =========================

@api_router.post("/chat")
async def chat_with_ai(data: ChatMessage):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        session_id = data.session_id or str(uuid.uuid4())
        services = await db.services.find({}, {"_id": 0, "name": 1, "description": 1, "price": 1}).to_list(10)
        services_ctx = "\n".join([f"- {s['name']}: {s['description']} (Price: {s.get('price', 'Contact for pricing')})" for s in services])
        
        system_msg = f"""You are a friendly AI assistant for Hogwarts Music Studio, a professional audio post-production studio.

Services:
{services_ctx}

Contact: {ADMIN_EMAIL} | {ADMIN_PHONE}
Booking: Users can book directly through the website.

Be helpful, professional, and guide users to book services. Keep responses concise."""

        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system_msg).with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=data.message))
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return {"response": f"I apologize, but I'm having trouble. Please contact us at {ADMIN_EMAIL}", "session_id": data.session_id}

# =========================
# STATS
# =========================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    return {
        "total_bookings": await db.bookings.count_documents({}),
        "pending_bookings": await db.bookings.count_documents({"status": "pending"}),
        "confirmed_bookings": await db.bookings.count_documents({"status": "confirmed"}),
        "completed_bookings": await db.bookings.count_documents({"status": "completed"}),
        "total_services": await db.services.count_documents({}),
        "total_projects": await db.projects.count_documents({}),
        "total_admins": await db.admins.count_documents({})
    }

@api_router.get("/")
async def root():
    return {"message": "Hogwarts Music Studio API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
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
import base64
import shutil

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
SUPER_ADMIN_EMAIL = "leocelestine.s@gmail.com"  # The main super admin
ADMIN_PHONE = os.environ.get('ADMIN_PHONE', '9600130807')
JWT_SECRET = os.environ.get('JWT_SECRET', 'hogwarts_secret')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

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

class ServiceModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: Optional[str] = None
    price_type: str = "project"  # "fixed" or "project"
    icon: str = "mic"
    image_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ServiceCreate(BaseModel):
    name: str
    description: str
    price: Optional[str] = None
    price_type: str = "project"
    icon: str = "mic"
    image_url: Optional[str] = None

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    price_type: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None

class ProjectModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    work_type: str
    image_url: str
    featured: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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

class BookingModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: str
    phone: str
    service_id: str
    service_name: str
    description: str
    preferred_date: str
    preferred_time: str
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookingStatusUpdate(BaseModel):
    status: str

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class SiteSettings(BaseModel):
    id: str = "main"
    background_type: str = "gradient"  # "solid", "gradient", "texture", "image"
    background_value: str = "default"
    primary_color: str = "#00d4d4"
    secondary_color: str = "#f97316"
    accent_color: str = "#14b8a6"

class SiteSettingsUpdate(BaseModel):
    background_type: Optional[str] = None
    background_value: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None

class AdminApproval(BaseModel):
    admin_id: str
    has_full_access: bool

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
    payload = decode_token(credentials.credentials)
    return payload

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

async def get_super_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Only allows the super admin (leocelestine.s@gmail.com)"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if payload.get("email") != SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return payload

async def get_admin_with_full_access(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Allows super admin or approved admins with full access"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Super admin always has full access
    if payload.get("email") == SUPER_ADMIN_EMAIL:
        return payload
    
    # Check if admin has been granted full access
    admin = await db.admins.find_one({"id": payload.get("admin_id")}, {"_id": 0})
    if not admin or not admin.get("has_full_access", False):
        raise HTTPException(status_code=403, detail="Full website access not granted")
    return payload

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

# =========================
# EMAIL HELPERS
# =========================

async def send_email(to: str, subject: str, html: str):
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}: {result}")
        return result
    except Exception as e:
        logger.error(f"Email error: {str(e)}")
        return None

# =========================
# FILE UPLOAD HELPER
# =========================

async def save_upload_file(file: UploadFile) -> str:
    """Save uploaded file and return the URL path"""
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return f"/uploads/{unique_filename}"

# =========================
# USER AUTH ROUTES
# =========================

@api_router.post("/auth/register", response_model=dict)
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

@api_router.post("/auth/login", response_model=dict)
async def login_user(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"user_id": user["id"], "email": user["email"], "role": "user"})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@api_router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    # Check if admin first
    if current_user.get("role") == "admin":
        admin_id = current_user.get("admin_id")
        if admin_id:
            admin = await db.admins.find_one({"id": admin_id}, {"_id": 0, "password": 0})
            if admin:
                # Add super admin flag
                admin["is_super_admin"] = admin.get("email") == SUPER_ADMIN_EMAIL
                return {"user": admin, "role": "admin"}
    
    # Check regular user
    user_id = current_user.get("user_id")
    if user_id:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user:
            return {"user": user, "role": "user"}
    
    raise HTTPException(status_code=404, detail="User not found")

# =========================
# ADMIN AUTH ROUTES
# =========================

@api_router.post("/admin/request-otp")
async def request_admin_otp(data: AdminOTPRequest):
    # Allow only super admin email for initial registration, or existing admins can request
    existing_admin = await db.admins.find_one({}, {"_id": 0})
    if not existing_admin and data.email != SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="First admin must be the super admin email")
    
    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.otp_codes.delete_many({"email": data.email})
    await db.otp_codes.insert_one({
        "email": data.email,
        "otp": otp,
        "expires": expires.isoformat()
    })
    
    html = f"""
    <div style="font-family: sans-serif; padding: 20px; background: #0a1a1f; color: white;">
        <h2 style="color: #00d4d4;">Hogwarts Music Studio - Admin Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #f97316; letter-spacing: 8px;">{otp}</h1>
        <p>This code expires in 10 minutes.</p>
    </div>
    """
    await send_email(data.email, "Admin OTP Verification - Hogwarts Music Studio", html)
    return {"message": "OTP sent to email"}

@api_router.post("/admin/verify-otp")
async def verify_admin_otp(data: AdminOTPVerify):
    otp_doc = await db.otp_codes.find_one({"email": data.email, "otp": data.otp}, {"_id": 0})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.fromisoformat(otp_doc["expires"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    existing = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Check if this is the super admin
    is_super_admin = data.email == SUPER_ADMIN_EMAIL
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "is_super_admin": is_super_admin,
        "has_full_access": is_super_admin,  # Super admin always has full access
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    await db.otp_codes.delete_many({"email": data.email})
    
    token = create_token({"admin_id": admin_doc["id"], "email": data.email, "role": "admin"})
    return {"token": token, "admin": {"id": admin_doc["id"], "name": data.name, "email": data.email, "is_super_admin": is_super_admin}}

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"admin_id": admin["id"], "email": admin["email"], "role": "admin"})
    return {
        "token": token, 
        "admin": {
            "id": admin["id"], 
            "name": admin["name"], 
            "email": admin["email"],
            "is_super_admin": admin.get("is_super_admin", admin["email"] == SUPER_ADMIN_EMAIL),
            "has_full_access": admin.get("has_full_access", admin["email"] == SUPER_ADMIN_EMAIL)
        }
    }

# =========================
# ADMIN MANAGEMENT (Super Admin Only)
# =========================

@api_router.get("/admin/list")
async def list_admins(super_admin: dict = Depends(get_super_admin)):
    """List all admins - Super admin only"""
    admins = await db.admins.find({}, {"_id": 0, "password": 0}).to_list(100)
    return admins

@api_router.put("/admin/{admin_id}/access")
async def update_admin_access(admin_id: str, approval: AdminApproval, super_admin: dict = Depends(get_super_admin)):
    """Grant or revoke full website access to an admin - Super admin only"""
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if admin.get("email") == SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot modify super admin access")
    
    await db.admins.update_one(
        {"id": admin_id},
        {"$set": {"has_full_access": approval.has_full_access}}
    )
    
    return {"message": f"Admin access {'granted' if approval.has_full_access else 'revoked'}", "admin_id": admin_id}

@api_router.delete("/admin/{admin_id}")
async def delete_admin(admin_id: str, super_admin: dict = Depends(get_super_admin)):
    """Delete an admin - Super admin only"""
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if admin.get("email") == SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot delete super admin")
    
    await db.admins.delete_one({"id": admin_id})
    return {"message": "Admin deleted"}

# =========================
# FILE UPLOAD ROUTES
# =========================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_admin_with_full_access)):
    """Upload an image file - Returns the URL"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size (max 5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Reset file position
    await file.seek(0)
    
    file_url = await save_upload_file(file)
    
    # Return full URL
    return {"url": file_url, "message": "Image uploaded successfully"}

# =========================
# SERVICES ROUTES (with upload support)
# =========================

@api_router.get("/services", response_model=List[dict])
async def get_services():
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    if not services:
        # Seed default services
        default_services = [
            {"id": str(uuid.uuid4()), "name": "Dubbing", "description": "Professional voice-over and dubbing services for films, series, and content.", "price": "₹299/hr", "price_type": "fixed", "icon": "mic-vocal", "image_url": "https://images.unsplash.com/photo-1502209877429-d7c6df9eb3f9?crop=entropy&cs=srgb&fm=jpg&q=85", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Vocal Recording", "description": "Crystal-clear vocal recording in our acoustically treated studio.", "price": None, "price_type": "project", "icon": "mic", "image_url": "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&q=80", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Mixing", "description": "Expert audio mixing to achieve the perfect balance and clarity.", "price": None, "price_type": "project", "icon": "sliders", "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Mastering", "description": "Final polish and optimization for distribution-ready audio.", "price": None, "price_type": "project", "icon": "disc", "image_url": "https://images.unsplash.com/photo-1563330232-57114bb0823c?auto=format&fit=crop&q=80", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "SFX & Foley", "description": "Custom sound effects and foley artistry for immersive audio.", "price": None, "price_type": "project", "icon": "volume-2", "image_url": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Music Production", "description": "Full-scale music production from composition to final master.", "price": None, "price_type": "project", "icon": "music", "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80", "created_at": datetime.now(timezone.utc).isoformat()}
        ]
        for s in default_services:
            await db.services.insert_one(s)
        services = default_services
    return services

@api_router.post("/services", response_model=dict)
async def create_service(service: ServiceCreate, admin: dict = Depends(get_admin_with_full_access)):
    service_doc = ServiceModel(**service.model_dump()).model_dump()
    await db.services.insert_one(service_doc)
    created = await db.services.find_one({"id": service_doc["id"]}, {"_id": 0})
    return created

@api_router.put("/services/{service_id}", response_model=dict)
async def update_service(service_id: str, service: ServiceUpdate, admin: dict = Depends(get_admin_with_full_access)):
    update_data = {k: v for k, v in service.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    updated = await db.services.find_one({"id": service_id}, {"_id": 0})
    return updated

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(get_admin_with_full_access)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# =========================
# PROJECTS ROUTES (with upload support)
# =========================

@api_router.get("/projects", response_model=List[dict])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    if not projects:
        default_projects = [
            {"id": str(uuid.uuid4()), "name": "The Midnight Chronicles", "description": "Complete audio post-production for an indie feature film.", "work_type": "Mixing & Mastering", "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Echoes of Tomorrow", "description": "Original soundtrack composition and production.", "work_type": "Music Production", "image_url": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Voice of India", "description": "Hindi dubbing for international documentary series.", "work_type": "Dubbing", "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Neon Dreams Album", "description": "Full album production for electronic music artist.", "work_type": "Music Production", "image_url": "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Horror Soundscapes", "description": "Custom SFX and foley for horror game.", "work_type": "SFX & Foley", "image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80", "featured": True, "created_at": datetime.now(timezone.utc).isoformat()}
        ]
        for p in default_projects:
            await db.projects.insert_one(p)
        projects = default_projects
    return projects

@api_router.post("/projects", response_model=dict)
async def create_project(project: ProjectCreate, admin: dict = Depends(get_admin_with_full_access)):
    project_doc = ProjectModel(**project.model_dump()).model_dump()
    await db.projects.insert_one(project_doc)
    created = await db.projects.find_one({"id": project_doc["id"]}, {"_id": 0})
    return created

@api_router.put("/projects/{project_id}", response_model=dict)
async def update_project(project_id: str, project: ProjectUpdate, admin: dict = Depends(get_admin_with_full_access)):
    update_data = {k: v for k, v in project.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return updated

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, admin: dict = Depends(get_admin_with_full_access)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# =========================
# SITE SETTINGS ROUTES
# =========================

@api_router.get("/settings/site")
async def get_site_settings():
    """Get site settings (public)"""
    settings = await db.site_settings.find_one({"id": "main"}, {"_id": 0})
    if not settings:
        # Default settings
        settings = {
            "id": "main",
            "background_type": "gradient",
            "background_value": "default",
            "primary_color": "#00d4d4",
            "secondary_color": "#f97316",
            "accent_color": "#14b8a6"
        }
        await db.site_settings.insert_one(settings)
    return settings

@api_router.put("/settings/site")
async def update_site_settings(settings: SiteSettingsUpdate, admin: dict = Depends(get_admin_with_full_access)):
    """Update site settings - Requires full access"""
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    await db.site_settings.update_one(
        {"id": "main"},
        {"$set": update_data},
        upsert=True
    )
    updated = await db.site_settings.find_one({"id": "main"}, {"_id": 0})
    return updated

# =========================
# BOOKINGS ROUTES
# =========================

@api_router.post("/bookings", response_model=dict)
async def create_booking(booking: BookingCreate):
    booking_doc = BookingModel(**booking.model_dump()).model_dump()
    await db.bookings.insert_one(booking_doc)
    inserted_booking = await db.bookings.find_one({"id": booking_doc["id"]}, {"_id": 0})
    
    # Send confirmation email to user
    user_html = f"""
    <div style="font-family: 'Manrope', sans-serif; padding: 40px; background: linear-gradient(135deg, #0a1a1f 0%, #0d2229 100%); color: white; border-radius: 16px;">
        <h1 style="color: #00d4d4; margin-bottom: 24px;">Booking Confirmed!</h1>
        <p style="color: rgba(255,255,255,0.8); font-size: 16px;">Thank you for booking with Hogwarts Music Studio.</p>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #f97316; margin-bottom: 16px;">Booking Details</h3>
            <p><strong>Service:</strong> {booking.service_name}</p>
            <p><strong>Date:</strong> {booking.preferred_date}</p>
            <p><strong>Time:</strong> {booking.preferred_time}</p>
            <p><strong>Booking ID:</strong> {inserted_booking['id']}</p>
        </div>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px;">We'll contact you shortly to confirm your session.</p>
    </div>
    """
    await send_email(booking.email, f"Booking Confirmed - {booking.service_name}", user_html)
    
    # Send notification to admin
    admin_html = f"""
    <div style="font-family: 'Manrope', sans-serif; padding: 40px; background: #0a1a1f; color: white;">
        <h1 style="color: #00d4d4;">New Booking Received!</h1>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p><strong>Client:</strong> {booking.full_name}</p>
            <p><strong>Email:</strong> {booking.email}</p>
            <p><strong>Phone:</strong> {booking.phone}</p>
            <p><strong>Service:</strong> {booking.service_name}</p>
            <p><strong>Date:</strong> {booking.preferred_date}</p>
            <p><strong>Time:</strong> {booking.preferred_time}</p>
            <p><strong>Description:</strong> {booking.description}</p>
        </div>
    </div>
    """
    await send_email(ADMIN_EMAIL, f"New Booking - {booking.full_name}", admin_html)
    
    return {"message": "Booking created successfully", "booking": inserted_booking}

@api_router.get("/bookings", response_model=List[dict])
async def get_all_bookings(admin: dict = Depends(get_current_admin)):
    """All admins can see bookings"""
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings

@api_router.get("/bookings/user", response_model=List[dict])
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    bookings = await db.bookings.find({"email": user["email"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.put("/bookings/{booking_id}/status", response_model=dict)
async def update_booking_status(booking_id: str, status_update: BookingStatusUpdate, admin: dict = Depends(get_current_admin)):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": status_update.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking deleted"}

# =========================
# CHAT (AI) ROUTES
# =========================

@api_router.post("/chat")
async def chat_with_ai(data: ChatMessage):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        session_id = data.session_id or str(uuid.uuid4())
        
        services = await db.services.find({}, {"_id": 0, "name": 1, "description": 1, "price": 1}).to_list(10)
        services_context = "\n".join([f"- {s['name']}: {s['description']} (Price: {s.get('price', 'Contact for pricing')})" for s in services])
        
        system_message = f"""You are a friendly AI assistant for Hogwarts Music Studio, a professional audio post-production studio.

Available Services:
{services_context}

Studio Information:
- Location: Professional studio with state-of-the-art equipment
- Contact: {ADMIN_EMAIL} | Phone: {ADMIN_PHONE}
- Booking: Users can book directly through the website without registration

Be helpful, professional, and guide users to book services or learn more about the studio. Keep responses concise and friendly."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=data.message)
        response = await chat.send_message(user_message)
        
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return {"response": "I apologize, but I'm having trouble processing your request. Please try again or contact us directly at leocelestine.s@gmail.com", "session_id": data.session_id}

# =========================
# STATS (ADMIN)
# =========================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    total_bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
    completed_bookings = await db.bookings.count_documents({"status": "completed"})
    total_services = await db.services.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_admins = await db.admins.count_documents({})
    
    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "total_services": total_services,
        "total_projects": total_projects,
        "total_admins": total_admins
    }

# =========================
# ROOT
# =========================

@api_router.get("/")
async def root():
    return {"message": "Hogwarts Music Studio API"}

# Include router
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

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "hydrotent"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PLANT CATALOG ====================
MAX_PLANTS = 6

PLANT_CATALOG = [
    {"id": "lettuce", "name": "Lettuce", "days_to_harvest": 30, "image": "https://images.pexels.com/photos/6849628/pexels-photo-6849628.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop", "category": "Leafy Greens"},
    {"id": "basil", "name": "Basil", "days_to_harvest": 25, "image": "https://images.pexels.com/photos/35222890/pexels-photo-35222890.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop", "category": "Herbs"},
    {"id": "tomato", "name": "Tomato", "days_to_harvest": 80, "image": "https://images.pexels.com/photos/2858259/pexels-photo-2858259.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop", "category": "Fruits"},
    {"id": "strawberry", "name": "Strawberry", "days_to_harvest": 60, "image": "https://images.pexels.com/photos/16678046/pexels-photo-16678046.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop", "category": "Fruits"},
    {"id": "mint", "name": "Mint", "days_to_harvest": 20, "image": "https://images.pexels.com/photos/31510169/pexels-photo-31510169.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop", "category": "Herbs"},
    {"id": "spinach", "name": "Spinach", "days_to_harvest": 40, "image": "https://images.pexels.com/photos/30801724/pexels-photo-30801724.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop", "category": "Leafy Greens"},
]

# ==================== MODELS ====================
class PlantCreate(BaseModel):
    catalog_id: str
    nickname: Optional[str] = None

class PlantResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    catalog_id: str
    name: str
    nickname: Optional[str] = None
    days_to_harvest: int
    category: str
    planted_at: str
    status: str = "growing"

class TentStatus(BaseModel):
    temperature: float = 22.5
    humidity: float = 65.0
    water_level: float = 75.0
    nutrient_level: float = 60.0
    ph_level: float = 6.2
    light_hours: int = 16
    fan_speed: int = 2

class NotificationResponse(BaseModel):
    id: str
    type: str
    message: str
    severity: str
    created_at: str
    read: bool = False

class ChatRequest(BaseModel):
    message: str
    model: str = "claude"

class TutorialCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    youtube_url: Optional[str] = None
    plant_type: Optional[str] = None

class HarvestCreate(BaseModel):
    plant_id: str
    notes: Optional[str] = ""

# ==================== PLANT ROUTES ====================
@api_router.get("/plants/catalog")
async def get_catalog():
    return PLANT_CATALOG

@api_router.post("/plants")
async def add_plant(plant: PlantCreate):
    catalog_item = next((p for p in PLANT_CATALOG if p["id"] == plant.catalog_id), None)
    if not catalog_item:
        raise HTTPException(status_code=404, detail="Plant not found in catalog")
    
    current_count = await db.plants.count_documents({"status": "growing"})
    if current_count >= MAX_PLANTS:
        raise HTTPException(status_code=400, detail="Maximum 6 plants allowed in the tent")
    
    plant_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": plant_id,
        "catalog_id": plant.catalog_id,
        "name": catalog_item["name"],
        "nickname": plant.nickname or catalog_item["name"],
        "days_to_harvest": catalog_item["days_to_harvest"],
        "category": catalog_item["category"],
        "image": catalog_item.get("image", ""),
        "planted_at": now,
        "status": "growing",
        "slot": current_count,
    }
    await db.plants.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/plants")
async def get_plants():
    plants = await db.plants.find({}, {"_id": 0}).to_list(100)
    return plants

@api_router.delete("/plants/{plant_id}")
async def remove_plant(plant_id: str):
    result = await db.plants.delete_one({"id": plant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")
    return {"message": "Plant removed"}

@api_router.put("/plants/{plant_id}/harvest")
async def harvest_plant(plant_id: str):
    result = await db.plants.find_one_and_update(
        {"id": plant_id},
        {"$set": {"status": "harvested", "harvested_at": datetime.now(timezone.utc).isoformat()}},
        return_document=False
    )
    if not result:
        raise HTTPException(status_code=404, detail="Plant not found")
    plant = await db.plants.find_one({"id": plant_id}, {"_id": 0})
    
    # Add to community feed
    await db.community_feed.insert_one({
        "id": str(uuid.uuid4()),
        "plant_name": plant["name"],
        "nickname": plant.get("nickname", plant["name"]),
        "harvested_at": datetime.now(timezone.utc).isoformat(),
        "notes": "",
    })
    return plant

# ==================== TENT STATUS ROUTES ====================
@api_router.get("/tent/status")
async def get_tent_status():
    status = await db.tent_status.find_one({"key": "current"}, {"_id": 0})
    if not status:
        default = TentStatus().model_dump()
        default["key"] = "current"
        await db.tent_status.insert_one(default)
        default.pop("_id", None)
        default.pop("key", None)
        return default
    status.pop("key", None)
    return status

@api_router.put("/tent/status")
async def update_tent_status(status: TentStatus):
    doc = status.model_dump()
    doc["key"] = "current"
    await db.tent_status.update_one({"key": "current"}, {"$set": doc}, upsert=True)
    doc.pop("key", None)
    doc.pop("_id", None)
    return doc

# ==================== NOTIFICATIONS ROUTES ====================
@api_router.get("/notifications")
async def get_notifications():
    notifs = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifs

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str):
    await db.notifications.update_one({"id": notif_id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

@api_router.post("/notifications/check")
async def check_notifications():
    plants = await db.plants.find({"status": "growing"}, {"_id": 0}).to_list(100)
    tent = await db.tent_status.find_one({"key": "current"}, {"_id": 0})
    new_notifs = []
    now = datetime.now(timezone.utc)
    
    for plant in plants:
        planted_at = datetime.fromisoformat(plant["planted_at"])
        days_elapsed = (now - planted_at).days
        days_left = plant["days_to_harvest"] - days_elapsed
        
        if days_left <= 0:
            existing = await db.notifications.find_one({
                "plant_id": plant["id"], "type": "harvest_ready", "read": False
            })
            if not existing:
                notif = {
                    "id": str(uuid.uuid4()),
                    "type": "harvest_ready",
                    "message": f"{plant.get('nickname', plant['name'])} is ready to harvest!",
                    "severity": "success",
                    "plant_id": plant["id"],
                    "created_at": now.isoformat(),
                    "read": False,
                }
                await db.notifications.insert_one(notif)
                notif.pop("_id", None)
                new_notifs.append(notif)
        elif days_left <= 3:
            existing = await db.notifications.find_one({
                "plant_id": plant["id"], "type": "harvest_soon", "read": False
            })
            if not existing:
                notif = {
                    "id": str(uuid.uuid4()),
                    "type": "harvest_soon",
                    "message": f"{plant.get('nickname', plant['name'])} will be ready in {days_left} days",
                    "severity": "info",
                    "plant_id": plant["id"],
                    "created_at": now.isoformat(),
                    "read": False,
                }
                await db.notifications.insert_one(notif)
                notif.pop("_id", None)
                new_notifs.append(notif)

    if tent:
        water = tent.get("water_level", 75)
        nutrient = tent.get("nutrient_level", 60)
        if water < 30:
            existing = await db.notifications.find_one({"type": "low_water", "read": False})
            if not existing:
                notif = {
                    "id": str(uuid.uuid4()),
                    "type": "low_water",
                    "message": f"Water level is low — refill needed",
                    "severity": "warning",
                    "plant_id": None,
                    "created_at": now.isoformat(),
                    "read": False,
                }
                await db.notifications.insert_one(notif)
                notif.pop("_id", None)
                new_notifs.append(notif)
        if nutrient < 25:
            existing = await db.notifications.find_one({"type": "low_nutrients", "read": False})
            if not existing:
                notif = {
                    "id": str(uuid.uuid4()),
                    "type": "low_nutrients",
                    "message": "Nutrients running low — top up",
                    "severity": "warning",
                    "plant_id": None,
                    "created_at": now.isoformat(),
                    "read": False,
                }
                await db.notifications.insert_one(notif)
                notif.pop("_id", None)
                new_notifs.append(notif)
    
    return {"new_notifications": new_notifs, "count": len(new_notifs)}

# ==================== AI CHAT ROUTES ====================
@api_router.post("/ai/chat")
async def ai_chat(req: ChatRequest):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    session_id = f"hydrotent-{uuid.uuid4().hex[:8]}"
    
    system_msg = (
        "You are HydroTent AI, a knowledgeable hydroponic gardening assistant. "
        "You help users with planting techniques, nutrient management, troubleshooting, "
        "and general hydroponic gardening advice. Keep answers practical, concise, and friendly. "
        "Use bullet points when listing steps. Focus on hydroponic/indoor growing methods."
    )
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_msg,
    )
    
    if req.model == "gpt":
        chat.with_model("openai", "gpt-5.2")
    else:
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    user_message = UserMessage(text=req.message)
    response = await chat.send_message(user_message)
    
    # Store in DB
    chat_doc = {
        "id": str(uuid.uuid4()),
        "question": req.message,
        "answer": response,
        "model": req.model,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_chats.insert_one(chat_doc)
    chat_doc.pop("_id", None)
    return chat_doc

@api_router.get("/ai/history")
async def get_chat_history():
    chats = await db.ai_chats.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return chats

# ==================== TUTORIAL ROUTES ====================
@api_router.post("/tutorials")
async def add_tutorial(tutorial: TutorialCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "title": tutorial.title,
        "description": tutorial.description,
        "youtube_url": tutorial.youtube_url,
        "video_path": None,
        "plant_type": tutorial.plant_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_deleted": False,
    }
    await db.tutorials.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.post("/tutorials/upload")
async def upload_tutorial_video(
    file: UploadFile = File(...),
    title: str = "Untitled Tutorial",
    description: str = "",
    plant_type: str = "",
):
    allowed_types = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only video files are allowed")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    path = f"{APP_NAME}/tutorials/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "video/mp4")
    
    doc = {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": description,
        "youtube_url": None,
        "video_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "plant_type": plant_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_deleted": False,
    }
    await db.tutorials.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/tutorials")
async def get_tutorials():
    tutorials = await db.tutorials.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tutorials

@api_router.delete("/tutorials/{tutorial_id}")
async def delete_tutorial(tutorial_id: str):
    await db.tutorials.update_one({"id": tutorial_id}, {"$set": {"is_deleted": True}})
    return {"message": "Tutorial deleted"}

@api_router.get("/tutorials/video/{path:path}")
async def stream_video(path: str):
    record = await db.tutorials.find_one({"video_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Video not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ==================== COMMUNITY ROUTES ====================
@api_router.get("/community/feed")
async def get_community_feed():
    feed = await db.community_feed.find({}, {"_id": 0}).sort("harvested_at", -1).to_list(50)
    return feed

@api_router.post("/community/harvest")
async def log_harvest(harvest: HarvestCreate):
    plant = await db.plants.find_one({"id": harvest.plant_id}, {"_id": 0})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    doc = {
        "id": str(uuid.uuid4()),
        "plant_name": plant["name"],
        "nickname": plant.get("nickname", plant["name"]),
        "harvested_at": datetime.now(timezone.utc).isoformat(),
        "notes": harvest.notes or "",
    }
    await db.community_feed.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/")
async def root():
    return {"message": "HydroTent API is running"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

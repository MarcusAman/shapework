import os
from dotenv import load_dotenv

# Load workspace and local configurations
load_dotenv()

TAPO_IP = os.getenv("TAPO_IP", "192.168.1.100")
TAPO_USER = os.getenv("TAPO_USER", "admin")
TAPO_PASS = os.getenv("TAPO_PASS", "SecurePassword123")  # Camera Account password config

RTSP_URL = f"rtsp://{TAPO_USER}:{TAPO_PASS}@{TAPO_IP}:554/stream1"

SHAPEWORK_API_URL = os.getenv("SHAPEWORK_API_URL", "http://localhost:3000")
SHAPEWORK_TOKEN = os.getenv("SHAPEWORK_TOKEN", "token_usr_sarah")
WORKSPACE_ID = os.getenv("WORKSPACE_ID", "nest-realty-demo")

YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")  # Can use custom weights if trained
DETECTION_CONFIDENCE = float(os.getenv("DETECTION_CONFIDENCE", "0.5"))
TRIPWIRE_X = int(os.getenv("TRIPWIRE_X", "960")) # Center boundary threshold for 1080p
COOLDOWN_SECONDS = int(os.getenv("COOLDOWN_SECONDS", "10"))

# Tapo Camera AI Vision Worker

This background worker monitors the physical yard signs storage area in real-time, processes live streams when motion is detected, extracts asset tags & agent names, and updates the Shapework Asset Ledger automatically.

---

## 1. Prerequisites & Installation

### A. Python Environment
This script requires **Python 3.8+** with OpenCV, PyTorch (for YOLOv8), and EasyOCR.

```bash
# 1. Navigate to the worker folder
cd scripts/tapo-ai-worker

# 2. Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install packages
pip install -r requirements.txt
```

---

## 2. Configuration Settings

Create a `.env` file in `scripts/tapo-ai-worker/` containing:

```env
# 1. Tapo Camera Parameters
TAPO_IP=192.168.1.100              # Replace with your camera's IP Address
TAPO_USER=admin                    # Camera Account username
TAPO_PASS=SecurePassword123        # Camera Account password

# 2. Shapework REST API Connection
SHAPEWORK_API_URL=http://localhost:3000
SHAPEWORK_TOKEN=token_usr_sarah    # Active authentication token
WORKSPACE_ID=nest-realty-demo

# 3. Vision Engine Parameters
YOLO_MODEL_PATH=yolov8n.pt          # Path to weights
DETECTION_CONFIDENCE=0.5
TRIPWIRE_X=960                     # Tripwire vertical division (x axis)
COOLDOWN_SECONDS=10
```

---

## 3. Running the Worker Live

Once the `.env` settings are updated, run:

```bash
python3 main.py
```

### Flow of Events:
1. The script subscribes to the Tapo camera's **ONVIF motion triggers**.
2. When motion begins, it opens the local RTSP high-quality camera stream.
3. The frames are processed by **YOLOv8** to locate signs.
4. **EasyOCR** crops the sign and reads text, matching names to active Nest agents.
5. Centroid coordinates track if they cross the door tripwire (triggering `checkout` or `checkin`).
6. It hits `/api/ops/assets/checkout` or `/api/ops/assets/checkin` on the Shapework server, updating the active ledger dynamically.

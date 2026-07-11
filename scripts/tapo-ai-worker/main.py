import time
import os
import sys
from onvif_listener import OnvifMotionListener
from camera_stream import ThreadedRTSPStream
from yolo_detector import YoloDetector
from easy_ocr import EasyOcrExtractor
from shapework_client import ShapeworkApiClient
from tracking_service import CentroidTracker

# Known list of Nest Realty Wilmington agents to fuzzy match scanned sign names
KNOWN_AGENTS = [
    "Sarah Jenkins", "Diane Ross", "Marcus", "Adam", "Matt", 
    "Ann Gunn", "Melissa Gagliardi", "Ryan Crecelius"
]

class VisionLedgerWorker:
    def __init__(self):
        self.stream = ThreadedRTSPStream()
        self.detector = YoloDetector()
        self.ocr = EasyOcrExtractor()
        self.api_client = ShapeworkApiClient()
        self.tracker = CentroidTracker()
        
        self.motion_active = False
        self.listener = OnvifMotionListener(self.handle_motion_event)

    def handle_motion_event(self, motion_detected: bool):
        if motion_detected and not self.motion_active:
            print("[Orchestrator] Motion detected by Tapo sensor! Booting RTSP stream...")
            self.motion_active = True
            self.stream.start()
        elif not motion_detected and self.motion_active:
            print("[Orchestrator] Motion stopped. Putting stream to sleep...")
            self.motion_active = False
            self.stream.stop()

    def run(self):
        print("[System] Background worker starting. Listening for Tapo ONVIF motion...")
        self.listener.start()
        
        try:
            while True:
                if self.motion_active:
                    frame = self.stream.get_latest_frame()
                    if frame is None:
                        time.sleep(0.01)
                        continue

                    # 1. YOLO detect yard sign bounding boxes
                    boxes = self.detector.detect_signs(frame)
                    
                    for (x1, y1, x2, y2) in boxes:
                        crop = frame[y1:y2, x1:x2]
                        if crop.size == 0:
                            continue

                        # 2. Extract OCR details
                        asset_code, raw_text = self.ocr.extract_details(crop)
                        if asset_code:
                            # Search for matching agent names in OCR text
                            matched_agent = None
                            for agent in KNOWN_AGENTS:
                                if agent.lower() in raw_text.lower():
                                    matched_agent = agent
                                    break
                            
                            # Calculate center coordinate
                            center_x = (x1 + x2) // 2
                            
                            # 3. Track tripwire crossing
                            direction = self.tracker.process_movement(asset_code, center_x)
                            
                            if direction:
                                print(f"[MATCH SUCCESS] Detected {asset_code} moving {direction} by agent: {matched_agent or 'Unknown'}")
                                # 4. Update Shapework REST ledger API
                                self.api_client.update_ledger(asset_code, matched_agent, direction)
                                
                    time.sleep(0.1)  # Throttle processing during motion (10 fps)
                else:
                    time.sleep(1.0)  # Idle loop
        except KeyboardInterrupt:
            print("[System] Shutting down Tapo AI worker...")
            self.listener.stop()
            self.stream.stop()

if __name__ == "__main__":
    worker = VisionLedgerWorker()
    worker.run()

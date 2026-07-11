import time
import threading
from onvif import ONVIFCamera
import config

class OnvifMotionListener:
    def __init__(self, callback):
        self.callback = callback
        self.running = False
        self.thread = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False

    def _run(self):
        while self.running:
            try:
                # Tapo ONVIF listener on port 2020
                mycam = ONVIFCamera(
                    config.TAPO_IP, 
                    2020, 
                    config.TAPO_USER, 
                    config.TAPO_PASS
                )
                events_service = mycam.create_events_service()
                pullpoint = events_service.CreatePullPointSubscription()
                
                print("[ONVIF] Successfully subscribed to Tapo camera event stream.")
                
                while self.running:
                    messages = pullpoint.PullMessages({'Timeout': 'PT5S'})
                    for msg in messages:
                        topic = msg.Topic._value_1
                        # Filter for cell motion or smart detection alerts
                        if "RuleEngine/CellMotionDetector/Motion" in topic or "MotionAlarm" in topic:
                            is_motion = msg.Message.Data.SimpleItem[0].Value
                            if is_motion == "true" or is_motion is True:
                                print(f"[ONVIF] Motion Alert Detected: {topic}")
                                self.callback(True)
                            else:
                                self.callback(False)
            except Exception as e:
                print(f"[ONVIF] Connection error or ONVIF port closed: {e}. Retrying in 10s...")
                time.sleep(10)

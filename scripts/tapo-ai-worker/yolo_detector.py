from ultralytics import YOLO
import config

class YoloDetector:
    def __init__(self):
        # We load a YOLOv8 model (which can be custom trained on yard signs)
        self.model = YOLO(config.YOLO_MODEL_PATH)
        
    def detect_signs(self, frame):
        results = self.model(frame, verbose=False)
        detected_boxes = []
        
        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                if conf < config.DETECTION_CONFIDENCE:
                    continue
                # Class mapping: class 11 is stop_sign, or class 9 is bench.
                # In custom weights, class 0 would represent 'yard_sign'.
                # For demo purposes, we will return bounding boxes of detected signs.
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detected_boxes.append((x1, y1, x2, y2))
        return detected_boxes

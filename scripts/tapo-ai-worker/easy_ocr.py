import cv2
import easyocr
import re

class EasyOcrExtractor:
    def __init__(self):
        # Initialize easyocr reader (will download weights on first run)
        self.reader = easyocr.Reader(['en'], gpu=False) # CPU by default for portability
        self.asset_code_regex = re.compile(r'NS-YS-\d{3}')

    def preprocess_crop(self, crop):
        # Convert to grayscale
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # Apply thresholding to increase text contrast
        processed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        return processed

    def extract_details(self, crop):
        processed = self.preprocess_crop(crop)
        ocr_results = self.reader.readtext(processed)
        
        extracted_text = " ".join([res[1] for res in ocr_results])
        print(f"[OCR] Scanned Text: '{extracted_text}'")
        
        # Regex search for Asset Code (e.g. NS-YS-001)
        code_match = self.asset_code_regex.search(extracted_text)
        asset_code = code_match.group(0) if code_match else None
        
        return asset_code, extracted_text

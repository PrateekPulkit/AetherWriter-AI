import pytesseract
from PIL import Image
import io
import os

class OCRService:
    def __init__(self):
        # On Windows, you might need to specify the path to tesseract.exe
        # Common path: r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path

    def extract_text(self, image_bytes):
        try:
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            print(f"OCR Error: {e}")
            return f"Error extracting text: {e}. Please ensure Tesseract OCR is installed on your system."

ocr_service = OCRService()
extract_text = ocr_service.extract_text

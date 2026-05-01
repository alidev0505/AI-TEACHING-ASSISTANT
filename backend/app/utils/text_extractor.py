import os
import PyPDF2
import docx
import pytesseract
from pdf2image import convert_from_path
from PIL import Image

# ✅ CONFIGURATION: Set Tesseract Path (Windows Only)
# If you are on Mac/Linux, you can usually comment this out.
# If you are on Windows, uncomment the line below and ensure the path is correct.
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_file(file_path):
    """
    Reads a file (PDF, DOCX, TXT) and returns its text content.
    Automatically handles scanned PDFs via OCR fallback.
    """
    if not os.path.exists(file_path):
        return ""

    ext = file_path.rsplit('.', 1)[1].lower()
    text = ""

    try:
        if ext == 'pdf':
            # 1. Try standard extraction first (fast)
            text = _extract_from_standard_pdf(file_path)
            
            # 2. If text is empty or very short, assume it's a scanned image -> Run OCR
            if not text or len(text.strip()) < 50: 
                print(f"⚠️ PDF ({file_path}) seems scanned or empty. Attempting OCR...")
                text = _extract_from_scanned_pdf(file_path)

        elif ext == 'docx':
            text = _extract_from_docx(file_path)
            
        elif ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
                
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        return ""

    return text.strip()

# --- HELPER FUNCTIONS ---

def _extract_from_standard_pdf(file_path):
    """Fast extraction for digital PDFs using PyPDF2."""
    text = ""
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Standard PDF Error: {e}")
    return text

def _extract_from_scanned_pdf(file_path):
    """
    Slow but powerful OCR extraction for images/scanned PDFs.
    Requires 'tesseract' and 'poppler' to be installed on the system.
    """
    text = ""
    try:
        # 1. Convert PDF Pages to Images
        # Note: On Windows, you might need to add poppler_path=r'C:\...\bin' argument here
        images = convert_from_path(file_path)

        # 2. Run OCR on each image
        for i, image in enumerate(images):
            # Extract text from the image page
            page_text = pytesseract.image_to_string(image)
            text += page_text + "\n"
            
    except Exception as e:
        print(f"OCR Error: {e}")
        print("HINT: Ensure Poppler and Tesseract-OCR are installed and added to your PATH.")
        
    return text

def _extract_from_docx(file_path):
    """Extract text from DOCX files."""
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"DOCX Error: {e}")
        return ""
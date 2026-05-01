import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os

class PDFService:
    @staticmethod
    def extract_text_from_pdf(pdf_path):
        """
        Extract text from PDF using PyMuPDF.
        Falls back to OCR if text extraction fails.
        """
        try:
            doc = fitz.open(pdf_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                # If no text found, try OCR
                if not page_text.strip():
                    page_text = PDFService._ocr_page(page)
                
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page_text
            
            doc.close()
            return text
        
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return None
    
    @staticmethod
    def _ocr_page(page):
        """
        Perform OCR on a PDF page using Tesseract.
        """
        try:
            # Render page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
            img = Image.open(io.BytesIO(pix.tobytes()))
            
            # Perform OCR
            text = pytesseract.image_to_string(img)
            return text
        
        except Exception as e:
            print(f"OCR error: {e}")
            return ""
    
    @staticmethod
    def chunk_text(text, chunk_size=1000, overlap=200):
        """
        Split text into overlapping chunks for better RAG performance.
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += (chunk_size - overlap)
        
        return chunks
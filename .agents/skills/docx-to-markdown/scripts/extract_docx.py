import sys
import zipfile
import xml.etree.ElementTree as ET
import os

def extract_literal_text(docx_path):
    """
    Extracts all text from a .docx file by traversing its WordprocessingML XML files.
    This method is more reliable than standard libraries for capturing text in 
    text boxes, headers, footers, and stylistic elements often used in internal docs.
    """
    if not os.path.exists(docx_path):
        return f"Error: File {docx_path} not found."
    
    text_content = []
    
    try:
        with zipfile.ZipFile(docx_path, 'r') as z:
            # We iterate through all XML files in the word/ directory
            # (document.xml, headerN.xml, footerN.xml, etc.)
            xml_files = [f for f in z.namelist() if f.startswith('word/') and f.endswith('.xml')]
            
            # Ensure document.xml is processed first for better flow
            if 'word/document.xml' in xml_files:
                xml_files.remove('word/document.xml')
                xml_files.insert(0, 'word/document.xml')
            
            for entry in xml_files:
                root = ET.fromstring(z.read(entry))
                # The namespace for WordprocessingML
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                
                # Find all text elements <w:t>
                for t in root.findall('.//w:t', ns):
                    if t.text:
                        text_content.append(t.text.strip())
                        
        return "\n".join(text_content)
    
    except Exception as e:
        return f"Error processing {docx_path}: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 extract_docx.py <path_to_docx>")
    else:
        print(extract_literal_text(sys.argv[1]))

import docx

def extract_full_text(input_file, output_file):
    doc = docx.Document(input_file)
    with open(output_file, 'w', encoding='utf-8') as f:
        for p in doc.paragraphs:
            f.write(p.text + '\n')

if __name__ == "__main__":
    extract_full_text('AI_REPORT_FINAL.docx', 'template_full_text.txt')

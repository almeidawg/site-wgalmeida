#!/usr/bin/env python3
"""
Extract images from the Style Guide PDF
"""
import fitz  # PyMuPDF
import os
from pathlib import Path

# Paths
pdf_path = "Z:/01_SITE_WGALMEIDA/Conteudo Site/Guia_de_Estilos_WgAlmeida.pdf"
output_dir = "public/images/estilos-extraidas"

# Create output directory
Path(output_dir).mkdir(parents=True, exist_ok=True)

# Style page ranges (approximate)
styles = {
    'minimalismo': (4, 15),
    'classico': (16, 27),
    'moderno': (28, 39),
    'industrial': (40, 51),
    'vintage': (52, 63),
    'tropical': (64, 75),
}

def extract_images_from_pages(pdf_path, start_page, end_page, style_name):
    """Extract images from specific page range"""
    try:
        doc = fitz.open(pdf_path)
        image_count = 0

        print(f"\n📷 Extraindo imagens do estilo: {style_name}")
        print(f"   Páginas {start_page} - {end_page}")

        for page_num in range(start_page - 1, min(end_page, len(doc))):
            page = doc[page_num]
            images = page.get_images()

            for img_index, img in enumerate(images):
                try:
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]

                    # Save image
                    image_filename = f"{style_name}_p{page_num + 1}_img{img_index + 1}.{image_ext}"
                    image_path = os.path.join(output_dir, image_filename)

                    with open(image_path, "wb") as img_file:
                        img_file.write(image_bytes)

                    print(f"   ✓ {image_filename}")
                    image_count += 1

                except Exception as e:
                    print(f"   ✗ Erro ao extrair imagem p{page_num + 1}: {e}")

        doc.close()
        print(f"   Total: {image_count} imagens extraídas")
        return image_count

    except Exception as e:
        print(f"❌ Erro: {e}")
        return 0

def main():
    print("🎨 EXTRATOR DE IMAGENS - GUIA DE ESTILOS")
    print("=" * 50)

    if not os.path.exists(pdf_path):
        print(f"❌ PDF não encontrado: {pdf_path}")
        return

    total_images = 0

    for style_name, (start, end) in styles.items():
        count = extract_images_from_pages(pdf_path, start, end, style_name)
        total_images += count

    print("\n" + "=" * 50)
    print(f"✅ Total de imagens extraídas: {total_images}")
    print(f"📁 Diretório de saída: {output_dir}")
    print("\nPróximo passo:")
    print("1. Revise as imagens extraídas")
    print("2. Escolha as melhores imagens de cada estilo")
    print("3. Converta para WebP e renomeie")
    print("4. Mova para public/images/estilos/")

if __name__ == "__main__":
    main()

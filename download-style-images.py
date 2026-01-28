#!/usr/bin/env python3
"""
Script para baixar imagens do Unsplash para os estilos

Como usar:
1. pip install requests pillow
2. python download-style-images.py
"""

import os
import time
import requests
from PIL import Image
from io import BytesIO

# Diretório de destino
OUTPUT_DIR = os.path.join('public', 'images', 'estilos')

# Criar diretório se não existir
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mapa de estilos e suas imagens do Unsplash
STYLE_IMAGES = {
    'minimalismo': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&q=80',
    'classico': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
    'moderno': 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=80',
    'vintage': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    'tropical': 'https://images.unsplash.com/photo-1615874694520-474822394e73?w=1200&q=80',
    'boho': 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=1200&q=80',
    'escandinavo': 'https://images.unsplash.com/photo-1615875605825-5eb9bb5d52ac?w=1200&q=80',
    'rustico': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    'industrial': 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&q=80',
    'contemporaneo': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    'art-deco': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
    'mid-century': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
    'japandi': 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200&q=80',
    'coastal': 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200&q=80',
    'farmhouse': 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80',
    'maximalista': 'https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da?w=1200&q=80',
    'mediterraneo': 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80',
    'glam': 'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1200&q=80',
    'ecletico': 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200&q=80',
    'provencal': 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=1200&q=80',
    'hampton': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
    'transitional': 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80'
}

def download_and_convert(style_name, url):
    """Baixa imagem e converte para WebP"""
    try:
        print(f'📥 Baixando: {style_name}...')

        # Baixar imagem
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # Abrir imagem com PIL
        img = Image.open(BytesIO(response.content))

        # Converter para RGB se necessário (WebP não suporta RGBA em alguns casos)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background

        # Redimensionar para 1200x800 mantendo aspecto
        img.thumbnail((1200, 800), Image.Resampling.LANCZOS)

        # Salvar como WebP
        output_path = os.path.join(OUTPUT_DIR, f'{style_name}.webp')
        img.save(output_path, 'WEBP', quality=85)

        print(f'✅ Salvo: {style_name}.webp')

    except Exception as e:
        print(f'❌ Erro ao baixar {style_name}: {str(e)}')

def main():
    """Função principal"""
    print('🎨 Iniciando download de imagens dos estilos...\n')
    print(f'📁 Diretório de destino: {OUTPUT_DIR}\n')

    for style_name, url in STYLE_IMAGES.items():
        download_and_convert(style_name, url)
        # Pequeno delay para não sobrecarregar o servidor
        time.sleep(0.5)

    print(f'\n🎉 Download completo!')
    print(f'📊 Total de imagens: {len(STYLE_IMAGES)}')

if __name__ == '__main__':
    main()

/**
 * Script para baixar imagens do Unsplash para os estilos
 *
 * Como usar:
 * 1. npm install node-fetch sharp
 * 2. node download-style-images.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de destino
const outputDir = path.join(__dirname, 'public', 'images', 'estilos');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Mapa de estilos e suas imagens do Unsplash
const styleImages = {
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
  'transitional': 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80',
  'shabby-chic': 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=1200&q=80',
  'art-nouveau': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
  'cottage': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
  'southwest': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=80',
  'neoclassico': 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80',
  'urban-modern': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
  'hollywood-regency': 'https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da?w=1200&q=80',
  'wabi-sabi': 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=1200&q=80',
  'tulum': 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&q=80'
};

// Função para baixar e converter para WebP
async function downloadAndConvert(styleName, url) {
  try {
    console.log(`📥 Baixando: ${styleName}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.buffer();
    const outputPath = path.join(outputDir, `${styleName}.webp`);

    // Converter para WebP com sharp
    await sharp(buffer)
      .resize(1200, 800, { // Redimensionar para 1200x800
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 }) // Qualidade 85%
      .toFile(outputPath);

    console.log(`✅ Salvo: ${styleName}.webp`);

  } catch (error) {
    console.error(`❌ Erro ao baixar ${styleName}:`, error.message);
  }
}

// Função principal
async function downloadAll() {
  console.log('🎨 Iniciando download de imagens dos estilos...\n');
  console.log(`📁 Diretório de destino: ${outputDir}\n`);

  const styles = Object.keys(styleImages);

  for (const styleName of styles) {
    await downloadAndConvert(styleName, styleImages[styleName]);
    // Pequeno delay para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Download completo!');
  console.log(`📊 Total de imagens: ${styles.length}`);
}

// Executar
downloadAll().catch(console.error);

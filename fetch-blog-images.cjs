const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dkkj9mpqv',
  api_key: '233356754886313',
  api_secret: 'N8aYoC7iPMRfUwGPqWOMWnwu9uM'
});

/**
 * Script para buscar imagens de alta qualidade do Cloudinary Media Library
 *
 * COMO USAR:
 * 1. Ative o add-on Pixabay ou Shutterstock no Cloudinary
 * 2. Busque imagens no Media Library: https://console.cloudinary.com/console/c-dkkj9mpqv/media_library
 * 3. Adicione imagens com tag "blog" ou "blog-[categoria]"
 * 4. Execute: node fetch-blog-images.cjs
 */

async function listBlogImages() {
  try {
    // Buscar todas as imagens com tag "blog"
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'wgalmeida/blog/',
      max_results: 500,
      resource_type: 'image'
    });

    console.log('\n=== IMAGENS DO BLOG NO CLOUDINARY ===\n');
    console.log('Total encontrado:', result.resources.length);

    result.resources.forEach((image, index) => {
      console.log(`\n[${index + 1}] ${image.public_id}`);
      console.log('URL:', image.secure_url);
      console.log('Tamanho:', (image.bytes / 1024).toFixed(2), 'KB');
      console.log('Dimensões:', `${image.width}x${image.height}`);
    });

    console.log('\n=== URLs OTIMIZADAS PARA USO ===\n');

    result.resources.forEach((image) => {
      const optimizedUrl = cloudinary.url(image.public_id, {
        width: 1280,
        height: 720,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto'
      });
      console.log(`"${image.public_id.split('/').pop()}": "${optimizedUrl}",`);
    });

  } catch (error) {
    console.error('Erro ao buscar imagens:', error.message);
  }
}

// Buscar imagens de uma categoria específica via Pixabay (se ativo)
async function searchPixabayImages(query) {
  console.log(`\nBuscando imagens de "${query}" no Pixabay...\n`);
  console.log('IMPORTANTE: Certifique-se de ter o add-on Pixabay ativo em:');
  console.log('https://console.cloudinary.com/console/c-dkkj9mpqv/addons\n');

  // Nota: A busca do Pixabay é feita diretamente no Media Library UI
  // Este script apenas lista as que você já adicionou
}

// Executar
const args = process.argv.slice(2);
if (args[0] === 'search') {
  searchPixabayImages(args[1] || 'architecture');
} else {
  listBlogImages();
}

const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'src', 'content', 'blog');
const imagesDir = path.join(__dirname, 'public', 'images', 'blog');

// Listar imagens existentes
const existingImages = new Set(fs.readdirSync(imagesDir));

// Imagem padrão
const defaultImage = '/images/banners/SOBRE.webp';

// Processar arquivos MD
const mdFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

let fixed = 0;

mdFiles.forEach(file => {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Extrair imagem do frontmatter
  const imageMatch = content.match(/^image:\s*["']?([^"'\n]+)["']?/m);
  if (imageMatch) {
    const imagePath = imageMatch[1];
    const imageName = path.basename(imagePath);

    // Verificar se a imagem existe
    if (!existingImages.has(imageName)) {
      console.log(`Fixing: ${file} -> image "${imageName}" not found`);

      // Substituir pela imagem padrão
      content = content.replace(
        /^image:\s*["']?[^"'\n]+["']?/m,
        `image: "${defaultImage}"`
      );

      fs.writeFileSync(filePath, content, 'utf8');
      fixed++;
    }
  }
});

console.log(`\nFixed ${fixed} files with missing images`);

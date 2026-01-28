const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'src', 'content', 'blog');

// Lista de arquivos JSON para converter
const jsonFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.json'));

console.log(`Encontrados ${jsonFiles.length} arquivos JSON para converter\n`);

jsonFiles.forEach(jsonFile => {
  const jsonPath = path.join(blogDir, jsonFile);
  const mdFile = jsonFile.replace('.json', '.md');
  const mdPath = path.join(blogDir, mdFile);

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Construir frontmatter YAML
    const tags = Array.isArray(data.tags)
      ? data.tags.map(t => `  - "${t}"`).join('\n')
      : '';

    const frontmatter = `---
title: "${data.title || ''}"
slug: "${data.slug || ''}"
date: "${data.date || ''}"
author: "${data.author || 'Grupo WG Almeida'}"
category: "${(data.category || 'arquitetura').toLowerCase()}"
image: "${data.image || '/images/banners/SOBRE.webp'}"
excerpt: "${data.excerpt || ''}"
tags:
${tags}
featured: ${data.featured || false}
---`;

    // Conteudo markdown
    const content = data.content || '';

    // Arquivo final
    const mdContent = `${frontmatter}\n${content}\n`;

    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log(`✓ Convertido: ${jsonFile} -> ${mdFile}`);

    // Remover arquivo JSON original
    fs.unlinkSync(jsonPath);
    console.log(`  ✓ Removido: ${jsonFile}`);

  } catch (err) {
    console.error(`✗ Erro em ${jsonFile}: ${err.message}`);
  }
});

console.log('\n✓ Conversao concluida!');

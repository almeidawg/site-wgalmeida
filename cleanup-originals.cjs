/**
 * Script para remover arquivos JPG/PNG/JPEG que já têm versão WebP
 */

const fs = require('fs');
const path = require('path');

const PASTA_RAIZ = './public/images';

let removidos = 0;
let espacoLiberado = 0;

function limparPastaRecursivo(pasta) {
  if (!fs.existsSync(pasta)) return;

  const itens = fs.readdirSync(pasta);

  for (const item of itens) {
    const caminhoCompleto = path.join(pasta, item);
    const stat = fs.statSync(caminhoCompleto);

    if (stat.isDirectory()) {
      limparPastaRecursivo(caminhoCompleto);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();

      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        // Verificar se existe versão WebP
        const webpPath = caminhoCompleto.replace(/\.(png|jpg|jpeg)$/i, '.webp');

        if (fs.existsSync(webpPath)) {
          const tamanho = stat.size;
          fs.unlinkSync(caminhoCompleto);
          removidos++;
          espacoLiberado += tamanho;
          console.log(`✓ Removido: ${caminhoCompleto}`);
        }
      }
    }
  }
}

console.log('🧹 Limpando arquivos originais com versão WebP...\n');

limparPastaRecursivo(PASTA_RAIZ);

console.log(`\n========================================`);
console.log(`RESUMO DA LIMPEZA`);
console.log(`========================================`);
console.log(`Arquivos removidos: ${removidos}`);
console.log(`Espaço liberado: ${(espacoLiberado / 1024 / 1024).toFixed(2)} MB`);
console.log(`========================================\n`);

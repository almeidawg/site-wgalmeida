/**
 * Script para converter imagens PNG/JPG para WebP
 * Processa TODAS as subpastas recursivamente
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Pasta raiz para buscar imagens recursivamente
const PASTA_RAIZ = './public/images';

// Qualidade WebP (80 = bom equilíbrio tamanho/qualidade)
const QUALIDADE = 80;

// Tamanho mínimo em KB para converter (ignorar arquivos muito pequenos)
const TAMANHO_MINIMO_KB = 10; // 10KB

async function converterImagem(arquivoOrigem) {
  const ext = path.extname(arquivoOrigem).toLowerCase();

  // Só converter PNG, JPG, JPEG
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
    return null;
  }

  const arquivoDestino = arquivoOrigem.replace(ext, '.webp');

  // Verificar se já existe WebP
  if (fs.existsSync(arquivoDestino)) {
    console.log(`⏭️  Já existe: ${path.basename(arquivoDestino)}`);
    return null;
  }

  try {
    const infoOriginal = fs.statSync(arquivoOrigem);

    // Ignorar arquivos muito pequenos
    if (infoOriginal.size < TAMANHO_MINIMO_KB * 1024) {
      return null;
    }

    await sharp(arquivoOrigem)
      .webp({ quality: QUALIDADE })
      .toFile(arquivoDestino);

    const infoWebP = fs.statSync(arquivoDestino);

    const reducao = Math.round((1 - infoWebP.size / infoOriginal.size) * 100);

    console.log(`✓ ${path.basename(arquivoOrigem)} -> ${path.basename(arquivoDestino)}`);
    console.log(`  Original: ${(infoOriginal.size / 1024).toFixed(0)}KB | WebP: ${(infoWebP.size / 1024).toFixed(0)}KB | Redução: ${reducao}%`);

    return {
      arquivo: arquivoDestino,
      tamanhoOriginal: infoOriginal.size,
      tamanhoWebP: infoWebP.size,
      reducao
    };
  } catch (error) {
    console.error(`✗ Erro ao converter ${arquivoOrigem}: ${error.message}`);
    return null;
  }
}

// Buscar todos os arquivos de imagem recursivamente
function buscarImagensRecursivo(pasta, arquivos = []) {
  if (!fs.existsSync(pasta)) return arquivos;

  const itens = fs.readdirSync(pasta);

  for (const item of itens) {
    const caminhoCompleto = path.join(pasta, item);
    const stat = fs.statSync(caminhoCompleto);

    if (stat.isDirectory()) {
      buscarImagensRecursivo(caminhoCompleto, arquivos);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        arquivos.push(caminhoCompleto);
      }
    }
  }

  return arquivos;
}

async function main() {
  console.log('🖼️  Conversor de Imagens para WebP (Recursivo)');
  console.log('===============================================\n');

  // Buscar todas as imagens
  console.log(`Buscando imagens em ${PASTA_RAIZ}...`);
  const todasImagens = buscarImagensRecursivo(PASTA_RAIZ);
  console.log(`Encontradas ${todasImagens.length} imagens para processar.\n`);

  let totalOriginal = 0;
  let totalWebP = 0;
  let totalArquivos = 0;
  let ignorados = 0;
  let jaExistem = 0;

  for (let i = 0; i < todasImagens.length; i++) {
    const arquivo = todasImagens[i];
    const resultado = await converterImagem(arquivo);

    if (resultado) {
      totalOriginal += resultado.tamanhoOriginal;
      totalWebP += resultado.tamanhoWebP;
      totalArquivos++;
    } else {
      // Verificar se já existe WebP
      const ext = path.extname(arquivo).toLowerCase();
      const webpPath = arquivo.replace(ext, '.webp');
      if (fs.existsSync(webpPath)) {
        jaExistem++;
      } else {
        ignorados++;
      }
    }

    // Mostrar progresso a cada 50 arquivos
    if ((i + 1) % 50 === 0) {
      console.log(`\n[Progresso: ${i + 1}/${todasImagens.length}]\n`);
    }
  }

  console.log(`\n========================================`);
  console.log(`RESUMO FINAL`);
  console.log(`========================================`);
  console.log(`Total de imagens encontradas: ${todasImagens.length}`);
  console.log(`Convertidas agora: ${totalArquivos}`);
  console.log(`Já existiam WebP: ${jaExistem}`);
  console.log(`Ignoradas (muito pequenas): ${ignorados}`);
  if (totalArquivos > 0) {
    console.log(`Tamanho original: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Tamanho WebP: ${(totalWebP / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Redução total: ${Math.round((1 - totalWebP / totalOriginal) * 100)}%`);
  }
  console.log(`========================================\n`);
}

main().catch(console.error);

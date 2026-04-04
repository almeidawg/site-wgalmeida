#!/bin/bash
# Script de Otimização de Imagens para WebP
# Uso: bash optimize-images.sh

echo "🖼️  Iniciando otimização de imagens para WebP..."

# Verificar se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick não está instalado."
    echo "   Windows: Instale via: choco install imagemagick"
    echo "   macOS:   Instale via: brew install imagemagick"
    echo "   Linux:   Instale via: sudo apt install imagemagick"
    exit 1
fi

# Diretórios
SOURCE_DIR="./public/images"
OUTPUT_DIR="./public/images/webp"

# Criar diretório output
mkdir -p "$OUTPUT_DIR"

# Contadores
total=0
converted=0

# Função para converter imagem
optimize_image() {
    local input_file=$1
    local filename=$(basename "$input_file")
    local output_file="$OUTPUT_DIR/${filename%.*}.webp"

    echo "  Convertendo: $filename"

    # Converter para WebP com qualidade 80 (balance between size e quality)
    convert "$input_file" -quality 80 "$output_file"

    # Mostrar redução de tamanho
    if [ -f "$output_file" ]; then
        original_size=$(du -h "$input_file" | cut -f1)
        webp_size=$(du -h "$output_file" | cut -f1)
        echo "    ✅ $filename → ${filename%.*}.webp ($original_size → $webp_size)"
        ((converted++))
    else
        echo "    ❌ Falha ao converter $filename"
    fi
    ((total++))
}

# Processar arquivos
echo ""
echo "📁 Processando: $SOURCE_DIR"
echo ""

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Diretório $SOURCE_DIR não encontrado!"
    exit 1
fi

# Encontrar e converter arquivos PNG e JPG
find "$SOURCE_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read file; do
    optimize_image "$file"
done

echo ""
echo "✅ Otimização concluída!"
echo "   Total de imagens processadas: $total"
echo "   WebP criadas: $converted"
echo "   Saída: $OUTPUT_DIR"
echo ""
echo "📝 Próximo passo:"
echo "   1. Verificar a qualidade das imagens em: $OUTPUT_DIR"
echo "   2. Atualizar HTML com: <picture>"
echo "      <source srcset='image.webp' type='image/webp' />"
echo "      <img src='image.jpg' />"
echo "   3. Testar performance com PageSpeed Insights"

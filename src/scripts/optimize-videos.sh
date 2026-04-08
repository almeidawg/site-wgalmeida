#!/bin/bash
# =====================================================
# Script de Otimizacao de Videos - Grupo WG Almeida
# Requer: FFmpeg instalado
# =====================================================
#
# PROBLEMA IDENTIFICADO:
# - HORIZONTAL.mp4: 162 MB (deve ser ~5-10 MB)
# - VERTICAL.mp4: 125 MB (deve ser ~5-10 MB)
#
# SOLUCAO: Comprimir com FFmpeg mantendo qualidade visual
# =====================================================

# Diretorio dos videos
VIDEO_DIR="../public/videos/hero"

# Backup dos originais
mkdir -p "$VIDEO_DIR/originals"

echo "=== Otimizando videos hero ==="

# HORIZONTAL.mp4 (Desktop - 1920x1080 recomendado)
if [ -f "$VIDEO_DIR/HORIZONTAL.mp4" ]; then
  echo "Processando HORIZONTAL.mp4..."
  mv "$VIDEO_DIR/HORIZONTAL.mp4" "$VIDEO_DIR/originals/HORIZONTAL_original.mp4"

  ffmpeg -i "$VIDEO_DIR/originals/HORIZONTAL_original.mp4" \
    -c:v libx264 \
    -crf 28 \
    -preset slow \
    -vf "scale=1920:-2" \
    -c:a aac \
    -b:a 128k \
    -movflags +faststart \
    -y "$VIDEO_DIR/HORIZONTAL.mp4"

  echo "HORIZONTAL.mp4 otimizado!"
fi

# VERTICAL.mp4 (Mobile - 1080x1920 recomendado)
if [ -f "$VIDEO_DIR/VERTICAL.mp4" ]; then
  echo "Processando VERTICAL.mp4..."
  mv "$VIDEO_DIR/VERTICAL.mp4" "$VIDEO_DIR/originals/VERTICAL_original.mp4"

  ffmpeg -i "$VIDEO_DIR/originals/VERTICAL_original.mp4" \
    -c:v libx264 \
    -crf 28 \
    -preset slow \
    -vf "scale=1080:-2" \
    -c:a aac \
    -b:a 128k \
    -movflags +faststart \
    -y "$VIDEO_DIR/VERTICAL.mp4"

  echo "VERTICAL.mp4 otimizado!"
fi

echo ""
echo "=== Comparacao de tamanhos ==="
ls -lh "$VIDEO_DIR"/*.mp4
ls -lh "$VIDEO_DIR/originals"/*.mp4

echo ""
echo "=== Concluido! ==="
echo "Os videos originais estao em: $VIDEO_DIR/originals/"

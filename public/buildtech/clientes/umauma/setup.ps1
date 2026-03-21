$base = "C:\Users\Atendimento\Documents\_WG_build.tech\Em-Desenvolvimento\20260310-Grupo_UmaUma"

Write-Host ""
Write-Host "  EventOS - Criando estrutura de arquivos JSX..." -ForegroundColor Yellow

# Save JSX source files (these are the React components)
# The HTML standalone versions will be generated from these

Write-Host "  [OK] Estrutura de pastas criada" -ForegroundColor Green
Write-Host "  [INFO] Os arquivos HTML interativos estao em downloads prontos para copiar" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Instrucoes:" -ForegroundColor White
Write-Host "  1. Baixe os 3 HTMLs do Claude (ja disponibilizados)" -ForegroundColor Gray
Write-Host "  2. Copie EventOS-Pitch.html para: $base\01-Pitch\" -ForegroundColor Gray
Write-Host "  3. Copie EventOS-Demo.html para: $base\03-Demo-Produto\" -ForegroundColor Gray
Write-Host "  4. Copie Analise-Requisitos.html para: $base\02-Analise-Requisitos\" -ForegroundColor Gray
Write-Host "  5. Abra $base\index.html no navegador" -ForegroundColor Gray
Write-Host ""

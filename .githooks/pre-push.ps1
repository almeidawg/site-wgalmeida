$srcCount = (git ls-files | Select-String "^src/").Count
if ($srcCount -lt 50) {
    Write-Host ""
    Write-Host "BLOQUEADO: src/ tem apenas $srcCount arquivos rastreados (minimo: 100)."
    Write-Host "Possivel delecao acidental de src/. Verifique antes de fazer push."
    Write-Host ""
    exit 1
}
$homeExists = (git ls-files | Select-String "src/pages/Home.jsx").Count
if ($homeExists -eq 0) {
    Write-Host ""
    Write-Host "BLOQUEADO: src/pages/Home.jsx nao encontrado — arquivo critico ausente."
    Write-Host ""
    exit 1
}
exit 0

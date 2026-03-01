@echo off
echo ========================================
echo   DEPLOY GRUPO WG ALMEIDA - VERCEL
echo ========================================
echo.

echo [1/4] Validando SEO + build...
call npm run seo:validate:fresh
if errorlevel 1 (
    echo.
    echo SEO validation/build falhou. Deploy cancelado.
    pause
    exit /b 1
)
echo.

echo [2/4] Fazendo login na Vercel...
call vercel login
echo.

echo [3/4] Fazendo deploy para producao...
call vercel --prod --yes
echo.

echo ========================================
echo   DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Acesse: https://vercel.com/dashboard
echo Para configurar dominio wgalmeida.com.br
echo.
pause

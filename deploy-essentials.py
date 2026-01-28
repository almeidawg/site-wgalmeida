#!/usr/bin/env python3
"""Deploy apenas arquivos essenciais do site - com reconexao"""
import ftplib
import os
import time

FTP_HOST = "147.93.64.151"
FTP_USER = "u968231423.wgalmeida.com.br"
FTP_PASS = "WGEasy2026!"
DIST_PATH = r"E:\WindowsPowerShell\01VISUALSTUDIO_OFICIAL\site\dist"

# Arquivos essenciais primeiro
ESSENTIAL_FILES = [
    "index.html",
    ".htaccess",
    "favicon.png",
    "manifest.json",
    "robots.txt",
    "sitemap.xml",
    "sw.js",
]

# Assets JS/CSS
ASSETS_FILES = [
    "assets/index-b698b030.js",
    "assets/index-79844b09.css",
    "assets/vendor-react-fadd910d.js",
    "assets/vendor-supabase-75cd140c.js",
    "assets/vendor-ui-da89bbd4.js",
    "assets/vendor-icons-ea07e050.js",
    "assets/Store-94f01230.js",
    "assets/Home-313ca21f.js",
    "assets/About-9e2c5a19.js",
    "assets/Projects-004ad581.js",
    "assets/Contact-9ea15aa0.js",
    "assets/Architecture-a080f521.js",
    "assets/Engineering-b296e968.js",
    "assets/Carpentry-9c03bc9a.js",
    "assets/Process-568587dd.js",
    "assets/Blog-1963832b.js",
    "assets/Account-bb6c7e88.js",
    "assets/Login-38ffea5f.js",
    "assets/Register-4bc4ce17.js",
    "assets/AMarca-1914ecd3.js",
    "assets/Testimonials-0eee13c7.js",
    "assets/SoliciteProposta-3a7201f6.js",
    "assets/ProductDetailPage-71757510.js",
    "assets/Admin-073ea7a7.js",
    "assets/Success-ad267177.js",
    "assets/AnimatedStrokes-65bb436d.js",
    "assets/browser-9fb08bc9.js",
    "assets/web-vitals-5846ad17.js",
    "assets/RegionTemplate-19329029.js",
    "assets/Brooklin-f12492e0.js",
    "assets/Jardins-e3498b32.js",
    "assets/Itaim-1ad7ca44.js",
    "assets/Morumbi-7fb3f974.js",
    "assets/CidadeJardim-11cfbf28.js",
    "assets/VilaNovaConceicao-4bfbaa94.js",
]

def connect_ftp():
    """Conecta ao FTP com retry"""
    for attempt in range(3):
        try:
            ftp = ftplib.FTP(FTP_HOST, timeout=60)
            ftp.login(FTP_USER, FTP_PASS)
            ftp.set_pasv(True)
            return ftp
        except Exception as e:
            print(f"Tentativa {attempt+1} falhou: {e}")
            time.sleep(2)
    return None

def upload_file(ftp, local_path, remote_path):
    """Upload de um arquivo"""
    try:
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {remote_path}', f)
        return True
    except Exception as e:
        print(f"  ERRO: {e}")
        return False

def main():
    print("=" * 50)
    print("  DEPLOY ESSENCIAIS - Site WG Almeida")
    print("=" * 50)

    # Conectar
    print("\nConectando ao FTP...")
    ftp = connect_ftp()
    if not ftp:
        print("ERRO: Nao foi possivel conectar ao FTP")
        return
    print("Conectado!")

    # Criar pasta assets se nao existir
    try:
        ftp.mkd("/public_html/assets")
    except:
        pass

    # Upload arquivos essenciais
    print("\n[1/2] Enviando arquivos essenciais...")
    for file in ESSENTIAL_FILES:
        local = os.path.join(DIST_PATH, file)
        remote = f"/public_html/{file}"
        if os.path.exists(local):
            print(f"  {file}...", end=" ")
            if upload_file(ftp, local, remote):
                print("OK")
            else:
                # Reconectar e tentar novamente
                ftp = connect_ftp()
                if ftp and upload_file(ftp, local, remote):
                    print("OK (retry)")

    # Upload assets
    print("\n[2/2] Enviando assets JS/CSS...")
    for file in ASSETS_FILES:
        local = os.path.join(DIST_PATH, file)
        remote = f"/public_html/{file}"
        if os.path.exists(local):
            print(f"  {file}...", end=" ")
            if upload_file(ftp, local, remote):
                print("OK")
            else:
                # Reconectar e tentar novamente
                ftp = connect_ftp()
                if ftp and upload_file(ftp, local, remote):
                    print("OK (retry)")
                else:
                    print("FALHOU")

    try:
        ftp.quit()
    except:
        pass

    print("\n" + "=" * 50)
    print("  DEPLOY CONCLUIDO!")
    print("=" * 50)
    print("\nAcesse: https://wgalmeida.com.br")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Deploy completo do site - upload dinamico de todos arquivos"""
import ftplib
import os
import time

FTP_HOST = "147.93.64.151"
FTP_USER = "u968231423.wgalmeida.com.br"
FTP_PASS = "WGEasy2026!"
DIST_PATH = r"E:\SITE_WGALMEIDA\site\dist"
REMOTE_BASE = "/public_html"

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

def ensure_remote_dir(ftp, remote_dir):
    """Cria diretorio remoto se nao existir"""
    try:
        ftp.mkd(remote_dir)
    except:
        pass

def upload_file(ftp, local_path, remote_path):
    """Upload de um arquivo com retry"""
    for attempt in range(2):
        try:
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
            return True
        except Exception as e:
            if attempt == 0:
                # Reconectar
                try:
                    ftp.quit()
                except:
                    pass
                new_ftp = connect_ftp()
                if new_ftp:
                    ftp = new_ftp
                    continue
            print(f" ERRO: {e}")
            return False
    return False

def main():
    print("=" * 50)
    print("  DEPLOY SITE WG ALMEIDA")
    print("=" * 50)

    # Conectar
    print("\nConectando ao FTP...")
    ftp = connect_ftp()
    if not ftp:
        print("ERRO: Nao foi possivel conectar ao FTP")
        return
    print("Conectado!")

    # Criar pasta assets
    ensure_remote_dir(ftp, f"{REMOTE_BASE}/assets")

    # Coletar todos arquivos
    all_files = []
    for root, dirs, files in os.walk(DIST_PATH):
        for file in files:
            local_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_path, DIST_PATH)
            remote_path = f"{REMOTE_BASE}/{relative_path}".replace("\\", "/")
            all_files.append((local_path, remote_path, relative_path))

    print(f"\nTotal de arquivos: {len(all_files)}")

    # Upload
    success = 0
    failed = 0

    for local_path, remote_path, relative_path in all_files:
        # Criar subpasta se necessario
        remote_dir = os.path.dirname(remote_path)
        if remote_dir != REMOTE_BASE:
            ensure_remote_dir(ftp, remote_dir)

        print(f"  {relative_path}...", end=" ", flush=True)

        # Upload
        try:
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {remote_path}', f)
            print("OK")
            success += 1
        except Exception as e:
            print("RETRY...", end=" ", flush=True)
            # Reconectar e tentar novamente
            try:
                ftp.quit()
            except:
                pass
            ftp = connect_ftp()
            if ftp:
                try:
                    with open(local_path, 'rb') as f:
                        ftp.storbinary(f'STOR {remote_path}', f)
                    print("OK")
                    success += 1
                except:
                    print("FALHOU")
                    failed += 1
            else:
                print("FALHOU (sem conexao)")
                failed += 1

    try:
        ftp.quit()
    except:
        pass

    print("\n" + "=" * 50)
    print(f"  DEPLOY CONCLUIDO!")
    print(f"  Sucesso: {success} | Falhou: {failed}")
    print("=" * 50)
    print("\nAcesse: https://wgalmeida.com.br")

if __name__ == "__main__":
    main()

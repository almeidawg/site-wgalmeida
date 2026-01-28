from ftplib import FTP
import os
import time

FTP_HOST = '147.93.64.151'
FTP_USER = 'u968231423.wgalmeida.com.br'
FTP_PASS = 'WGEasy2026!'

dist_path = r'E:\SITE_WGALMEIDA\site\dist'
remote_path = '/public_html'

# Arquivos essenciais para upload (apenas JS, CSS, HTML)
ESSENTIAL_EXTENSIONS = ['.html', '.css', '.js', '.json', '.xml', '.txt', '.htaccess']

def connect_ftp():
    ftp = FTP(FTP_HOST, timeout=120)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.cwd(remote_path)
    return ftp

def upload_file(ftp, local_file, remote_file):
    with open(local_file, 'rb') as f:
        ftp.storbinary(f'STOR {remote_file}', f)

def ensure_remote_dir(ftp, path):
    dirs = path.split('/')
    current = ''
    for d in dirs:
        if d:
            current += '/' + d
            try:
                ftp.mkd(current)
            except:
                pass

def is_essential_file(filename):
    if filename.startswith('.'):
        return filename == '.htaccess'
    return any(filename.endswith(ext) for ext in ESSENTIAL_EXTENSIONS)

print('=' * 50)
print('DEPLOY ESSENCIAL - Site WG Almeida')
print('=' * 50)

ftp = connect_ftp()
print('Conectado ao FTP')

# Limpar assets antigos
try:
    assets_list = ftp.nlst('assets')
    for item in assets_list:
        try:
            ftp.delete(item)
        except:
            pass
    print('Assets antigos limpos')
except Exception as e:
    print(f'Nota: {e}')

# Criar pasta assets se nao existir
try:
    ftp.mkd('assets')
except:
    pass

# Upload apenas dos arquivos essenciais
uploaded = 0
errors = 0

for root, dirs, files in os.walk(dist_path):
    for file in files:
        local_file = os.path.join(root, file)
        relative_path = os.path.relpath(local_file, dist_path)
        remote_file_path = relative_path.replace(os.sep, '/')

        # Pular arquivos que nao sao essenciais
        if not is_essential_file(file):
            continue

        # Pular pastas de imagens e videos
        if any(folder in relative_path for folder in ['images/', 'videos/', 'docs/', 'projetopdfrestraunte/']):
            continue

        # Criar diretorio remoto se necessario
        remote_dir = os.path.dirname(remote_file_path)
        if remote_dir:
            ensure_remote_dir(ftp, remote_path + '/' + remote_dir)

        full_remote = remote_path + '/' + remote_file_path

        try:
            upload_file(ftp, local_file, full_remote)
            print(f'OK: {remote_file_path}')
            uploaded += 1
        except Exception as e:
            print(f'ERRO: {remote_file_path} - {e}')
            errors += 1
            # Tentar reconectar
            try:
                ftp.quit()
            except:
                pass
            time.sleep(2)
            ftp = connect_ftp()

try:
    ftp.quit()
except:
    pass

print('\n' + '=' * 50)
print(f'DEPLOY CONCLUIDO!')
print(f'Arquivos enviados: {uploaded}')
print(f'Erros: {errors}')
print('=' * 50)

from ftplib import FTP
import os
import time

FTP_HOST = '147.93.64.151'
FTP_USER = 'u968231423.wgalmeida.com.br'
FTP_PASS = 'WGEasy2026!'

dist_path = r'E:\WindowsPowerShell\01VISUALSTUDIO_OFICIAL\site\dist'
remote_path = '/public_html'

# Arquivos de midia essenciais (novas imagens da galeria e video)
MEDIA_FILES = [
    'images/imagens/ARQ-ENG-MARC-BOORKLIN (1).webp',
    'images/imagens/ARQ-ENG-MARC-BOORKLIN (2).webp',
    'images/imagens/ARQ-ENG-MARC-BOORKLIN (3).webp',
    'images/imagens/ARQ-ENG-MARC-BOORKLIN (4).webp',
    'images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (1).webp',
    'images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (2).webp',
    'images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (3).webp',
    'images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (4).webp',
    'images/imagens/ARQ-VILANOVACONCEICAO (1).webp',
    'images/imagens/ARQ-VILANOVACONCEICAO (2).webp',
    'images/imagens/ARQ-VILANOVACONCEICAO (3).webp',
    'images/imagens/ARQ-VILANOVACONCEICAO (4).webp',
    'images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (1).webp',
    'images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (2).webp',
    'images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (3).webp',
    'images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (4).webp',
    'images/imagens/ARQ-COND-POTADOSOL-MARINQUE (2).webp',
    'images/imagens/ARQ-COND-POTADOSOL-MARINQUE (3).webp',
    'images/imagens/ARQ-COND-POTADOSOL-MARINQUE (4).webp',
    'images/imagens/ARQ-COND-POTADOSOL-MARINQUE (5).webp',
    'images/imagens/fotoCEO.webp',
    'videos/videosobrenos.mp4',
]

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

print('=' * 50)
print('DEPLOY MIDIA - Site WG Almeida')
print('Galeria + Video + Foto CEO')
print('=' * 50)

ftp = connect_ftp()
print('Conectado ao FTP')

uploaded = 0
errors = 0

for relative_path in MEDIA_FILES:
    local_file = os.path.join(dist_path, relative_path.replace('/', os.sep))

    if not os.path.exists(local_file):
        print(f'NAO EXISTE: {relative_path}')
        continue

    # Criar diretorio remoto se necessario
    remote_dir = os.path.dirname(relative_path)
    if remote_dir:
        ensure_remote_dir(ftp, remote_path + '/' + remote_dir)

    full_remote = remote_path + '/' + relative_path

    try:
        file_size = os.path.getsize(local_file)
        print(f'Enviando: {relative_path} ({file_size / 1024:.1f} KB)...')
        upload_file(ftp, local_file, full_remote)
        print(f'OK: {relative_path}')
        uploaded += 1
    except Exception as e:
        print(f'ERRO: {relative_path} - {e}')
        errors += 1
        # Tentar reconectar
        try:
            ftp.quit()
        except:
            pass
        time.sleep(3)
        try:
            ftp = connect_ftp()
        except Exception as reconnect_error:
            print(f'Falha ao reconectar: {reconnect_error}')
            break

try:
    ftp.quit()
except:
    pass

print('\n' + '=' * 50)
print(f'DEPLOY MIDIA CONCLUIDO!')
print(f'Arquivos enviados: {uploaded}')
print(f'Erros: {errors}')
print('=' * 50)

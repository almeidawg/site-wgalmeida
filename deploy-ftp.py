from ftplib import FTP
import os

FTP_HOST = '147.93.64.151'
FTP_USER = 'u968231423.wgalmeida.com.br'
FTP_PASS = 'WGEasy2026!'

dist_path = r'E:\WindowsPowerShell\01VISUALSTUDIO_OFICIAL\site\dist'
remote_path = '/public_html'

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

ftp = FTP(FTP_HOST, timeout=60)
ftp.login(FTP_USER, FTP_PASS)
print('Conectado ao FTP')

# Limpar assets antigos
ftp.cwd(remote_path)
try:
    for item in ftp.nlst('assets'):
        try:
            ftp.delete(f'assets/{item}')
        except:
            pass
    print('Assets antigos limpos')
except:
    print('Pasta assets nao existe')

# Criar pasta assets se nao existir
try:
    ftp.mkd('assets')
except:
    pass

# Upload de todos os arquivos
for root, dirs, files in os.walk(dist_path):
    for file in files:
        local_file = os.path.join(root, file)
        relative_path = os.path.relpath(local_file, dist_path)
        remote_file_path = relative_path.replace(os.sep, '/')

        # Criar diretorio remoto se necessario
        remote_dir = os.path.dirname(remote_file_path)
        if remote_dir:
            ensure_remote_dir(ftp, remote_path + '/' + remote_dir)

        full_remote = remote_path + '/' + remote_file_path
        try:
            upload_file(ftp, local_file, full_remote)
            print(f'OK: {remote_file_path}')
        except Exception as e:
            print(f'ERRO: {remote_file_path} - {e}')

ftp.quit()
print('\nDeploy concluido!')

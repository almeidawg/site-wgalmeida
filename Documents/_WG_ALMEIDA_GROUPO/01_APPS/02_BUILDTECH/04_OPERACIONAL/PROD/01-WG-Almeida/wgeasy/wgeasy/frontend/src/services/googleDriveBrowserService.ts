/* global Storage */
// ============================================================
// SERVIÇO: Google Drive Browser Integration
// VersÍo para rodar no navegador (frontend)
// Usa Google Drive REST API diretamente
// ============================================================

// SEGURANÇA (VER-017): Pasta base movida para variável de ambiente
// Em produçÍo, cada cliente deve usar sua própria pasta (drive_folder_id da tabela pessoas)
const FOLDER_ID_BASE = import.meta.env.VITE_GOOGLE_DRIVE_BASE_FOLDER || '187SLb40TwrePIfuYwlxLi7htLqrnJoIv';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// VER-019: Padrões de path traversal para detectar tentativas de escape de diretório
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./,           // .. (parent directory)
  /\.\.%2F/i,       // URL encoded ../
  /\.\.%5C/i,       // URL encoded ..\
  /%2e%2e/i,        // Double URL encoded ..
  /\.\.\\/,         // ..\ (Windows)
  /\/\//,           // Double slash
  /\\\\/,           // Double backslash
  /^\/|^\\|^\w:/i,  // Absolute paths (Unix or Windows)
];

// VER-019: Caracteres proibidos em nomes de arquivo/pasta do Google Drive
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[<>:"|?*\x00-\x1f]/g;

/**
 * VER-019: Valida nome de pasta/arquivo contra path traversal e caracteres inválidos
 * @throws Error se nome for inválido
 */
function validateFolderName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new Error('Nome de pasta inválido');
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    throw new Error('Nome de pasta nÍo pode ser vazio');
  }

  if (trimmedName.length > 255) {
    throw new Error('Nome de pasta muito longo (máximo 255 caracteres)');
  }

  // Verificar padrões de path traversal
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(trimmedName)) {
      // SEGURANÇA: Log tentativa suspeita (apenas em dev para nÍo expor informações)
      if (import.meta.env.DEV) {
        console.warn(`⚠️ SEGURANÇA (VER-019): Tentativa de path traversal detectada: "${trimmedName}"`);
      }
      throw new Error('Nome de pasta contém caracteres inválidos (path traversal detectado)');
    }
  }

  // Verificar caracteres proibidos
  if (FORBIDDEN_CHARS.test(trimmedName)) {
    throw new Error('Nome de pasta contém caracteres proibidos');
  }
}

// VER-020: Tipos de arquivo permitidos para upload
// Organizados por categoria para fácil manutençÍo
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  // Documentos
  documentos: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
  ],
  // Imagens
  imagens: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
  ],
  // Arquivos de projeto/CAD
  projetos: [
    'application/acad',           // DWG
    'image/vnd.dwg',              // DWG alternativo
    'application/dxf',            // DXF
    'image/vnd.dxf',              // DXF alternativo
    'application/x-dwg',          // DWG alternativo
    'application/x-autocad',      // AutoCAD genérico
    'model/vnd.sketchup',         // SketchUp
    'application/vnd.sketchup.skp', // SketchUp alternativo
    'application/octet-stream',   // Fallback para CAD (verificar extensÍo)
  ],
  // Arquivos compactados
  compactados: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
  // Vídeos (para diário de obra)
  videos: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ],
};

// VER-020: Extensões permitidas (como fallback quando MIME type é genérico)
const ALLOWED_EXTENSIONS = new Set([
  // Documentos
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf',
  // Imagens
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif',
  // Projetos/CAD
  '.dwg', '.dxf', '.skp', '.rvt', '.ifc', '.3ds', '.obj', '.fbx',
  // Compactados
  '.zip', '.rar', '.7z',
  // Vídeos
  '.mp4', '.mov', '.avi', '.webm',
]);

// VER-020: Tamanho máximo de arquivo (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * VER-020: Valida tipo de arquivo para upload
 * @throws Error se arquivo nÍo for permitido
 */
function validateFileType(file: File): void {
  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Verificar extensÍo
  const extensao = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  const extensaoPermitida = ALLOWED_EXTENSIONS.has(extensao);

  // Verificar MIME type
  const mimeType = file.type.toLowerCase();
  const tiposPermitidos = Object.values(ALLOWED_FILE_TYPES).flat();
  const mimePermitido = tiposPermitidos.includes(mimeType);

  // Caso especial: application/octet-stream pode ser válido para CAD se extensÍo for permitida
  const isOctetStreamComExtensaoValida =
    mimeType === 'application/octet-stream' &&
    ['.dwg', '.dxf', '.skp', '.rvt', '.ifc', '.3ds', '.obj', '.fbx'].includes(extensao);

  // Validar: MIME type permitido OU (octet-stream com extensÍo CAD válida) OU extensÍo permitida
  if (!mimePermitido && !isOctetStreamComExtensaoValida && !extensaoPermitida) {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ SEGURANÇA (VER-020): Tipo de arquivo nÍo permitido: ${mimeType} (${extensao})`);
    }
    throw new Error(`Tipo de arquivo nÍo permitido: ${extensao}. Tipos aceitos: documentos, imagens, projetos CAD, vídeos e arquivos compactados.`);
  }

  // VerificaçÍo adicional: arquivos sem extensÍo ou com extensÍo suspeita
  if (!extensao || extensao === '.') {
    throw new Error('Arquivo deve ter uma extensÍo válida');
  }

  // VerificaçÍo adicional: double extensions (ex: arquivo.pdf.exe)
  const partes = file.name.split('.');
  if (partes.length > 2) {
    const ultimaExtensao = '.' + partes[partes.length - 1].toLowerCase();

    // Se a última extensÍo for executável, bloquear
    const extensoesExecutaveis = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.js', '.vbs', '.ps1', '.sh'];
    if (extensoesExecutaveis.includes(ultimaExtensao)) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ SEGURANÇA (VER-020): Double extension detectada: ${file.name}`);
      }
      throw new Error('Arquivo com extensÍo executável nÍo é permitido');
    }
  }
}

/**
 * VER-019: Sanitiza nome de pasta removendo caracteres perigosos
 * Usar quando quiser permitir o upload/criaçÍo com nome corrigido
 */
function sanitizeFolderName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'pasta-sem-nome';
  }

  let sanitized = name.trim();

  // Remover padrões de path traversal
  sanitized = sanitized
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/\\\\/g, '\\')
    .replace(/%2e%2e/gi, '')
    .replace(/%2f/gi, '-')
    .replace(/%5c/gi, '-');

  // Remover caracteres proibidos
  sanitized = sanitized.replace(FORBIDDEN_CHARS, '');

  // Remover barras no início e fim
  // eslint-disable-next-line no-useless-escape
  sanitized = sanitized.replace(/^[\/\\]+|[\/\\]+$/g, '');

  // Limitar tamanho
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  // Se ficou vazio após sanitizaçÍo, usar nome padrÍo
  if (!sanitized || sanitized.trim().length === 0) {
    return 'pasta-sem-nome';
  }

  return sanitized.trim();
}

// SEGURANÇA (VER-018): Usar sessionStorage em vez de localStorage
// sessionStorage é limpo quando a aba é fechada, reduzindo janela de ataque XSS
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'wgeasy_google_drive_token',
  TOKEN_EXPIRY: 'wgeasy_google_drive_expiry',
};

// Flag para escolher storage seguro (sessionStorage) vs persistente (localStorage)
const USE_SECURE_STORAGE = true;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string | null;
  size?: string;
  createdTime: string;
}

interface CreateFolderResult {
  folderId: string;
  folderUrl: string;
}

interface SubPasta {
  id: string;
  name: string;
  webViewLink: string;
}

interface MapeamentoPastas {
  plantas: SubPasta | null;
  fotos: SubPasta | null;
  documentos: SubPasta | null;
  outrasPasstas: SubPasta[];
}

interface DriveListResponse {
  files?: DriveFile[];
  error?: { message?: string };
}

interface FolderStructure {
  [key: string]: FolderStructure;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface TokenClientInitOptions {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
  callback?: (response: TokenResponse) => void;
}

declare global {
  interface Window {
    gapi?: {
      load: (library: string, callback: () => void) => void;
      client: {
        init: (options: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
      };
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (opts: TokenClientInitOptions) => TokenClient;
        };
      };
    };
  }
}

/**
 * Serviço Google Drive para Browser (Frontend)
 */
class GoogleDriveBrowserService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private gapiLoaded: boolean = false;
  private tokenClient: TokenClient | null = null;
  private readonly DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';

  private handleTokenResponse = (response: TokenResponse) => {
    if (response.error) {
      console.error('❌ Erro na autenticaçÍo do Google Drive:', response.error);
      return;
    }
    if (response.access_token) {
      this.accessToken = response.access_token;
      this.saveTokenToStorage(response.access_token, response.expires_in || 3600);
      console.log('✅ Token de acesso obtido e salvo');
    }
  };

  constructor() {
    // Recuperar token do localStorage ao inicializar
    this.loadTokenFromStorage();
  }

  /**
   * Obtém o storage apropriado (sessionStorage para segurança, localStorage para persistência)
   * SEGURANÇA (VER-018): Preferir sessionStorage para reduzir exposiçÍo a XSS
   */
  private getStorage(): Storage {
    return USE_SECURE_STORAGE ? sessionStorage : localStorage;
  }

  /**
   * Carrega token do storage se ainda válido
   */
  private loadTokenFromStorage(): void {
    try {
      const storage = this.getStorage();
      const storedToken = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedExpiry = storage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

      if (storedToken && storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        const now = Date.now();

        // Verificar se token ainda é válido (com margem de 5 minutos)
        if (expiryTime > now + 5 * 60 * 1000) {
          this.accessToken = storedToken;
          this.tokenExpiry = expiryTime;
          // SEGURANÇA: NÍo logar informações sensíveis em produçÍo
          if (import.meta.env.DEV) {
            console.log('✅ Token Google Drive recuperado (válido até:', new Date(expiryTime).toLocaleTimeString(), ')');
          }
        } else {
          // Token expirado - limpar
          this.clearTokenFromStorage();
          if (import.meta.env.DEV) {
            console.log('⚠️ Token Google Drive expirado, será necessário fazer login novamente');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar token:', error);
    }
  }

  /**
   * Salva token no storage
   * SEGURANÇA (VER-018): Usando sessionStorage para limitar exposiçÍo
   */
  private saveTokenToStorage(token: string, expiresIn: number = 3600): void {
    try {
      const storage = this.getStorage();
      // expiresIn é em segundos, converter para timestamp
      const expiryTime = Date.now() + (expiresIn * 1000);
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      this.tokenExpiry = expiryTime;
      if (import.meta.env.DEV) {
        console.log('💾 Token Google Drive salvo (válido por', expiresIn / 60, 'minutos)');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
    }
  }

  /**
   * Limpa token do storage
   */
  private clearTokenFromStorage(): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      storage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      this.accessToken = null;
      this.tokenExpiry = null;
    } catch (error) {
      console.error('❌ Erro ao limpar token:', error);
    }
  }

  /**
   * Verifica se o token atual ainda é válido
   */
  private isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiry) return false;
    // Verificar com margem de 5 minutos
    return this.tokenExpiry > Date.now() + 5 * 60 * 1000;
  }

  /**
   * Força desconexÍo (logout)
   */
  disconnect(): void {
    this.clearTokenFromStorage();
    console.log('🔒 Desconectado do Google Drive');
  }

  /**
   * Carrega Google API Client Library
   */
  async loadGapi(): Promise<void> {
    if (this.gapiLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        if (!window.gapi) {
          reject(new Error('Google API Client nÍo carregado'));
          return;
        }
        window.gapi.load('client', async () => {
          await window.gapi!.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          this.gapiLoaded = true;
          console.log('✅ Google API Client carregado');
          resolve();
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Carrega Google Identity Services para OAuth
   */
  async loadGIS(): Promise<void> {
    const initTokenClient = (): TokenClient | null => {
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) return null;
      return oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: this.DRIVE_SCOPES,
        callback: this.handleTokenResponse,
      });
    };

    return new Promise((resolve, reject) => {
      // Verificar se já foi carregado
      if (window.google?.accounts?.oauth2) {
        if (!this.tokenClient) {
          const client = initTokenClient();
          if (!client) {
            reject(new Error('NÍo foi possível inicializar OAuth'));
            return;
          }
          this.tokenClient = client;
        }
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google Identity Services nÍo disponível'));
          return;
        }
        const client = initTokenClient();
        if (!client) {
          reject(new Error('NÍo foi possível inicializar OAuth'));
          return;
        }
        this.tokenClient = client;
        console.log('✅ Google Identity Services carregado');
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Solicita autenticaçÍo do usuário
   * Se token válido existe no localStorage, nÍo pede login novamente
   */
  async authenticate(): Promise<void> {
    // Se já temos um token válido, nÍo precisa fazer nada
    if (this.isTokenValid()) {
      console.log('✅ Usando token Google Drive existente (ainda válido)');
      return;
    }

    await this.loadGapi();
    await this.loadGIS();

    // Se ainda nÍo tem token ou expirou, solicitar novo
    if (!this.accessToken || !this.isTokenValid()) {
      return new Promise((resolve, reject) => {
        if (!this.tokenClient) {
          reject(new Error('Token client nÍo inicializado'));
          return;
        }

        const restoreCallback = () => {
          if (this.tokenClient) {
            this.tokenClient.callback = this.handleTokenResponse;
          }
        };

        this.tokenClient.callback = (response) => {
          if (response.error) {
            console.error('⚠️ Erro na autenticaçÍo:', response.error);
            restoreCallback();
            reject(new Error(response.error));
            return;
          }
          if (response.access_token) {
            this.handleTokenResponse(response);
            restoreCallback();
            resolve();
          }
        };

        this.tokenClient.requestAccessToken();
      });
    }
  }

  /**
   * Cria uma pasta no Google Drive
   * VER-019: Valida nome contra path traversal antes de criar
   */
  async criarPasta(nome: string, parentId: string = FOLDER_ID_BASE): Promise<CreateFolderResult> {
    // VER-019: Validar nome da pasta contra path traversal
    validateFolderName(nome);

    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      // VER-019: Usar nome sanitizado por segurança adicional
      const nomeSanitizado = sanitizeFolderName(nome);

      const metadata = {
        name: nomeSanitizado,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao criar pasta');
      }

      console.log('✅ Pasta criada:', data.name);

      return {
        folderId: data.id,
        folderUrl: data.webViewLink,
      };
    } catch (error) {
      console.error('❌ Erro ao criar pasta:', error);
      throw error;
    }
  }

  /**
   * Cria estrutura recursiva de pastas
   */
  private async criarEstruturaRecursiva(
    estrutura: FolderStructure,
    parentId: string
  ): Promise<void> {
    for (const [nomePasta, subpastas] of Object.entries(estrutura)) {
      const folder = await this.criarPasta(nomePasta, parentId);

      // Se tem subpastas, criar recursivamente
      if (subpastas && typeof subpastas === 'object' && Object.keys(subpastas).length > 0) {
        await this.criarEstruturaRecursiva(subpastas, folder.folderId);
      }
    }
  }

  /**
   * Cria estrutura completa de pastas para cliente
   *
   * ESTRUTURA DE SEGURANÇA:
   * 📁 20251213 - NOME DO CLIENTE              ← Pasta PRIVADA (confidencial)
   *    ├── 00 . Levantamentos Iniciais         ← Interno
   *    ├── 01 . Projeto Executivo              ← Interno
   *    ├── 02 . Engenharia                     ← Interno
   *    ├── 03 . Marcenaria                     ← Interno
   *    ├── 04 . Diário de Obra                 ← Interno
   *    ├── 05 . Financeiro                     ← Interno (NÍO compartilhar!)
   *    └── 📁 (C)20251213-NOME-Projeto         ← Pasta COMPARTILHÁVEL
   *         ├── Projeto Arquitetônico          ← Cliente pode ver
   *         ├── Fotos do Imóvel                ← Cliente pode ver
   *         └── Documentos Aprovados           ← Cliente pode ver
   *
   * A pasta (C) indica que é COMPARTILHÁVEL com o cliente.
   * Todas as outras pastas sÍo CONFIDENCIAIS (uso interno).
   */
  async criarEstruturaPastas(
    clienteNome: string,
    oportunidadeId: string,
    identificacao: string = 'Projeto'
  ): Promise<CreateFolderResult> {
    // Gerar data no formato AAAAMMDD
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}${mes}${dia}`;

    // Nome da pasta principal: AAAAMMDD - NOME COMPLETO DO CLIENTE
    // Exemplo: 20251213 - ELIANA KIELLANDER LOPES
    const nomeClienteFormatado = clienteNome.toUpperCase().trim();
    const folderName = `${dataFormatada} - ${nomeClienteFormatado}`;

    // Criar pasta principal (PRIVADA)
    const mainFolder = await this.criarPasta(folderName, FOLDER_ID_BASE);

    console.log('📁 Criando estrutura completa de pastas...');
    console.log('🔒 Pasta PRIVADA:', folderName);

    // ============================================================
    // ESTRUTURA PRIVADA (Confidencial - Uso Interno)
    // ============================================================
    const estruturaPrivada = {
      '00 . Levantamentos Iniciais': {
        '00 . Medições In Loco': {},
        '00. Briefing do Cliente': {},
        '01 . Fotos do Imóvel': {},
        '02 . DocumentaçÍo do Cliente': {}
      },
      '01 . Projeto Executivo Arquitetônico': {
        '02 . Pré-Projeto Arquitetônico': {
          '00 . Estudos Preliminares': {},
          '01 . Layout Planta Humaniza': {},
          '02 . Moodboards Inspirações': {}
        },
        '00 . Arquitetura': {},
        '01 . Memorial Descritivo': {},
        '02 . Ar Condicionado': {},
        '03 . Elétrica': {},
        '04 . AutomaçÍo': {},
        '04 . Documentos e Exigências Legais': {},
        '05 . Eletros, Eletronicos, DecoraçÍo': {
          '00 . Estofados': {},
          '01 . Eletrodomésticos': {},
          '02 . Eletrônicos': {},
          '04 . Tapetes Cortinas Tecidos': {},
          '05 . Objetos Decorativos': {}
        },
        '05 . Hidráulica': {},
        '06 . Gás': {},
        '07 . Gesso - Forro': {},
        '07 . Marmoraria': {},
        '08 . Marcenaria': {},
        '09 . Pisos e Paredes': {},
        '09 . Vidraçaria': {},
        '10 . Louças e Metais': {}
      },
      '02 . Engenharia - Obra e ExecuçÍo': {},
      '03 . Marcenaria': {},
      '04 . Diário de Obra': {},
      '05 . Financeiro - CONFIDENCIAL': {
        'Orçamentos Internos': {},
        'Custos Reais': {},
        'Margem e Lucro': {}
      },
      '06 . Entrega': {
        'Fotos Finais': {},
        'Garantias': {},
        'Termos de Aceite': {}
      }
    };

    // Criar estrutura privada
    await this.criarEstruturaRecursiva(estruturaPrivada, mainFolder.folderId);

    // ============================================================
    // ESTRUTURA COMPARTILHÁVEL (C) - Visível para o Cliente
    // ============================================================
    // Nome: (C)AAAAMMDD-NOME-Projeto
    const nomeClienteSemEspacos = clienteNome.replace(/\s+/g, '-').toUpperCase();
    const pastaCompartilhavelNome = `(C)${dataFormatada}-${nomeClienteSemEspacos}-${identificacao}`;

    console.log('🌐 Pasta COMPARTILHÁVEL:', pastaCompartilhavelNome);

    const pastaCompartilhavel = await this.criarPasta(pastaCompartilhavelNome, mainFolder.folderId);

    // Estrutura da pasta compartilhável (o que o cliente pode ver)
    const estruturaCompartilhavel = {
      '01 . Projeto Arquitetônico': {
        'Plantas Aprovadas': {},
        'Renders e 3D': {},
        'Memorial Descritivo': {}
      },
      '02 . Fotos da Obra': {
        'Antes': {},
        'Durante': {},
        'Depois': {}
      },
      '03 . Documentos': {
        'Proposta Comercial': {},
        'Contratos': {},
        'Aprovações': {}
      },
      '04 . Acompanhamento': {
        'Cronograma': {},
        'Relatórios de Progresso': {}
      }
    };

    await this.criarEstruturaRecursiva(estruturaCompartilhavel, pastaCompartilhavel.folderId);

    console.log('✅ Estrutura completa criada!');
    console.log('📋 Resumo:');
    console.log('   🔒 Pasta privada (interna):', folderName);
    console.log('   🌐 Pasta compartilhável (cliente):', pastaCompartilhavelNome);

    return mainFolder;
  }

  /**
   * Retorna a pasta compartilhável (C) de um cliente
   * Útil para gerar link de compartilhamento com cliente
   */
  async buscarPastaCompartilhavel(pastaClienteId: string): Promise<SubPasta | null> {
    const subpastas = await this.listarSubpastas(pastaClienteId);

    // Buscar pasta que começa com (C)
    const pastaC = subpastas.find(p => p.name.startsWith('(C)'));

    if (pastaC) {
      console.log('🌐 Pasta compartilhável encontrada:', pastaC.name);
      return pastaC;
    }

    console.log('⚠️ Pasta compartilhável nÍo encontrada');
    return null;
  }

  /**
   * Torna a pasta compartilhável (C) pública para o cliente
   * Mantém a pasta principal privada
   */
  async compartilharPastaCliente(pastaClienteId: string): Promise<string | null> {
    const pastaC = await this.buscarPastaCompartilhavel(pastaClienteId);

    if (!pastaC) {
      console.error('❌ NÍo foi possível encontrar pasta (C) para compartilhar');
      return null;
    }

    // Tornar apenas a pasta (C) pública
    await this.tornarPastaPublica(pastaC.id);

    console.log('✅ Pasta compartilhável agora é pública:', pastaC.name);
    return pastaC.webViewLink;
  }

  /**
   * Faz upload de arquivo para Google Drive
   * VER-019: Valida nome do arquivo contra path traversal
   * VER-020: Valida tipo de arquivo permitido
   */
  async uploadArquivo(file: File, folderId: string): Promise<DriveFile> {
    // VER-019: Validar nome do arquivo contra path traversal
    validateFolderName(file.name);

    // VER-020: Validar tipo de arquivo
    validateFileType(file);

    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      // VER-019: Usar nome sanitizado por segurança adicional
      const nomeArquivoSanitizado = sanitizeFolderName(file.name);

      // Metadata do arquivo
      const metadata = {
        name: nomeArquivoSanitizado,
        parents: [folderId],
      };

      // Criar FormData para multipart upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: form,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao fazer upload');
      }

      console.log('✅ Arquivo enviado:', data.name);

      return data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
      throw error;
    }
  }

  /**
   * Lista arquivos de uma pasta
   */
  async listarArquivos(folderId: string): Promise<DriveFile[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const query = `'${folderId}' in parents and trashed=false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,webContentLink,size,createdTime)&orderBy=createdTime desc`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao listar arquivos');
      }

      return data.files || [];
    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      return [];
    }
  }

  /**
   * Lista arquivos de uma pasta com thumbnails (para visualizador)
   */
  async listarArquivosDaPasta(folderId: string): Promise<DriveFile[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      // Excluir pastas da listagem (apenas arquivos)
      const query = `'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
      const fields = 'files(id,name,mimeType,webViewLink,webContentLink,size,createdTime,modifiedTime,thumbnailLink)';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name&pageSize=100`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = (await response.json()) as DriveListResponse;

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao listar arquivos da pasta');
      }

      // Processar thumbnails - substituir tamanho para melhor qualidade
      const arquivos = (data.files || []).map((file) => ({
        ...file,
        thumbnailLink: file.thumbnailLink ? file.thumbnailLink.replace('=s220', '=s400') : null,
      }));

      console.log(`✅ ${arquivos.length} arquivo(s) encontrado(s) na pasta`);
      return arquivos;
    } catch (error) {
      console.error('❌ Erro ao listar arquivos da pasta:', error);
      return [];
    }
  }

  /**
   * Exclui arquivo
   */
  async excluirArquivo(fileId: string): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir arquivo');
      }

      console.log('✅ Arquivo excluído');
    } catch (error) {
      console.error('❌ Erro ao excluir arquivo:', error);
      throw error;
    }
  }

  /**
   * Torna pasta pública (leitura para qualquer um com o link)
   */
  async tornarPastaPublica(folderId: string): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const permission = {
        role: 'reader',
        type: 'anyone',
      };

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permission),
      });

      if (!response.ok) {
        throw new Error('Erro ao tornar pasta pública');
      }

      console.log('✅ Pasta é pública');
    } catch (error) {
      console.error('❌ Erro ao tornar pasta pública:', error);
      throw error;
    }
  }

  /**
   * Detecta tipo de arquivo
   */
  detectarTipo(filename: string): 'Plantas' | 'Fotos' | 'Documentos' {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (['pdf', 'dwg', 'dxf', 'skp', 'rvt', 'ifc'].includes(ext)) {
      return 'Plantas';
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'Fotos';
    }

    return 'Documentos';
  }

  /**
   * Lista todas as subpastas de uma pasta
   */
  async listarSubpastas(folderId: string): Promise<SubPasta[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const query = `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&orderBy=name`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao listar subpastas');
      }

      return data.files || [];
    } catch (error) {
      console.error('❌ Erro ao listar subpastas:', error);
      return [];
    }
  }

  /**
   * Detecta o tipo de uma pasta baseado no nome
   * Usa padrões comuns para identificar automaticamente
   * Otimizado para estrutura WG Easy
   */
  detectarTipoPasta(nomePasta: string): 'plantas' | 'fotos' | 'documentos' | 'outros' {
    const nome = nomePasta.toLowerCase();

    // Padrões específicos WG Easy para PLANTAS/PROJETOS
    const padroesPlantas = [
      '01 . projeto executivo arquitetônico',
      '01 . projeto executivo arquitetonico',
      'projeto executivo',
      'pré-projeto',
      'pre-projeto',
      'arquitetura',
      'planta',
      'dwg',
      'cad',
      'desenho',
      'layout planta',
      'estudos preliminares'
    ];

    // Padrões específicos WG Easy para FOTOS
    const padroesFotos = [
      '01 . fotos do imóvel',
      '01 . fotos do imovel',
      'fotos do imóvel',
      'fotos do imovel',
      'fotos finais',
      'foto',
      'imagem',
      'galeria',
      'moodboards',
      'inspirações',
      'inspiracao'
    ];

    // Padrões específicos WG Easy para DOCUMENTOS
    const padroesDocumentos = [
      '02 . documentaçÍo do cliente',
      '02 . documentacao do cliente',
      'documentaçÍo',
      'documentacao',
      'briefing',
      '00. briefing do cliente',
      'contrato',
      'proposta',
      'orçamento',
      'orcamento',
      'mediçÍo',
      'medicao',
      'memorial descritivo',
      'documentos e exigências legais',
      'garantias',
      'termos de aceite',
      '00 . levantamentos iniciais'
    ];

    // Verificar padrões (ordem importa - mais específicos primeiro)
    for (const padrao of padroesPlantas) {
      if (nome.includes(padrao)) return 'plantas';
    }

    for (const padrao of padroesFotos) {
      if (nome.includes(padrao)) return 'fotos';
    }

    for (const padrao of padroesDocumentos) {
      if (nome.includes(padrao)) return 'documentos';
    }

    return 'outros';
  }

  /**
   * Mapeia a estrutura de pastas existente (recursivamente)
   * Identifica automaticamente quais pastas usar para cada tipo
   * Otimizado para estrutura WG Easy
   */
  async mapearEstruturaPastas(folderId: string): Promise<MapeamentoPastas> {
    // Buscar todas as subpastas (primeiro nível)
    const subpastas = await this.listarSubpastas(folderId);

    const mapeamento: MapeamentoPastas = {
      plantas: null,
      fotos: null,
      documentos: null,
      outrasPasstas: [],
    };

    // FunçÍo recursiva para buscar em subpastas
    const buscarRecursivamente = async (pastas: SubPasta[], profundidade: number = 0): Promise<void> => {
      if (profundidade > 3) return; // Limitar profundidade para evitar loops

      for (const pasta of pastas) {
        const tipo = this.detectarTipoPasta(pasta.name);
        const nomeNormalizado = pasta.name.toLowerCase();

        switch (tipo) {
          case 'plantas':
            // Prioridade 1: Projeto Executivo Arquitetônico (pasta principal)
            if (nomeNormalizado.includes('01 . projeto executivo')) {
              if (!mapeamento.plantas) {
                mapeamento.plantas = pasta;
              }
            }
            // Prioridade 2: Subpasta de Arquitetura
            else if (nomeNormalizado.includes('arquitetura') && !mapeamento.plantas) {
              mapeamento.plantas = pasta;
            }
            // Prioridade 3: Qualquer pasta de projeto
            else if (!mapeamento.plantas) {
              mapeamento.plantas = pasta;
            }
            break;

          case 'fotos':
            // Prioridade 1: Fotos do Imóvel (dentro de Levantamentos)
            if (nomeNormalizado.includes('01 . fotos do imóvel') || nomeNormalizado.includes('01 . fotos do imovel')) {
              if (!mapeamento.fotos) {
                mapeamento.fotos = pasta;
              }
            }
            // Prioridade 2: Fotos Finais (dentro de Entrega)
            else if (nomeNormalizado.includes('fotos finais') && !mapeamento.fotos) {
              mapeamento.fotos = pasta;
            }
            // Prioridade 3: Qualquer pasta de fotos
            else if (!mapeamento.fotos) {
              mapeamento.fotos = pasta;
            }
            break;

          case 'documentos':
            // Prioridade 1: DocumentaçÍo do Cliente
            if (nomeNormalizado.includes('02 . documentaçÍo do cliente') || nomeNormalizado.includes('02 . documentacao do cliente')) {
              if (!mapeamento.documentos) {
                mapeamento.documentos = pasta;
              }
            }
            // Prioridade 2: Briefing do Cliente
            else if (nomeNormalizado.includes('briefing') && !mapeamento.documentos) {
              mapeamento.documentos = pasta;
            }
            // Prioridade 3: Levantamentos Iniciais
            else if (nomeNormalizado.includes('00 . levantamentos iniciais') && !mapeamento.documentos) {
              mapeamento.documentos = pasta;
            }
            // Prioridade 4: Qualquer pasta de documentos
            else if (!mapeamento.documentos) {
              mapeamento.documentos = pasta;
            }
            break;

          default:
            mapeamento.outrasPasstas.push(pasta);
        }

        // Se ainda nÍo encontrou todas as pastas, buscar recursivamente
        if (!mapeamento.plantas || !mapeamento.fotos || !mapeamento.documentos) {
          const subSubPastas = await this.listarSubpastas(pasta.id);
          if (subSubPastas.length > 0) {
            await buscarRecursivamente(subSubPastas, profundidade + 1);
          }
        }
      }
    };

    // Iniciar busca recursiva
    await buscarRecursivamente(subpastas);

    console.log('📁 Mapeamento detectado:', {
      plantas: mapeamento.plantas?.name || 'NÍo encontrada',
      fotos: mapeamento.fotos?.name || 'NÍo encontrada',
      documentos: mapeamento.documentos?.name || 'NÍo encontrada',
      outras: mapeamento.outrasPasstas.length + ' pasta(s)',
    });

    return mapeamento;
  }

  /**
   * Busca pasta existente do cliente na pasta base
   *
   * FORMATOS SUPORTADOS:
   * - Novo: "20251213 - ELIANA KIELLANDER LOPES"
   * - Antigo: "20251213-ElianaKiellanderLopes-a1b2c3d4"
   *
   * PRIORIDADES DE BUSCA:
   * 1. Por nome completo exato do cliente (novo formato)
   * 2. Por ID único (oportunidadeId) no final do nome (formato antigo)
   * 3. Por primeiro e último nome (fallback)
   */
  async buscarPastaCliente(clienteNome: string, oportunidadeId?: string): Promise<SubPasta | null> {
    try {
      const subpastas = await this.listarSubpastas(FOLDER_ID_BASE);
      const clienteUpper = clienteNome.toUpperCase().trim();
      const clienteNormalizado = clienteNome.toLowerCase().replace(/\s+/g, '');

      // PRIORIDADE 1: Buscar pelo NOVO formato (AAAAMMDD - NOME COMPLETO)
      // Exemplo: "20251213 - ELIANA KIELLANDER LOPES"
      const pastaNovoFormato = subpastas.find(p => {
        // Verifica se contém " - NOME" no formato novo
        return p.name.toUpperCase().includes(` - ${clienteUpper}`);
      });

      if (pastaNovoFormato) {
        console.log('✅ Pasta encontrada (formato novo):', pastaNovoFormato.name);
        return pastaNovoFormato;
      }

      // PRIORIDADE 2: Buscar por ID único no formato antigo
      if (oportunidadeId) {
        const idCurto = oportunidadeId.slice(-8).toLowerCase();

        const pastaComId = subpastas.find(p => {
          const nomeNormalizado = p.name.toLowerCase();
          return nomeNormalizado.includes(idCurto);
        });

        if (pastaComId) {
          console.log('✅ Pasta encontrada por ID único (formato antigo):', pastaComId.name);
          return pastaComId;
        }
      }

      // PRIORIDADE 3: Buscar por nome completo exato sem espaços (formato antigo)
      const pastaFormatoAntigo = subpastas.find(p => {
        const nomeNormalizado = p.name.toLowerCase().replace(/\s+/g, '');
        return nomeNormalizado.includes(`-${clienteNormalizado}-`) ||
               nomeNormalizado.includes(`-${clienteNormalizado}`);
      });

      if (pastaFormatoAntigo) {
        console.log('✅ Pasta encontrada (formato antigo):', pastaFormatoAntigo.name);
        return pastaFormatoAntigo;
      }

      // PRIORIDADE 4: Buscar por primeiro e último nome (fallback)
      const partes = clienteNome.trim().split(/\s+/);
      if (partes.length >= 2) {
        const primeiroNome = partes[0].toLowerCase();
        const ultimoNome = partes[partes.length - 1].toLowerCase();

        const pastaComNomes = subpastas.find(p => {
          const nomeNormalizado = p.name.toLowerCase();
          return nomeNormalizado.includes(primeiroNome) &&
                 nomeNormalizado.includes(ultimoNome);
        });

        if (pastaComNomes) {
          console.log('✅ Pasta encontrada por primeiro/último nome:', pastaComNomes.name);
          return pastaComNomes;
        }
      }

      console.log('ℹ️ Pasta do cliente nÍo encontrada para:', clienteNome);
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar pasta do cliente:', error);
      return null;
    }
  }

  /**
   * Encontra ou cria estrutura de pastas para cliente
   * Se já existir, mapeia a estrutura. Se nÍo, cria nova.
   */
  async encontrarOuCriarEstrutura(
    clienteNome: string,
    oportunidadeId: string
  ): Promise<{ pastaId: string; pastaUrl: string; mapeamento: MapeamentoPastas }> {
    // Buscar pasta existente
    const pastaExistente = await this.buscarPastaCliente(clienteNome, oportunidadeId);

    if (pastaExistente) {
      // Pasta já existe - mapear estrutura
      console.log('📂 Usando pasta existente e mapeando estrutura...');
      const mapeamento = await this.mapearEstruturaPastas(pastaExistente.id);

      return {
        pastaId: pastaExistente.id,
        pastaUrl: pastaExistente.webViewLink,
        mapeamento,
      };
    } else {
      // Pasta nÍo existe - criar nova estrutura
      console.log('📁 Criando nova estrutura de pastas...');
      const result = await this.criarEstruturaPastas(clienteNome, oportunidadeId);

      // Mapear a estrutura recém-criada
      const mapeamento = await this.mapearEstruturaPastas(result.folderId);

      return {
        pastaId: result.folderId,
        pastaUrl: result.folderUrl,
        mapeamento,
      };
    }
  }

  /**
   * Verifica se está autenticado (com token válido)
   */
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  /**
   * Retorna tempo restante do token em minutos
   */
  getTokenRemainingMinutes(): number {
    if (!this.tokenExpiry) return 0;
    const remaining = this.tokenExpiry - Date.now();
    return Math.max(0, Math.floor(remaining / 60000));
  }

  /**
   * SEGURANÇA (VER-017): Obtém pasta específica do cliente
   * Em vez de expor a pasta raiz, busca a pasta isolada do cliente
   *
   * @param clienteDriveFolderId - ID da pasta do cliente (de pessoas.drive_folder_id)
   * @returns ID da pasta do cliente ou fallback para pasta base (apenas para admins)
   */
  getClienteFolderId(clienteDriveFolderId: string | null | undefined): string {
    // Se o cliente tem pasta própria configurada, usar ela
    if (clienteDriveFolderId) {
      return clienteDriveFolderId;
    }

    // AVISO: Fallback para pasta base - deve ser usado apenas por admins
    // Em produçÍo, clientes sem pasta configurada nÍo devem ter acesso
    if (import.meta.env.DEV) {
      console.warn('⚠️ SEGURANÇA: Cliente sem pasta própria, usando pasta base (apenas para admin)');
    }
    return FOLDER_ID_BASE;
  }

  /**
   * SEGURANÇA (VER-017): Cria estrutura de pastas para cliente com isolamento
   * Salva o ID da pasta criada para uso futuro (deve ser persistido no banco)
   */
  async criarEstruturaPastasIsolada(
    clienteNome: string,
    oportunidadeId: string,
    identificacao: string = 'Projeto'
  ): Promise<{ pastaId: string; pastaUrl: string; pastaCompartilhavelId?: string }> {
    // Criar estrutura de pastas
    const result = await this.criarEstruturaPastas(clienteNome, oportunidadeId, identificacao);

    // Buscar pasta compartilhável (C) para retornar também
    const pastaC = await this.buscarPastaCompartilhavel(result.folderId);

    return {
      pastaId: result.folderId,
      pastaUrl: result.folderUrl,
      pastaCompartilhavelId: pastaC?.id,
    };
  }
}

// Exportar instância singleton
export const googleDriveService = new GoogleDriveBrowserService();

// Exportar tipos
export type { DriveFile, CreateFolderResult, SubPasta, MapeamentoPastas };


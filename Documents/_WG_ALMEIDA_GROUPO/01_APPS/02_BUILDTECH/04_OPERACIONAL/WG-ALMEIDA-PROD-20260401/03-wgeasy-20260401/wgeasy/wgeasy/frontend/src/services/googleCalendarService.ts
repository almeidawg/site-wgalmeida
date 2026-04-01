// ============================================================
// SERVICO: Google Calendar Integration
// Sistema WG Easy - Grupo WG Almeida
// Sincronizacao bidirecional com Google Calendar
// ============================================================

const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// Verificar se as credenciais estao configuradas
const IS_CONFIGURED = Boolean(API_KEY && CLIENT_ID);

// Prefixos para persistencia no localStorage (+ usuario_id para separar por usuario)
const STORAGE_KEY_PREFIX = {
  ACCESS_TOKEN: 'wgeasy_google_calendar_token_',
  TOKEN_EXPIRY: 'wgeasy_google_calendar_expiry_',
};

// Chave para armazenar qual usuario esta logado no calendar
const CURRENT_USER_KEY = 'wgeasy_google_calendar_current_user';

type GoogleCalendarTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type GoogleCalendarTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
  callback?: (response: GoogleCalendarTokenResponse) => void;
};

interface GoogleCalendarTokenClientOptions {
  client_id: string;
  scope: string;
  callback: (response: GoogleCalendarTokenResponse) => void;
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
          initTokenClient: (opts: GoogleCalendarTokenClientOptions) => GoogleCalendarTokenClient;
        };
      };
    };
  }
}

// Interface para eventos do Google Calendar
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
  // Campos extras retornados pela API
  created?: string;
  updated?: string;
  htmlLink?: string;
  status?: string;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
}

// Interface para criar/atualizar eventos
export interface EventInput {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  reminderMinutes?: number;
}

// Mapeamento de cores do Google Calendar
export const GOOGLE_CALENDAR_COLORS: Record<string, { background: string; foreground: string }> = {
  '1': { background: '#a4bdfc', foreground: '#1d1d1d' },   // Lavanda
  '2': { background: '#7ae7bf', foreground: '#1d1d1d' },   // Verde
  '3': { background: '#dbadff', foreground: '#1d1d1d' },   // Roxo
  '4': { background: '#ff887c', foreground: '#1d1d1d' },   // Vermelho
  '5': { background: '#fbd75b', foreground: '#1d1d1d' },   // Amarelo
  '6': { background: '#ffb878', foreground: '#1d1d1d' },   // Laranja
  '7': { background: '#46d6db', foreground: '#1d1d1d' },   // Turquesa
  '8': { background: '#e1e1e1', foreground: '#1d1d1d' },   // Cinza
  '9': { background: '#5484ed', foreground: '#ffffff' },   // Azul
  '10': { background: '#51b749', foreground: '#ffffff' },  // Verde escuro
  '11': { background: '#dc2127', foreground: '#ffffff' },  // Vermelho escuro
};

/**
 * Servico Google Calendar para Browser (Frontend)
 */
class GoogleCalendarService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private gapiLoaded: boolean = false;
  private gsiLoaded: boolean = false;
  private tokenClient: GoogleCalendarTokenClient | null = null;
  private currentUserId: string | null = null;
  private readonly CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
  private readonly DRIVE_DISCOVERY = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

  private handleTokenResponse = (response: GoogleCalendarTokenResponse) => {
    if (response.error) {
      console.error('[GoogleCalendar] Erro na autenticaçÍo:', response.error);
      return;
    }
    if (response.access_token) {
      this.accessToken = response.access_token;
      this.saveTokenToStorage(response.access_token, response.expires_in || 3600);
      console.log('[GoogleCalendar] Token obtido com sucesso');
    }
  };

  constructor() {
    // Verificar se ha usuario salvo no localStorage
    const savedUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUserId) {
      this.currentUserId = savedUserId;
      this.loadTokenFromStorage();
    }
  }

  /**
   * Define o usuario atual para separar tokens por usuario
   * IMPORTANTE: Chamar este metodo ao fazer login
   */
  setUsuarioId(usuarioId: string): void {
    // Se mudou de usuario, limpar token anterior e carregar do novo
    if (this.currentUserId !== usuarioId) {
      console.log(`[GoogleCalendar] Mudando de usuario: ${this.currentUserId} -> ${usuarioId}`);
      this.accessToken = null;
      this.tokenExpiry = null;
      this.currentUserId = usuarioId;
      localStorage.setItem(CURRENT_USER_KEY, usuarioId);
      this.loadTokenFromStorage();
    }
  }

  /**
   * Retorna o ID do usuario atual
   */
  getUsuarioId(): string | null {
    return this.currentUserId;
  }

  /**
   * Obtem as chaves de storage para o usuario atual
   */
  private getStorageKeys() {
    const suffix = this.currentUserId || 'anonymous';
    return {
      ACCESS_TOKEN: `${STORAGE_KEY_PREFIX.ACCESS_TOKEN}${suffix}`,
      TOKEN_EXPIRY: `${STORAGE_KEY_PREFIX.TOKEN_EXPIRY}${suffix}`,
    };
  }

  /**
   * Carrega token do localStorage se ainda valido
   */
  private loadTokenFromStorage(): void {
    try {
      const storageKeys = this.getStorageKeys();
      const storedToken = localStorage.getItem(storageKeys.ACCESS_TOKEN);
      const storedExpiry = localStorage.getItem(storageKeys.TOKEN_EXPIRY);

      if (storedToken && storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        const now = Date.now();

        if (expiryTime > now + 5 * 60 * 1000) {
          this.accessToken = storedToken;
          this.tokenExpiry = expiryTime;
          console.log(`[GoogleCalendar] Token recuperado para usuario ${this.currentUserId}`);
        } else {
          this.clearTokenFromStorage();
          console.log('[GoogleCalendar] Token expirado, necessario novo login');
        }
      }
    } catch (error) {
      console.error('[GoogleCalendar] Erro ao carregar token:', error);
    }
  }

  /**
   * Salva token no localStorage
   */
  private saveTokenToStorage(token: string, expiresIn: number = 3600): void {
    try {
      const storageKeys = this.getStorageKeys();
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(storageKeys.ACCESS_TOKEN, token);
      localStorage.setItem(storageKeys.TOKEN_EXPIRY, expiryTime.toString());
      this.tokenExpiry = expiryTime;
      console.log(`[GoogleCalendar] Token salvo para usuario ${this.currentUserId}`);
    } catch (error) {
      console.error('[GoogleCalendar] Erro ao salvar token:', error);
    }
  }

  /**
   * Limpa token do localStorage
   */
  private clearTokenFromStorage(): void {
    try {
      const storageKeys = this.getStorageKeys();
      localStorage.removeItem(storageKeys.ACCESS_TOKEN);
      localStorage.removeItem(storageKeys.TOKEN_EXPIRY);
      this.accessToken = null;
      this.tokenExpiry = null;
    } catch (error) {
      console.error('[GoogleCalendar] Erro ao limpar token:', error);
    }
  }

  /**
   * Verifica se o token atual ainda e valido
   */
  isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiry) return false;
    return this.tokenExpiry > Date.now() + 5 * 60 * 1000;
  }

  /**
   * Verifica se esta conectado
   */
  isConnected(): boolean {
    return this.isTokenValid();
  }

  /**
   * Verifica se o servico esta configurado (variaveis de ambiente)
   */
  isConfigured(): boolean {
    return IS_CONFIGURED;
  }

  /**
   * Forca desconexao (logout)
   */
  disconnect(): void {
    this.clearTokenFromStorage();
    console.log('[GoogleCalendar] Desconectado');
  }

  /**
   * Carrega Google API Client Library
   */
  private async loadGapi(): Promise<void> {
    if (this.gapiLoaded) return;

    return new Promise((resolve, reject) => {
      if (window.gapi) {
        this.gapiLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi?.load('client', async () => {
          await window.gapi!.client.init({
            apiKey: API_KEY,
            discoveryDocs: this.DRIVE_DISCOVERY,
          });
          this.gapiLoaded = true;
          console.log('[GoogleCalendar] GAPI carregado');
          resolve();
        });
      };
      script.onerror = () => reject(new Error('Falha ao carregar Google API'));
      document.body.appendChild(script);
    });
  }

  /**
   * Carrega Google Identity Services para OAuth
   */
  private async loadGIS(): Promise<void> {
    if (this.gsiLoaded && this.tokenClient) return;

    return new Promise((resolve, reject) => {
      const initTokenClient = () => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (!oauth2) {
          reject(new Error('Google Identity Services nÍo disponível'));
          return;
        }
        this.tokenClient = oauth2.initTokenClient({
          client_id: CLIENT_ID!,
          scope: this.CALENDAR_SCOPE,
          callback: this.handleTokenResponse,
        });
        this.gsiLoaded = true;
        resolve();
      };

      if (window.google?.accounts?.oauth2) {
        initTokenClient();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        initTokenClient();
        console.log('[GoogleCalendar] GSI carregado');
      };
      script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'));
      document.body.appendChild(script);
    });
  }

  /**
   * Solicita autenticacao do usuario
   */
  async authenticate(): Promise<void> {
    // Verificar se esta configurado
    if (!IS_CONFIGURED) {
      throw new Error(
        'Google Calendar nao configurado. ' +
        'Configure VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_API_KEY no arquivo .env'
      );
    }

    if (this.isTokenValid()) {
      console.log('[GoogleCalendar] Usando token existente');
      return;
    }

    await this.loadGapi();
    await this.loadGIS();

    if (!this.accessToken || !this.isTokenValid()) {
      return new Promise((resolve, reject) => {
        if (!this.tokenClient) {
          reject(new Error('Token client nÍo inicializado'));
          return;
        }

        const previousCallback = this.tokenClient.callback;
        this.tokenClient.callback = (response) => {
          if (response.error) {
            console.error('[GoogleCalendar] Erro na autenticacao:', response.error);
            this.tokenClient!.callback = previousCallback;
            reject(new Error(response.error));
            return;
          }
          if (response.access_token) {
            this.handleTokenResponse(response);
            this.tokenClient!.callback = previousCallback;
            resolve();
          }
        };
        this.tokenClient.requestAccessToken();
      });
    }
  }

  /**
   * Faz requisicao para a API do Google Calendar
   */
  private async apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const url = `${CALENDAR_API_BASE}${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET' && method !== 'DELETE') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[GoogleCalendar] Erro na API:', errorData);

      // Se token invalido, tentar renovar
      if (response.status === 401) {
        this.clearTokenFromStorage();
        throw new Error('Sessao expirada. Por favor, conecte novamente.');
      }

      // Erro 403 - API nao habilitada ou sem permissao
      if (response.status === 403) {
        const errorMessage = errorData.error?.message || '';
        if (errorMessage.includes('has not been used') || errorMessage.includes('PERMISSION_DENIED')) {
          console.error('[GoogleCalendar] API nao habilitada no Google Cloud Console');
          throw new Error(
            'Google Calendar API nao esta habilitada. ' +
            'Acesse console.cloud.google.com, va em "APIs e Servicos" > "Biblioteca" ' +
            'e ative a "Google Calendar API".'
          );
        }
        throw new Error('Sem permissao para acessar o Google Calendar. Verifique suas credenciais.');
      }

      throw new Error(errorData.error?.message || 'Erro na API do Google Calendar');
    }

    // DELETE retorna 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Lista eventos do calendario
   */
  async listEvents(timeMin?: Date, timeMax?: Date, maxResults: number = 100): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) {
      params.append('timeMin', timeMin.toISOString());
    }
    if (timeMax) {
      params.append('timeMax', timeMax.toISOString());
    }

    const response = await this.apiRequest<{ items: GoogleCalendarEvent[] }>(
      `/calendars/primary/events?${params.toString()}`
    );

    return response.items || [];
  }

  /**
   * Busca um evento especifico
   */
  async getEvent(eventId: string): Promise<GoogleCalendarEvent> {
    return this.apiRequest<GoogleCalendarEvent>(`/calendars/primary/events/${eventId}`);
  }

  /**
   * Cria um novo evento
   */
  async createEvent(input: EventInput): Promise<GoogleCalendarEvent> {
    const event: Partial<GoogleCalendarEvent> = {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: {
        dateTime: input.startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: input.endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
    };

    if (input.reminderMinutes !== undefined) {
      event.reminders = {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: input.reminderMinutes },
        ],
      };
    }

    return this.apiRequest<GoogleCalendarEvent>('/calendars/primary/events', 'POST', event);
  }

  /**
   * Atualiza um evento existente
   */
  async updateEvent(eventId: string, input: Partial<EventInput>): Promise<GoogleCalendarEvent> {
    const updates: Partial<GoogleCalendarEvent> = {};

    if (input.summary) updates.summary = input.summary;
    if (input.description !== undefined) updates.description = input.description;
    if (input.location !== undefined) updates.location = input.location;

    if (input.startDateTime) {
      updates.start = {
        dateTime: input.startDateTime,
        timeZone: 'America/Sao_Paulo',
      };
    }

    if (input.endDateTime) {
      updates.end = {
        dateTime: input.endDateTime,
        timeZone: 'America/Sao_Paulo',
      };
    }

    if (input.reminderMinutes !== undefined) {
      updates.reminders = {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: input.reminderMinutes },
        ],
      };
    }

    return this.apiRequest<GoogleCalendarEvent>(`/calendars/primary/events/${eventId}`, 'PATCH', updates);
  }

  /**
   * Exclui um evento
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.apiRequest<void>(`/calendars/primary/events/${eventId}`, 'DELETE');
  }

  /**
   * Obtem eventos do mes atual
   */
  async getEventsForMonth(year: number, month: number): Promise<GoogleCalendarEvent[]> {
    const timeMin = new Date(year, month, 1);
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59);
    return this.listEvents(timeMin, timeMax);
  }

  /**
   * Obtem eventos de hoje
   */
  async getTodayEvents(): Promise<GoogleCalendarEvent[]> {
    const today = new Date();
    const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return this.listEvents(timeMin, timeMax);
  }

  /**
   * Obtem proximos eventos (7 dias)
   */
  async getUpcomingEvents(days: number = 7): Promise<GoogleCalendarEvent[]> {
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + days);
    return this.listEvents(timeMin, timeMax);
  }
}

// Exportar instancia singleton
export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;


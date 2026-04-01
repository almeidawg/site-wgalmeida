// ============================================================
// SERVIÇO: Google Drive Integration
// Gerenciamento de pastas e arquivos no Google Drive
// Chama o backend para operações do Drive
// ============================================================

// ConfiguraçÍo do backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  directImageUrl?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
  createdTime?: string;
}

interface CreateFolderResult {
  folderId: string;
  folderUrl: string;
}

/**
 * Classe de serviço para integraçÍo com Google Drive via Backend
 */
class GoogleDriveService {
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_API_KEY,
    };
  }

  /**
   * Cria uma pasta para o cliente/oportunidade
   * @param clienteNome Nome do cliente
   * @param _oportunidadeId ID da oportunidade (nÍo utilizado no momento)
   * @returns ID e URL da pasta criada
   */
  async criarPastaCliente(clienteNome: string, _oportunidadeId: string): Promise<CreateFolderResult> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/drive/cliente-folder`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ clienteNome }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar pasta: ${errorText}`);
      }

      const data = await response.json();
      return {
        folderId: data.id,
        folderUrl: data.webViewLink,
      };
    } catch (error) {
      console.error("❌ Erro ao criar pasta no Google Drive:", error);
      throw error;
    }
  }

  /**
   * Cria estrutura completa de pastas para um cliente
   */
  async criarEstruturaPastasCliente(clienteNome: string): Promise<CreateFolderResult> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/drive/create-structure`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ clienteNome }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar estrutura: ${errorText}`);
      }

      const data = await response.json();
      return {
        folderId: data.id,
        folderUrl: data.webViewLink,
      };
    } catch (error) {
      console.error("❌ Erro ao criar estrutura de pastas:", error);
      throw error;
    }
  }

  /**
   * Busca uma pasta por nome
   */
  async buscarPasta(nome: string, parentId?: string): Promise<DriveFolder | null> {
    try {
      const params = new URLSearchParams({ folderName: nome });
      if (parentId) {
        params.append("parentFolderId", parentId);
      }

      const response = await fetch(
        `${BACKEND_URL}/api/drive/find-folder?${params.toString()}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erro ao buscar pasta: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Erro ao buscar pasta:", error);
      return null;
    }
  }

  /**
   * Lista arquivos de uma pasta
   */
  async listarArquivos(pastaId: string, mimeTypeFilter?: string): Promise<DriveFile[]> {
    try {
      const params = new URLSearchParams({ folderId: pastaId });
      if (mimeTypeFilter) {
        params.append("mimeType", mimeTypeFilter);
      }

      const response = await fetch(
        `${BACKEND_URL}/api/drive/list-files?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "x-internal-key": INTERNAL_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao listar arquivos: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error("❌ Erro ao listar arquivos:", error);
      return [];
    }
  }

  /**
   * Lista imagens do Diário de Obra de um cliente
   */
  async listarImagensDiarioObra(
    clienteFolderId: string
  ): Promise<{ folder: string; files: DriveFile[] }[]> {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/drive/diario-obra-images?folderId=${clienteFolderId}`,
        {
          method: "GET",
          headers: {
            "x-internal-key": INTERNAL_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao listar imagens: ${response.statusText}`);
      }

      const data = await response.json();
      // Backend retorna { success, groups, totalImages }
      return data.groups || data || [];
    } catch (error) {
      console.error("❌ Erro ao listar imagens do diário de obra:", error);
      return [];
    }
  }

  /**
   * Obtém URL de autenticaçÍo OAuth2 para Drive (se necessário)
   */
  async obterUrlAutenticacao(): Promise<string> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/drive/auth-url`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter URL de autenticaçÍo: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("❌ Erro ao obter URL de autenticaçÍo:", error);
      throw error;
    }
  }

  /**
   * Detecta o tipo de arquivo baseado na extensÍo
   */
  detectarTipo(filename: string): "Plantas" | "Fotos" | "Documentos" {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    // Plantas e projetos
    if (["pdf", "dwg", "dxf", "skp", "rvt", "ifc"].includes(ext)) {
      return "Plantas";
    }

    // Fotos e imagens
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
      return "Fotos";
    }

    // Documentos gerais
    return "Documentos";
  }
}

// Exportar instância única (singleton)
export const googleDriveService = new GoogleDriveService();

// Exportar tipos
export type { DriveFile, DriveFolder, CreateFolderResult };


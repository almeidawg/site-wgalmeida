import { useCallback, useEffect, useState } from "react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";

export interface ClienteAreaInfo {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  drive_link?: string | null;
  contratos: { id: string; status: string }[];
  acessoLiberado: boolean;
}

const STATUS_VALIDOS = ["aguardando_assinatura", "ativo", "concluido"];

export function useClientesArea() {
  const [clientes, setClientes] = useState<ClienteAreaInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Buscar clientes COM contratos válidos
      const { data: contratos, error } = await supabase
        .from("contratos")
        .select("id, cliente_id, status")
        .in("status", STATUS_VALIDOS)
        .not("cliente_id", "is", null);

      if (error) throw error;

      const clienteIdsComContrato = Array.from(
        new Set((contratos || []).map((c) => c.cliente_id).filter(Boolean))
      ) as string[];

      // 2. Buscar clientes COM drive_link definido (adicionados manualmente)
      const { data: pessoasComDrive, error: driveError } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone, drive_link, avatar_url, foto_url")
        .not("drive_link", "is", null)
        .neq("drive_link", "");

      // Se a coluna drive_link não existir, ignora o erro
      const clientesComDrive = driveError ? [] : (pessoasComDrive || []);
      const clienteIdsComDrive = clientesComDrive.map((p) => p.id);

      // 3. Combinar IDs únicos
      const todosClienteIds = Array.from(
        new Set([...clienteIdsComContrato, ...clienteIdsComDrive])
      );

      if (todosClienteIds.length === 0) {
        setClientes([]);
        return;
      }

      // 4. Buscar dados de todas as pessoas
      const { data: pessoas, error: pessoasError } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone, drive_link, avatar_url, foto_url")
        .in("id", todosClienteIds);

      if (pessoasError) throw pessoasError;

      const pessoasMap = new Map((pessoas || []).map((p) => [p.id, p]));

      const lista = todosClienteIds.map((id) => {
        const pessoa = pessoasMap.get(id);
        const contratosDoCliente = (contratos || []).filter((c) => c.cliente_id === id);
        const temDriveLink = !!(pessoa as any)?.drive_link;

        return {
          id,
          nome: pessoa?.nome || "Cliente",
          email: pessoa?.email ?? null,
          telefone: pessoa?.telefone ?? null,
          avatar_url: (pessoa as any)?.avatar_url ?? null,
          foto_url: (pessoa as any)?.foto_url ?? null,
          drive_link: (pessoa as any)?.drive_link ?? null,
          contratos: contratosDoCliente.map((c) => ({ id: c.id, status: c.status })),
          // Acesso liberado se tem contrato emitido (não rascunho/concluido/cancelado) OU se tem drive_link
          acessoLiberado: contratosDoCliente.some((c) => !["rascunho", "concluido", "cancelado"].includes(c.status)) || temDriveLink,
        };
      });

      setClientes(lista);
    } catch (err) {
      console.error("Erro ao carregar clientes da área do cliente:", err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { clientes, loading, reload: carregar, setClientes };
}



// ─── EasyRealState Service ────────────────────────────────────────────────────

import { supabase } from "@/lib/supabaseClient";
import { selecionarComparaveis, calcularAVM } from "../engine/avm";
import { MOCK_TRANSACOES_ALL } from "../data/mockTransacoes";
import type { Imovel, Transacao, ResultadoAVM, RadarPreco, Comparavel } from "../models/types";

export const realEstateService = {

  // ─── Transações ────────────────────────────────────────────────────────────

  async getTransacoesPorRegiao(
    lat: number,
    lng: number,
    raioKm = 2,
    limite = 100
  ): Promise<Transacao[]> {
    // Bounding box simples para pré-filtrar (1 grau lat ≈ 111km)
    const delta = raioKm / 111;
    const { data, error } = await supabase
      .from("real_estate_transacoes")
      .select("*")
      .gte("lat", lat - delta)
      .lte("lat", lat + delta)
      .gte("lng", lng - delta)
      .lte("lng", lng + delta)
      .order("data", { ascending: false })
      .limit(limite);

    if (error) throw error;
    return (data || []) as Transacao[];
  },

  async getTransacoesPorCep(cep: string, limite = 50): Promise<Transacao[]> {
    const { data, error } = await supabase
      .from("real_estate_transacoes")
      .select("*")
      .eq("cep", cep.replace(/\D/g, ""))
      .order("data", { ascending: false })
      .limit(limite);

    if (error) throw error;
    return (data || []) as Transacao[];
  },

  async criarTransacao(payload: Omit<Transacao, "id" | "preco_m2" | "confianca">): Promise<Transacao> {
    // preco_m2 é coluna GENERATED (valor/area_m2) — não passar no INSERT
    const { data, error } = await supabase
      .from("real_estate_transacoes")
      .insert({ ...payload, confianca: 80 })
      .select()
      .single();
    if (error) throw error;
    return data as Transacao;
  },

  // ─── Imóveis ───────────────────────────────────────────────────────────────

  async getImoveis(tenantId?: string): Promise<Imovel[]> {
    let query = supabase.from("real_estate_imoveis").select("*").order("created_at", { ascending: false });
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Imovel[];
  },

  async criarImovel(payload: Omit<Imovel, "id">): Promise<Imovel> {
    const { data, error } = await supabase
      .from("real_estate_imoveis")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Imovel;
  },

  // ─── AVM — Avaliação automática ────────────────────────────────────────────

  async avaliarImovel(imovel: Imovel): Promise<{ resultado: ResultadoAVM; comparaveis: Comparavel[] }> {
    if (!imovel.lat || !imovel.lng) {
      throw new Error("Imóvel precisa de coordenadas geográficas para avaliação AVM.");
    }

    // Busca transações reais no banco
    let transacoes = await this.getTransacoesPorRegiao(imovel.lat, imovel.lng, 3, 150);

    // Se não houver dados suficientes, usa mock (modo demonstração)
    const usandoMock = transacoes.length < 5;
    if (usandoMock) {
      transacoes = [
        ...transacoes,
        ...MOCK_TRANSACOES_ALL.filter(
          (t) => t.tipo === imovel.tipo || t.tipo_transacao === "venda"
        ),
      ];
    }

    const comparaveis = selecionarComparaveis(imovel, transacoes, 2000, 30);

    if (comparaveis.length < 3) {
      throw new Error("Dados insuficientes para avaliação. Adicione transações reais da região.");
    }

    const resultado = calcularAVM(imovel, comparaveis);

    // Adiciona flag de modo demo no score se usando mock
    if (usandoMock) {
      resultado.score_confianca = Math.min(resultado.score_confianca, 55);
    }

    return { resultado, comparaveis };
  },

  // ─── Radar de Preço por Região ─────────────────────────────────────────────

  async getRadarPreco(cep: string): Promise<RadarPreco | null> {
    const { data, error } = await supabase
      .from("real_estate_radar_cache")
      .select("*")
      .eq("cep", cep.replace(/\D/g, ""))
      .order("ultima_atualizacao", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as RadarPreco;
  },

  // ─── CEP → Coordenadas (ViaCEP + Nominatim) ────────────────────────────────

  async geocodarCep(cep: string): Promise<{ lat: number; lng: number; endereco: string; estado: string; cidade: string; bairro: string } | null> {
    const cepLimpo = cep.replace(/\D/g, "");
    try {
      // Passo 1: ViaCEP → endereço estruturado (funciona sem CORS issues)
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) return null;

      const enderecoFormatado = [data.logradouro, data.bairro, data.localidade, data.uf]
        .filter(Boolean).join(", ");

      // Passo 2: Google Geocoding API (CORS-friendly, chave pública)
      const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
      if (GOOGLE_KEY) {
        const query = encodeURIComponent(`${enderecoFormatado}, Brasil`);
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_KEY}`
        );
        const geoData = await geoRes.json();
        if (geoData.results?.[0]) {
          const loc = geoData.results[0].geometry.location;
          return {
            lat: loc.lat,
            lng: loc.lng,
            endereco: enderecoFormatado,
            estado: data.uf || "",
            cidade: data.localidade || "",
            bairro: data.bairro || "",
          };
        }
      }

      // Fallback: geocode.maps.co (gratuito, sem CORS)
      const fallbackRes = await fetch(
        `https://geocode.maps.co/search?q=${encodeURIComponent(enderecoFormatado + ", Brasil")}&api_key=fallback`
      );
      const fallbackData = await fallbackRes.json().catch(() => []);
      if (Array.isArray(fallbackData) && fallbackData[0]) {
        return {
          lat: parseFloat(fallbackData[0].lat),
          lng: parseFloat(fallbackData[0].lon),
          endereco: enderecoFormatado,
          estado: data.uf || "",
          cidade: data.localidade || "",
          bairro: data.bairro || "",
        };
      }

      // Último fallback: retornar coordenadas aproximadas por UF (centróides dos estados)
      const CENTROS_UF: Record<string, [number, number]> = {
        SP: [-23.5505, -46.6333], RJ: [-22.9068, -43.1729], MG: [-19.9167, -43.9345],
        RS: [-30.0346, -51.2177], PR: [-25.4297, -49.2711], SC: [-27.5954, -48.5480],
        BA: [-12.9714, -38.5014], GO: [-16.6864, -49.2643], DF: [-15.7942, -47.8825],
        ES: [-20.3155, -40.3128], PE: [-8.0476, -34.8770], CE: [-3.7172, -38.5433],
        PA: [-1.4558, -48.5044], MT: [-15.6014, -56.0979], MS: [-20.4428, -54.6462],
        AM: [-3.1019, -60.0250], RN: [-5.7945, -35.2110], PB: [-7.1195, -34.8450],
        AL: [-9.6658, -35.7350], SE: [-10.9472, -37.0731], PI: [-5.0892, -42.8019],
        MA: [-2.5297, -44.3028], RO: [-8.7612, -63.9004], AC: [-9.9754, -67.8249],
        AP: [0.0389, -51.0664], RR: [2.8235, -60.6758], TO: [-10.2491, -48.3243],
      };
      const centro = CENTROS_UF[data.uf];
      if (centro) {
        return {
          lat: centro[0],
          lng: centro[1],
          endereco: enderecoFormatado,
          estado: data.uf || "",
          cidade: data.localidade || "",
          bairro: data.bairro || "",
        };
      }

      return null;
    } catch {
      return null;
    }
  },
};

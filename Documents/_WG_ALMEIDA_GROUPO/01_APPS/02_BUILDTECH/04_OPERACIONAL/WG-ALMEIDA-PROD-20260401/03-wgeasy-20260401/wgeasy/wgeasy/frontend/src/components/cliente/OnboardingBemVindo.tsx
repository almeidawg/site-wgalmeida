// ============================================================
// COMPONENTE: OnboardingBemVindo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Tela de boas-vindas e orientações iniciais para o cliente
// Apresenta o Grupo WG e orienta sobre a jornada do projeto
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Hammer, Paintbrush, FileText, MessageSquare, Calendar, Sparkles, ArrowRight, Phone, Mail, Heart, ChevronRight } from "lucide-react";
import WGStarIcon from "@/components/icons/WGStarIcon";

interface OnboardingBemVindoProps {
  clienteId: string;
  clienteNome?: string;
  nucleosContratados?: string[];
  onIniciar?: () => void;
}

// Informações dos núcleos
const NUCLEOS_INFO = {
  arquitetura: {
    icon: Building2,
    titulo: "Arquitetura",
    cor: "bg-blue-500",
    descricao: "Projetos arquitetônicos, layouts e design de interiores",
  },
  engenharia: {
    icon: Hammer,
    titulo: "Engenharia",
    cor: "bg-orange-500",
    descricao: "ExecuçÍo de obras, reformas e construções",
  },
  marcenaria: {
    icon: Paintbrush,
    titulo: "Marcenaria",
    cor: "bg-amber-500",
    descricao: "Móveis planejados sob medida e instalaçÍo",
  },
};

// Etapas do onboarding de boas-vindas
const ETAPAS_BOAS_VINDAS = [
  {
    id: 1,
    titulo: "Conheça seu Portal",
    descricao: "Nesta área você acompanha todo o andamento do seu projeto em tempo real.",
    icone: Sparkles,
  },
  {
    id: 2,
    titulo: "Documentos e Arquivos",
    descricao: "Acesse plantas, propostas, contratos e fotos do seu projeto.",
    icone: FileText,
  },
  {
    id: 3,
    titulo: "Cronograma",
    descricao: "Veja as datas previstas para cada etapa do seu projeto.",
    icone: Calendar,
  },
  {
    id: 4,
    titulo: "ComunicaçÍo",
    descricao: "Entre em contato conosco diretamente pelo portal quando precisar.",
    icone: MessageSquare,
  },
];

export default function OnboardingBemVindo({
  clienteId,
  clienteNome,
  nucleosContratados = [],
  onIniciar,
}: OnboardingBemVindoProps) {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [mostrarBemVindo, setMostrarBemVindo] = useState(true);
  const [nomeCliente, setNomeCliente] = useState(clienteNome || "");

  const carregarNomeCliente = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("pessoas")
        .select("nome")
        .eq("id", clienteId)
        .single();

      if (data?.nome) {
        setNomeCliente(data.nome.split(" ")[0]); // Primeiro nome
      }
    } catch (error) {
      console.error("Erro ao carregar nome:", error);
    }
  }, [clienteId]);

  useEffect(() => {
    if (!clienteNome && clienteId) {
      carregarNomeCliente();
    }
  }, [clienteId, clienteNome, carregarNomeCliente]);

  function avancarEtapa() {
    if (etapaAtual < ETAPAS_BOAS_VINDAS.length - 1) {
      setEtapaAtual(etapaAtual + 1);
    } else {
      setMostrarBemVindo(false);
      onIniciar?.();
    }
  }

  // Tela de boas-vindas inicial
  if (mostrarBemVindo && etapaAtual === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
        <Card className="max-w-2xl w-full overflow-hidden shadow-2xl">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-br from-nucleo-arquitetura via-nucleo-arquitetura/90 to-nucleo-arquitetura/80 p-5 sm:p-8 text-white text-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <WGStarIcon className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-oswald font-normal mb-1 sm:mb-2">
              Bem-vindo{nomeCliente ? `, ${nomeCliente}` : ""}!
            </h1>
            <p className="text-white/80 text-sm sm:text-lg">
              É um prazer ter você conosco
            </p>
          </div>

          <CardContent className="p-4 sm:p-8">
            {/* Mensagem de boas-vindas */}
            <div className="text-center mb-5 sm:mb-8">
              <p className="text-gray-600 text-sm sm:text-lg leading-relaxed">
                O <strong className="text-nucleo-arquitetura">Grupo WG Almeida</strong> agradece
                a sua confiança. Estamos animados para transformar seu sonho em realidade!
              </p>
            </div>

            {/* Núcleos Contratados */}
            {nucleosContratados.length > 0 && (
              <div className="mb-5 sm:mb-8">
                <h3 className="text-sm font-normal text-gray-500 uppercase mb-3 sm:mb-4 text-center">
                  Serviços contratados
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {nucleosContratados.map((nucleo) => {
                    const info = NUCLEOS_INFO[nucleo as keyof typeof NUCLEOS_INFO];
                    if (!info) return null;
                    const Icon = info.icon;

                    return (
                      <div
                        key={nucleo}
                        className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 rounded-xl w-[calc(33%-0.5rem)] min-w-[90px] max-w-[160px]"
                      >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${info.cor} rounded-full flex items-center justify-center mb-2`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="font-normal text-gray-700 text-sm">{info.titulo}</span>
                        <span className="text-xs text-gray-500 text-center mt-1 hidden sm:block">
                          {info.descricao}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* O que você encontrará */}
            <div className="bg-nucleo-arquitetura/5 rounded-xl p-4 sm:p-6 mb-5 sm:mb-8">
              <h3 className="font-normal text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-nucleo-arquitetura flex-shrink-0" />
                Neste portal você pode:
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {ETAPAS_BOAS_VINDAS.map((etapa) => {
                  const Icon = etapa.icone;
                  return (
                    <li key={etapa.id} className="flex items-start gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-nucleo-arquitetura/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-nucleo-arquitetura" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 text-sm">{etapa.titulo}</span>
                        <p className="text-xs sm:text-sm text-gray-500">{etapa.descricao}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* BotÍo de açÍo */}
            <Button
              onClick={() => setEtapaAtual(1)}
              className="w-full bg-nucleo-arquitetura hover:bg-nucleo-arquitetura/90 text-white py-4 sm:py-6 text-base sm:text-lg font-normal"
            >
              Conhecer meu Portal
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Contato */}
            <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t text-center">
              <p className="text-sm text-gray-500 mb-3">Precisa de ajuda?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
                <a
                  href="tel:+5511999999999"
                  className="flex items-center gap-2 text-nucleo-arquitetura hover:underline text-sm"
                >
                  <Phone className="w-4 h-4" />
                  (11) 99999-9999
                </a>
                <a
                  href="mailto:contato@wgalmeida.com.br"
                  className="flex items-center gap-2 text-nucleo-arquitetura hover:underline text-sm"
                >
                  <Mail className="w-4 h-4" />
                  contato@wgalmeida.com.br
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tour pelas funcionalidades
  if (mostrarBemVindo && etapaAtual > 0) {
    const etapa = ETAPAS_BOAS_VINDAS[etapaAtual - 1];
    const Icon = etapa.icone;

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
        <Card className="max-w-lg w-full overflow-hidden shadow-xl">
          {/* Indicador de progresso */}
          <div className="bg-gray-100 p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-gray-500">
                Etapa {etapaAtual} de {ETAPAS_BOAS_VINDAS.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMostrarBemVindo(false);
                  onIniciar?.();
                }}
                className="text-gray-400 hover:text-gray-600 text-xs sm:text-sm h-7 sm:h-9"
              >
                Pular tour
              </Button>
            </div>
            <div className="flex gap-1">
              {ETAPAS_BOAS_VINDAS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx < etapaAtual ? "bg-nucleo-arquitetura" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <CardContent className="p-5 sm:p-8 text-center">
            {/* Ícone da etapa */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-nucleo-arquitetura/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Icon className="w-7 h-7 sm:w-10 sm:h-10 text-nucleo-arquitetura" />
            </div>

            {/* Conteúdo */}
            <h2 className="text-xl sm:text-2xl font-normal text-gray-800 mb-3 sm:mb-4">
              {etapa.titulo}
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-lg">
              {etapa.descricao}
            </p>

            {/* Botões de navegaçÍo */}
            <div className="flex gap-3 sm:gap-4">
              {etapaAtual > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setEtapaAtual(etapaAtual - 1)}
                  className="flex-1 text-sm"
                >
                  Voltar
                </Button>
              )}
              <Button
                onClick={avancarEtapa}
                className="flex-1 bg-nucleo-arquitetura hover:bg-nucleo-arquitetura/90 text-white text-sm"
              >
                {etapaAtual === ETAPAS_BOAS_VINDAS.length ? (
                  <>
                    Começar
                    <Sparkles className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Card resumido após completar onboarding
  return (
    <Card className="bg-gradient-to-r from-nucleo-arquitetura to-nucleo-arquitetura/90 text-white">
      <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-normal text-base sm:text-lg">
                Olá{nomeCliente ? `, ${nomeCliente}` : ""}!
              </h3>
              <p className="text-white/80 text-xs sm:text-sm">
                Acompanhe seu projeto aqui no portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {nucleosContratados.map((nucleo) => {
              const info = NUCLEOS_INFO[nucleo as keyof typeof NUCLEOS_INFO];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <div
                  key={nucleo}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center"
                  title={info.titulo}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


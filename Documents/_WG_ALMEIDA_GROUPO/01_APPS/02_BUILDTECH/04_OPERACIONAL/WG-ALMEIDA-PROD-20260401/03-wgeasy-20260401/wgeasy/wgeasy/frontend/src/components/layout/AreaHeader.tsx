import React from "react";
/**
 * AreaHeader - Header/Banner unificado para áreas de acesso
 * Exibe: Avatar, SaudaçÍo, Nome, Data e "Com a WG desde..."
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSaudacao, formatarDataAtual, formatarDataInicioWG } from "@/hooks/useSaudacao";
import { cn } from "@/lib/utils";

interface AreaHeaderProps {
  usuario: {
    nome: string;
    avatar_url?: string | null;
    data_inicio_wg?: string | null;
    cargo?: string | null;
    empresa?: string | null;
  };
  titulo?: string;
  subtitulo?: string;
  className?: string;
  children?: React.ReactNode;
}

const WG_COLORS = {
  laranja: "#F25C26",
  laranjaClaro: "#FEF3EE",
};

function getInitials(nome?: string): string {
  if (!nome) return "U";
  return nome
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AreaHeader({
  usuario,
  titulo,
  subtitulo,
  className,
  children,
}: AreaHeaderProps) {
  const saudacao = useSaudacao();
  const dataAtual = formatarDataAtual();
  const dataInicioFormatada = formatarDataInicioWG(usuario.data_inicio_wg);

  const primeiroNome = usuario.nome?.split(" ")[0] || "Usuário";

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-white to-orange-50 border-b border-orange-100",
        "px-4 sm:px-6 py-4 sm:py-5",
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Lado esquerdo - Avatar e informações */}
          <div className="flex items-center gap-4">
            {/* Avatar com borda laranja */}
            <div className="relative">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-offset-2 ring-[#F25C26]">
                <AvatarImage
                  src={usuario.avatar_url || undefined}
                  alt={usuario.nome}
                />
                <AvatarFallback
                  className="text-lg font-normal text-white"
                  style={{ backgroundColor: WG_COLORS.laranja }}
                >
                  {getInitials(usuario.nome)}
                </AvatarFallback>
              </Avatar>
              {/* Indicador online */}
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
            </div>

            {/* Informações do usuário */}
            <div className="flex flex-col">
              {/* SaudaçÍo + Nome */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-medium text-gray-600">
                  {saudacao},
                </span>
                <span
                  className="text-lg sm:text-xl font-normal"
                  style={{ color: WG_COLORS.laranja }}
                >
                  {primeiroNome}!
                </span>
              </div>

              {/* Data atual */}
              <p className="text-sm text-gray-500 capitalize">{dataAtual}</p>

              {/* Com a WG desde... */}
              {dataInicioFormatada && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Com a WG desde{" "}
                  <span className="font-medium text-gray-500">
                    {dataInicioFormatada}
                  </span>
                </p>
              )}

              {/* Cargo/Empresa (opcional) */}
              {(usuario.cargo || usuario.empresa) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {usuario.cargo}
                  {usuario.cargo && usuario.empresa && " • "}
                  {usuario.empresa}
                </p>
              )}
            </div>
          </div>

          {/* Lado direito - Título ou ações */}
          <div className="flex flex-col items-start sm:items-end gap-1">
            {titulo && (
              <h1 className="text-lg sm:text-xl font-normal text-gray-800">
                {titulo}
              </h1>
            )}
            {subtitulo && (
              <p className="text-sm text-gray-500">{subtitulo}</p>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * VersÍo compacta do header para mobile ou espaços menores
 */
export function AreaHeaderCompact({
  usuario,
  className,
}: Pick<AreaHeaderProps, "usuario" | "className">) {
  const saudacao = useSaudacao();
  const primeiroNome = usuario.nome?.split(" ")[0] || "Usuário";

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-white to-orange-50 border-b border-orange-100",
        "px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-offset-1 ring-[#F25C26]">
          <AvatarImage
            src={usuario.avatar_url || undefined}
            alt={usuario.nome}
          />
          <AvatarFallback
            className="text-sm font-normal text-white"
            style={{ backgroundColor: WG_COLORS.laranja }}
          >
            {getInitials(usuario.nome)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-medium text-gray-600">
              {saudacao},
            </span>
            <span
              className="text-sm font-normal"
              style={{ color: WG_COLORS.laranja }}
            >
              {primeiroNome}!
            </span>
          </div>
          {usuario.data_inicio_wg && (
            <p className="text-xs text-gray-400">
              Com a WG desde {formatarDataInicioWG(usuario.data_inicio_wg)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


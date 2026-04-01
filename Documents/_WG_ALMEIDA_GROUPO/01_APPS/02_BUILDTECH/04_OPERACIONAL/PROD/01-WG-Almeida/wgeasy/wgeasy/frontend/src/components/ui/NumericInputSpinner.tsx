// ============================================================
// NumericInputSpinner - Input numérico com controles +/-
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
//
// Exibe controles de incremento/decremento ao passar o mouse
// Ideal para campos de medidas (mm, cm, m)
// ============================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, Plus, Minus } from "lucide-react";

interface NumericInputSpinnerProps {
  value: number | string | null | undefined;
  onChange: (value: string) => void;
  step?: number; // PadrÍo: 0.01 (1cm)
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  className?: string;
  inputClassName?: string;
  compact?: boolean; // Modo compacto para espaços pequenos
  showLabel?: boolean;
  disabled?: boolean;
  precision?: number; // Casas decimais (padrÍo: 2)
}

export default function NumericInputSpinner({
  value,
  onChange,
  step = 0.01,
  min = 0,
  max = 9999,
  label,
  unit,
  className = "",
  inputClassName = "",
  compact = false,
  showLabel = true,
  disabled = false,
  precision = 2,
}: NumericInputSpinnerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Converter valor para número
  const numericValue = typeof value === "string"
    ? parseFloat(value) || 0
    : (value ?? 0);

  // Limpar intervalos ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Incrementar valor
  const increment = useCallback(() => {
    const newValue = Math.min(numericValue + step, max);
    onChange(newValue.toFixed(precision));
  }, [numericValue, step, max, precision, onChange]);

  // Decrementar valor
  const decrement = useCallback(() => {
    const newValue = Math.max(numericValue - step, min);
    onChange(newValue.toFixed(precision));
  }, [numericValue, step, min, precision, onChange]);

  // Iniciar incremento contínuo ao segurar o botÍo
  const startContinuous = useCallback((action: "increment" | "decrement") => {
    const fn = action === "increment" ? increment : decrement;
    fn(); // Executar imediatamente

    // Após 500ms, começar a repetir rapidamente
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(fn, 80);
    }, 400);
  }, [increment, decrement]);

  // Parar incremento contínuo
  const stopContinuous = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showControls = (isHovered || isFocused) && !disabled;

  // Modo compacto (botões menores, inline)
  if (compact) {
    return (
      <div
        className={`relative group ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showLabel && label && (
          <span className="text-[10px] text-gray-500 block">{label}</span>
        )}

        <div className="relative flex items-center">
          {/* BotÍo Decrementar */}
          <button
            type="button"
            onMouseDown={() => startContinuous("decrement")}
            onMouseUp={stopContinuous}
            onMouseLeave={stopContinuous}
            onTouchStart={() => startContinuous("decrement")}
            onTouchEnd={stopContinuous}
            disabled={disabled || numericValue <= min}
            className={`absolute left-0 z-10 w-5 h-full flex items-center justify-center
              bg-gradient-to-r from-gray-100 to-transparent
              text-gray-500 hover:text-[#F25C26] hover:from-orange-50
              transition-all duration-200 rounded-l
              ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}
              disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Input */}
          <input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`w-full text-center text-xs font-normal text-gray-900
              border-0 bg-transparent focus:outline-none
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              ${showControls ? "px-5" : "px-1"}
              ${inputClassName}`}
          />

          {/* BotÍo Incrementar */}
          <button
            type="button"
            onMouseDown={() => startContinuous("increment")}
            onMouseUp={stopContinuous}
            onMouseLeave={stopContinuous}
            onTouchStart={() => startContinuous("increment")}
            onTouchEnd={stopContinuous}
            disabled={disabled || numericValue >= max}
            className={`absolute right-0 z-10 w-5 h-full flex items-center justify-center
              bg-gradient-to-l from-gray-100 to-transparent
              text-gray-500 hover:text-[#F25C26] hover:from-orange-50
              transition-all duration-200 rounded-r
              ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}
              disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {unit && (
          <span className="text-[9px] text-gray-400 block text-center">{unit}</span>
        )}
      </div>
    );
  }

  // Modo normal (botões verticais)
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showLabel && label && (
        <label className="text-[10px] text-gray-500 block mb-0.5">{label}</label>
      )}

      <div className="relative flex items-center">
        {/* Input */}
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`w-full text-center text-xs font-normal text-gray-900
            border border-gray-200 rounded-lg bg-white
            focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26]
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            py-1.5 ${showControls ? "pr-6" : "pr-2"} pl-2
            ${inputClassName}`}
        />

        {/* Controles verticais */}
        <div
          className={`absolute right-0.5 top-0.5 bottom-0.5 flex flex-col w-5
            transition-all duration-200
            ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <button
            type="button"
            onMouseDown={() => startContinuous("increment")}
            onMouseUp={stopContinuous}
            onMouseLeave={stopContinuous}
            onTouchStart={() => startContinuous("increment")}
            onTouchEnd={stopContinuous}
            disabled={disabled || numericValue >= max}
            className="flex-1 flex items-center justify-center rounded-t
              bg-gray-50 hover:bg-primary hover:text-white
              text-gray-500 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onMouseDown={() => startContinuous("decrement")}
            onMouseUp={stopContinuous}
            onMouseLeave={stopContinuous}
            onTouchStart={() => startContinuous("decrement")}
            onTouchEnd={stopContinuous}
            disabled={disabled || numericValue <= min}
            className="flex-1 flex items-center justify-center rounded-b
              bg-gray-50 hover:bg-primary hover:text-white
              text-gray-500 transition-colors border-t border-gray-200
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Unidade */}
        {unit && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}


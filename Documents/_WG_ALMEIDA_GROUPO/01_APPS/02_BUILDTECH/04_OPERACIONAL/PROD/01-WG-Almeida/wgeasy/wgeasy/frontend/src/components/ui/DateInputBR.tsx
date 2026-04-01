import React, { useState, useEffect, useRef } from "react";

interface DateInputBRProps {
  value: string; // Formato ISO: yyyy-mm-dd
  onChange: (value: string) => void;
  onBlur?: () => void; // Callback externo para blur
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
  required?: boolean;
  autoFocus?: boolean;
}

/**
 * Input de data no padrÍo brasileiro (dd/mm/yyyy)
 * Aceita e retorna valores no formato ISO (yyyy-mm-dd)
 */
export function DateInputBR({
  value,
  onChange,
  onBlur: externalOnBlur,
  placeholder = "dd/mm/aaaa",
  className = "",
  disabled = false,
  title,
  required = false,
  autoFocus = false,
}: DateInputBRProps) {
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Converte ISO para formato brasileiro
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-");
      if (year && month && day) {
        setDisplayValue(`${day}/${month}/${year}`);
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  // Aplica máscara de data
  const applyMask = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, "");

    // Aplica a máscara dd/mm/yyyy
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Converte formato brasileiro para ISO
  const toISO = (brDate: string): string => {
    const parts = brDate.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      const [day, month, year] = parts;
      // Valida a data
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value);
    setDisplayValue(masked);

    // Se tiver data completa, converte para ISO e notifica
    if (masked.length === 10) {
      const isoDate = toISO(masked);
      if (isoDate) {
        onChange(isoDate);
      }
    } else if (masked === "") {
      onChange("");
    }
  };

  const handleBlur = () => {
    // Se a data estiver incompleta, limpa
    if (displayValue && displayValue.length < 10) {
      setDisplayValue("");
      onChange("");
    }
    // Chama callback externo se existir
    if (externalOnBlur) {
      externalOnBlur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      title={title}
      required={required}
      maxLength={10}
      autoFocus={autoFocus}
    />
  );
}

// Re-exporta funções utilitárias do formatadores para conveniência
export { formatarData as formatDateBR, getTodayISO } from "@/utils/formatadores";



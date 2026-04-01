// Componente de input de telefone com seleçÍo de país
// Usa react-phone-number-input para suporte a números internacionais

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import React, { forwardRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Converte telefone em formato brasileiro para E.164
 * Ex: "(11) 98508-3904" -> "+5511985083904"
 * Ex: "11985083904" -> "+5511985083904"
 * Ex: "+5511985083904" -> "+5511985083904" (já está no formato correto)
 */
function parseToE164(phone: string | undefined): string | undefined {
  if (!phone) return undefined;

  // Se já está em formato E.164, retornar como está
  if (phone.startsWith('+')) {
    return phone;
  }

  // Remover todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '');

  if (!digits) return undefined;

  // Se tem 10-11 dígitos, assumir que é número brasileiro sem código de país
  if (digits.length >= 10 && digits.length <= 11) {
    return `+55${digits}`;
  }

  // Se tem mais de 11 dígitos, pode já ter o código do país
  if (digits.length > 11) {
    return `+${digits}`;
  }

  // Número muito curto, retornar undefined
  return undefined;
}

export type PhoneInputInternacionalProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  defaultCountry?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
};

const PhoneInputInternacional = forwardRef<HTMLInputElement, PhoneInputInternacionalProps>(
  (
    {
      value,
      onChange,
      placeholder = "Telefone",
      className,
      defaultCountry = "BR", // Brasil como padrÍo
      disabled = false,
      required = false,
      id,
      name,
    },
    ref
  ) => {
    // Converter valor recebido para formato E.164
    const normalizedValue = useMemo(() => parseToE164(value), [value]);

    // Handler para onChange que garante compatibilidade
    const handleChange = useCallback((newValue: string | undefined) => {
      onChange(newValue);
    }, [onChange]);

    // Criar ref seguro que não falha se for null
    const safeRef = useCallback((node: HTMLInputElement | null) => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      }
    }, [ref]);

    return (
      <PhoneInput
        international // Sempre mostrar seletor de país
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry as any}
        value={normalizedValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        focusInputOnCountrySelection={false}
        className={cn(
          "phone-input-internacional",
          className
        )}
        numberInputProps={{
          className: cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-normal",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          ),
          id,
          name,
          required,
          ref: safeRef,
        }}
      />
    );
  }
);

PhoneInputInternacional.displayName = "PhoneInputInternacional";

export { PhoneInputInternacional };



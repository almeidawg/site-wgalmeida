import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

/**
 * Wizard Step Definition
 */
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  validate?: (data: Record<string, unknown>) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "email"
    | "date"
    | "select"
    | "textarea"
    | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  help?: string;
  validation?: (value: unknown) => boolean | string;
  rows?: number; // para textarea
}

interface FormWizardProps {
  steps: WizardStep[];
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Componente FormWizard para formulários longos em mobile
 * Quebra o formulário em múltiplos passos
 *
 * @example
 * <FormWizard
 *   steps={[
 *     {
 *       id: 'step1',
 *       title: 'Cliente',
 *       fields: [{ name: 'cliente_id', label: 'Cliente', type: 'select' }]
 *     },
 *     {
 *       id: 'step2',
 *       title: 'Valores',
 *       fields: [{ name: 'valor', label: 'Valor', type: 'number' }]
 *     }
 *   ]}
 *   onSubmit={async (data) => { await salvar(data); }}
 * />
 */
export function FormWizard({
  steps,
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: FormWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    currentStep.fields.forEach((field) => {
      const value = data[field.name];

      // ValidaçÍo obrigatória
      if (field.required && !value) {
        newErrors[field.name] = `${field.label} é obrigatório`;
        return;
      }

      // ValidaçÍo customizada
      if (field.validation && value) {
        const result = field.validation(value);
        if (result !== true) {
          newErrors[field.name] = result as string;
        }
      }
    });

    // ValidaçÍo do passo
    if (currentStep.validate) {
      const stepValidation = currentStep.validate(data);
      if (stepValidation !== true) {
        setErrors({
          ...newErrors,
          _step: stepValidation as string,
        });
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setCurrentStepIndex((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    setErrors({});
    setCurrentStepIndex((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFieldChange = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro ao alterar
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setErrors((prev) => ({
        ...prev,
        _submit: "Erro ao salvar. Tente novamente.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
          <div
            className="bg-orange-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>
            Passo {currentStepIndex + 1} de {steps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Step header */}
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-normal text-gray-900">
          {currentStep.title}
        </h2>
        {currentStep.description && (
          <p className="text-sm md:text-base text-gray-600">
            {currentStep.description}
          </p>
        )}
      </div>

      {/* Step errors */}
      {errors._step && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors._step}</p>
        </div>
      )}

      {errors._submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors._submit}</p>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-5">
        {currentStep.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === "select" ? (
              <select
                value={
                  typeof data[field.name] === "string" || typeof data[field.name] === "number"
                    ? (data[field.name] as string | number)
                    : ""
                }
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className={`
                  w-full px-4 py-3 border rounded-lg text-base
                  focus:outline-none focus:ring-2 focus:ring-orange-500
                  transition-colors
                  min-h-[48px] md:min-h-auto
                  ${
                    errors[field.name]
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white"
                  }
                `}
              >
                <option value="">{field.placeholder || "Selecionar..."}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                value={
                  typeof data[field.name] === "string" || typeof data[field.name] === "number"
                    ? String(data[field.name])
                    : ""
                }
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows || 4}
                className={`
                  w-full px-4 py-3 border rounded-lg text-base
                  focus:outline-none focus:ring-2 focus:ring-orange-500
                  transition-colors
                  ${
                    errors[field.name]
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white"
                  }
                `}
              />
            ) : field.type === "checkbox" ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(data[field.name])}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.checked)
                  }
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="text-base text-gray-700">{field.label}</span>
              </label>
            ) : (
              <input
                type={field.type}
                value={
                  typeof data[field.name] === "string" || typeof data[field.name] === "number"
                    ? (data[field.name] as string | number)
                    : ""
                }
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`
                  w-full px-4 py-3 border rounded-lg text-base
                  focus:outline-none focus:ring-2 focus:ring-orange-500
                  transition-colors
                  min-h-[48px] md:min-h-auto
                  ${
                    errors[field.name]
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white"
                  }
                `}
              />
            )}

            {errors[field.name] && (
              <p className="text-sm text-red-600">{errors[field.name]}</p>
            )}

            {field.help && !errors[field.name] && (
              <p className="text-xs text-gray-500">{field.help}</p>
            )}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4">
        {!isFirstStep && (
          <button
            onClick={handlePrevious}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] md:min-h-auto"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        )}

        <button
          onClick={isLastStep ? handleSubmit : handleNext}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] md:min-h-auto"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Salvando...</span>
            </>
          ) : isLastStep ? (
            <>
              <Check size={20} />
              {submitLabel}
            </>
          ) : (
            <>
              <span>Próximo</span>
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full px-4 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}


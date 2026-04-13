import React, { useState } from 'react';

/**
 * Componente de Input com Máscaras (CPF, Data, Telefone, Moeda)
 * Baseado na lógica testada no Onboarding.
 */
const MaskedInput = ({ 
  label, 
  type = 'text', 
  placeholder, 
  maskType, 
  value, 
  onChange, 
  required, 
  forceShowError = false,
  suffix,
  className = "",
  ...props 
}) => {
  const [touched, setTouched] = useState(false);

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '';
    // Se for número, trata como valor real (não centavos de string)
    let numStr = typeof val === 'number' ? (val * 100).toFixed(0) : String(val).replace(/\D/g, '');
    if (!numStr) return '';
    const floatVal = parseInt(numStr, 10) / 100;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    }).format(floatVal);
  };

  const parseCurrency = (val) => {
    const digits = String(val ?? "").replace(/\D/g, "");
    return digits ? Number(digits) / 100 : 0;
  };

  const handleChange = (e) => {
    let val = e.target.value;
    let rawValue = val;

    if (maskType === 'cpf') {
      val = val.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
      rawValue = val.replace(/\D/g, '');
    } else if (maskType === 'date') {
      val = val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\/\d{4})\d+?$/, '$1');
      rawValue = val;
    } else if (maskType === 'phone') {
      val = val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
      rawValue = val.replace(/\D/g, '');
    } else if (maskType === 'currency') {
      rawValue = parseCurrency(val);
      val = formatCurrency(rawValue);
    }

    if (onChange) {
      // Simula o evento para manter compatibilidade com handlers existentes
      const simulatedEvent = {
        ...e,
        target: {
          ...e.target,
          name: props.name,
          value: rawValue,
          formattedValue: val
        }
      };
      onChange(simulatedEvent);
    }
  };

  const handleBlur = (e) => {
    setTouched(true);
    if (maskType === 'name' && e.target.value) {
      const formatted = e.target.value.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
      if (onChange) {
        onChange({
          ...e,
          target: { ...e.target, value: formatted }
        });
      }
    }
    if (props.onBlur) props.onBlur(e);
  };

  const displayValue = maskType === 'currency' ? formatCurrency(value) : (value ?? '');

  return (
    <div className={`flex w-full flex-col gap-1.5 relative font-['Inter'] ${className}`}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          {label}{required ? ' *' : ''}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={maskType === 'currency' ? 'text' : type}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full rounded-sm border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-secondary)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default MaskedInput;

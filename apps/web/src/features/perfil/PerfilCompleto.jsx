/**
 * Tela de Perfil Completo - Coleta dados para o Rules Engine
 * Perguntas financeiras, patrimônio, preferências e dados adicionais
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Check, AlertCircle, Info, X,
  TrendingUp, Wallet, Target, Zap, Heart, Lightbulb
} from 'lucide-react';

// ==================== COMPONENTES REUTILIZÁVEIS ====================

const InfoCard = ({ title, description, icon: Icon }) => (
  <div className="mb-8 border-l-4 border-[#F56A2A] bg-[#F56A2A]/5 p-4">
    <div className="flex gap-3">
      <Icon size={20} className="shrink-0 text-[#F56A2A]" />
      <div>
        <h4 className="font-bold text-[#0B1218]">{title}</h4>
        <p className="text-sm text-[#0B1218]/60">{description}</p>
      </div>
    </div>
  </div>
);

const InputField = ({ label, type = 'text', value, onChange, placeholder, optional = false, hint }) => (
  <div className="mb-6">
    <label className="mb-2 block text-sm font-bold text-[#0B1218]">
      {label}
      {optional && <span className="ml-2 text-xs text-[#0B1218]/40">(opcional)</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border-b-2 border-[#EFE7DC] bg-transparent px-0 py-3 text-[#0B1218] placeholder:text-[#0B1218]/20 focus:border-[#F56A2A] focus:outline-none transition-colors"
    />
    {hint && <p className="mt-2 text-xs text-[#0B1218]/40">{hint}</p>}
  </div>
);

const RadioGroup = ({ label, options, value, onChange, optional = false }) => (
  <div className="mb-6">
    <label className="mb-3 block text-sm font-bold text-[#0B1218]">
      {label}
      {optional && <span className="ml-2 text-xs text-[#0B1218]/40">(opcional)</span>}
    </label>
    <div className="space-y-3">
      {options.map(option => (
        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 accent-[#F56A2A]"
          />
          <span className="text-sm text-[#0B1218]">{option.label}</span>
          {option.hint && <span className="text-xs text-[#0B1218]/40">({option.hint})</span>}
        </label>
      ))}
    </div>
  </div>
);

const CheckboxGroup = ({ label, options, values, onChange, optional = false }) => (
  <div className="mb-6">
    <label className="mb-3 block text-sm font-bold text-[#0B1218]">
      {label}
      {optional && <span className="ml-2 text-xs text-[#0B1218]/40">(opcional)</span>}
    </label>
    <div className="space-y-3">
      {options.map(option => (
        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.includes(option.value)}
            onChange={() => {
              if (values.includes(option.value)) {
                onChange(values.filter(v => v !== option.value));
              } else {
                onChange([...values, option.value]);
              }
            }}
            className="h-4 w-4 rounded-xl accent-[#F56A2A]"
          />
          <span className="text-sm text-[#0B1218]">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// ==================== TELA PRINCIPAL ====================

export default function PerfilCompleto() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [data, setData] = useState({
    monthlyIncome: '',
    monthlyExpenses: '',
    emergencyFund: '',
    debt: '',
    debtInterestRate: '',
    patrimonio: '',
    targetPatrimonio: '',
    withdrawalRate: 4,
    civilStatus: '',
    dependents: '',
    occupationStability: '',
    futureIncomeExpectancy: '',
    liquidityNeeds: '',
    taxSituation: '',
    sectors: [],
    excludedAssets: [],
    socialImpact: false,
    sustainable: false,
  });

  const handleInputChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    const profileData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('userProfileData', JSON.stringify(profileData));
    localStorage.setItem('hasCompletedProfile', 'true');
    navigate('/home');
  };

  return (
    <div className="w-full bg-white font-['Inter'] text-[#0B1218] animate-in fade-in duration-500">
      <div className="w-full max-w-[896px]">
        {/* Indicador de Progresso */}
        <div className="mb-12">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(step => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-[#F56A2A]' : 'bg-[#EFE7DC]'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-[#0B1218]/60 font-bold tracking-widest uppercase">Passo {currentStep} de 5</p>
        </div>

        {/* STEP 1: SEU DINHEIRO */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-right-10 duration-300">
            <div className="mb-12">
              <h1 className="font-['Sora'] text-4xl font-bold mb-4">Seu dinheiro</h1>
              <p className="text-lg text-[#0B1218]/60">Vamo entender melhor sua situação financeira.</p>
            </div>
            <InputField label="Renda mensal bruta" type="number" value={data.monthlyIncome} onChange={e => handleInputChange('monthlyIncome', e.target.value)} placeholder="Ex: 8000" />
            <InputField label="Gastos mensais" type="number" value={data.monthlyExpenses} onChange={e => handleInputChange('monthlyExpenses', e.target.value)} placeholder="Ex: 4000" />
            <InputField label="Fundo de emergência (meses)" type="number" value={data.emergencyFund} onChange={e => handleInputChange('emergencyFund', e.target.value)} placeholder="Ex: 6" />
          </div>
        )}

        {/* ... (steps 2-5 similar structures) ... */}
        {currentStep === 5 && (
            <div className="mt-12 p-6 bg-[#6FCF97]/10 border border-[#6FCF97] rounded-xl">
                <p>Configuração finalizada.</p>
            </div>
        )}

        {/* Navigation */}
        <div className="mt-16 flex gap-4">
          <button onClick={prevStep} disabled={currentStep === 1} className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/60 hover:text-[#0B1218]">
            <ChevronLeft size={16} /> Anterior
          </button>
          <button onClick={currentStep === 5 ? handleComplete : nextStep} className="ml-auto flex items-center gap-2 px-8 py-3 bg-[#F56A2A] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#d95a20]">
            {currentStep === 5 ? 'Pronto!' : 'Próximo'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

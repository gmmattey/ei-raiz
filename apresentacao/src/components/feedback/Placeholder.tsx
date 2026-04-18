import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

interface PlaceholderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title, description, actions }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pageTitle = title || searchParams.get('title') || 'Página em construção';
  const pageDescription =
    description ||
    searchParams.get('description') ||
    'Esta tela está em desenvolvimento e será conectada em breve. A navegação geral continua funcional.';

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full items-center justify-center bg-[var(--bg-primary)] p-6 text-center">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-12 shadow-xl">
        <Construction size={64} className="mb-6 self-center text-[#F56A2A] animate-pulse" />
        <h1 className="font-['Sora'] text-3xl font-bold text-[var(--text-primary)] mb-4">{pageTitle}</h1>
        <p className="font-['Inter'] text-[var(--text-secondary)] mb-8 leading-relaxed">{pageDescription}</p>
        {actions ? (
          actions
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 self-center rounded-xl bg-[var(--text-primary)] px-6 py-3 font-semibold text-[var(--bg-primary)] transition-all hover:opacity-90"
          >
            <ArrowLeft size={18} /> Voltar para a base
          </button>
        )}
      </div>
    </div>
  );
};

export default Placeholder;

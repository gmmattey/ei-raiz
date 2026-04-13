import React, { useEffect, useMemo, useState } from 'react';
import { 
  Settings, User, Lock, Bell, 
  Shield, Database, LogOut, ChevronRight,
  Smartphone, Globe
} from 'lucide-react';
import { ApiError, authApi, clearSession, getStoredUser } from '../../cliente-api';
import { useNavigate } from 'react-router-dom';

// --- Componentes Base ---

const ConfigItem = ({ icon, title, description, action }) => (
  <div className="flex items-center justify-between p-6 border-b border-[#EFE7DC]/50 hover:bg-[#FAFAFA] transition-all group cursor-pointer" onClick={action}>
    <div className="flex items-center gap-6">
      <div className="text-[#0B1218]/20 group-hover:text-[#F56A2A] transition-colors">
        {icon}
      </div>
      <div>
        <h4 className="font-['Sora'] text-sm font-bold text-[#0B1218]">{title}</h4>
        <p className="text-[10px] text-[#0B1218]/40 font-bold uppercase tracking-tight">{description}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-[#0B1218]/10 group-hover:text-[#0B1218] transition-all" />
  </div>
);

export default function Configuracoes({ embedded = false }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const sessao = await authApi.obterUsuarioAutenticado();
        if (!ativo) return;
        setUsuario(sessao.usuario);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setErro('Falha ao carregar dados da conta.');
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const emailMascarado = useMemo(() => {
    if (!usuario?.email) return 'E-mail indisponível';
    const [local, domain] = usuario.email.split('@');
    if (!local || !domain) return usuario.email;
    const prefix = local.length <= 2 ? `${local[0] ?? ''}*` : `${local.slice(0, 2)}***`;
    return `${prefix}@${domain}`;
  }, [usuario]);

  return (
    <div className={`w-full bg-transparent font-['Inter'] text-[#0B1218] ${embedded ? '' : 'animate-in fade-in duration-500'}`}>
      <div className={`w-full ${embedded ? '' : 'max-w-[896px]'}`}>
        <div className="mb-16">
          <div className="flex items-center gap-3 text-[#F56A2A] mb-4">
            <Settings size={24} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Preferências</span>
          </div>
          <h1 className="font-['Sora'] text-4xl font-bold tracking-tight mb-4">Sua Conta</h1>
          <p className="text-[#0B1218]/40 text-sm font-medium">Gestão de segurança, dados e privacidade.</p>
        </div>

        <div className="space-y-12">
          {erro && <p className="text-xs text-[#E85C5C] px-1">{erro}</p>}
          
          <section>
            <h3 className="font-['Sora'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/30 mb-4 px-6">Identidade</h3>
            <div className="bg-white border border-[#EFE7DC] rounded-sm overflow-hidden">
              <ConfigItem icon={<User size={20} />} title="Dados Pessoais" description={usuario?.nome || 'Nome nao informado'} />
              <ConfigItem icon={<Globe size={20} />} title="E-mail e Comunicação" description={emailMascarado} />
              <ConfigItem icon={<Smartphone size={20} />} title="Dispositivos Conectados" description="2 aparelhos ativos" />
            </div>
          </section>

          <section>
            <h3 className="font-['Sora'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/30 mb-4 px-6">Segurança</h3>
            <div className="bg-white border border-[#EFE7DC] rounded-sm overflow-hidden">
              <ConfigItem icon={<Lock size={20} />} title="Senha Eletrônica" description="Alterar sua senha de 6 dígitos" />
              <ConfigItem icon={<Shield size={20} />} title="Autenticação em Duas Etapas" description="Ativado via SMS/E-mail" />
            </div>
          </section>

          <section>
            <h3 className="font-['Sora'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/30 mb-4 px-6">Privacidade e Dados</h3>
            <div className="bg-white border border-[#EFE7DC] rounded-sm overflow-hidden">
              <ConfigItem icon={<Database size={20} />} title="Gestão de Dados (LGPD)" description="Exportar ou excluir seus dados" />
              <ConfigItem icon={<Bell size={20} />} title="Alertas de Carteira" description="Configurar notificações de risco" />
            </div>
          </section>

          <div className="pt-8 border-t border-[#EFE7DC]">
            <button 
              onClick={() => {
                clearSession();
                navigate('/', { replace: true });
              }}
              className="w-full flex items-center justify-center gap-3 p-6 text-[10px] font-bold uppercase tracking-widest text-[#E85C5C] hover:bg-[#E85C5C]/5 transition-all border border-dashed border-[#E85C5C]/20"
            >
              <LogOut size={18} /> Encerrar Sessão no Dispositivo
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

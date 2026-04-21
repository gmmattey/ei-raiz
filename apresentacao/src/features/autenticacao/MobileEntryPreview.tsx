import React from 'react';
import { ArrowRight, TrendingUp, ShieldCheck, Activity, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const EsquiloLogo = () => (
  <svg viewBox="0 0 320 100" className="h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 0)">
      <path d="M 25 20 C 10 20 5 40 10 50 C 15 60 25 60 30 50 C 20 70 20 90 35 100 C 25 85 25 65 45 50 C 35 40 35 30 40 25 C 35 20 30 20 25 20 Z" fill="#F56A2A"/>
      <path d="M 45 50 C 55 30 65 20 75 25 C 80 20 90 25 90 35 C 100 50 100 75 85 90 C 70 105 45 100 35 100 C 45 100 55 90 60 80 C 65 70 55 60 45 65 C 50 55 60 50 70 55 C 60 45 50 45 45 50 Z" fill="#F56A2A"/>
      <circle cx="75" cy="50" r="4" fill="#0B1218"/>
      <path d="M 92 60 C 96 60 98 64 96 68 C 94 72 90 70 89 65 Z" fill="#0B1218"/>
    </g>
    <text x="115" y="48" fontFamily="'Sora', sans-serif" fontSize="42" fontWeight="600" fill="#FFFFFF" letterSpacing="-1">Esquilo</text>
    <text x="118" y="88" fontFamily="'Sora', sans-serif" fontSize="42" fontWeight="600" fill="#F56A2A" letterSpacing="-1">invest</text>
  </svg>
);

export default function MobileEntryPreview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] w-full bg-[#0B1218] flex justify-center items-center font-sans text-white overflow-hidden">
      
      {/* MOBILE APP CONTAINER */}
      <div className="w-full max-w-[390px] h-[100dvh] md:h-[844px] md:rounded-[48px] md:my-8 flex flex-col items-center bg-[#0B1218] px-8 py-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 relative overflow-hidden ring-1 ring-white/10">

        {/* EFEITOS DE BACKGROUND - Atmosfera Premium */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top Glow */}
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-gradient-to-b from-[#F56A2A]/15 to-transparent blur-[100px] opacity-40" />
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
          />
          
          {/* Bottom Accent */}
          <div className="absolute bottom-[-5%] right-[-10%] w-[80%] h-[20%] bg-[#F56A2A]/10 blur-[90px] rounded-full" />
        </div>

        {/* HEADER - Logo Centrada */}
        <header className="w-full flex justify-center mt-6 shrink-0 z-20">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <EsquiloLogo />
          </motion.div>
        </header>

        {/* ELEMENTO VISUAL CENTRAL - O "Cérebro" da Carteira */}
        <div className="relative w-full flex-1 flex items-center justify-center z-10">
          
          {/* Anéis de Dados Orbitais */}
          <div className="absolute w-[290px] h-[290px] rounded-full border border-white/[0.04]" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute w-[230px] h-[230px] rounded-full border border-dashed border-[#F56A2A]/20" 
          />

          {/* Widgets Flutuantes (Sensação de App Vivo) */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-2 top-20 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl z-20"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <TrendingUp size={16} className="text-[#10B981]" />
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-2 bottom-24 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl z-20"
          >
            <ShieldCheck size={18} className="text-[#F56A2A]" />
          </motion.div>

          {/* NÚCLEO CENTRAL (Intelligent Core) */}
          <div className="relative">
            {/* Glow Interno */}
            <div className="absolute inset-[-20px] bg-[#F56A2A]/20 blur-[50px] rounded-full opacity-60" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[190px] h-[190px] rounded-full bg-gradient-to-br from-white/[0.12] to-transparent border border-white/20 backdrop-blur-3xl flex items-center justify-center shadow-[0_0_60px_-15px_rgba(245,106,42,0.5)]"
            >
              <svg viewBox="0 0 100 100" className="w-[165px] h-[165px] transform -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="7" />
                <motion.circle 
                  initial={{ strokeDasharray: "0 276" }}
                  animate={{ strokeDasharray: "185 276" }}
                  transition={{ delay: 0.8, duration: 2, ease: "circOut" }}
                  cx="50" cy="50" r="44" fill="none" stroke="#F56A2A" strokeWidth="7" strokeLinecap="round" 
                  className="drop-shadow-[0_0_15px_rgba(245,106,42,0.7)]"
                />
                <motion.circle 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  cx="50" cy="50" r="44" fill="none" stroke="#10B981" strokeWidth="7" strokeDasharray="45 276" strokeDashoffset="-195" strokeLinecap="round" 
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[#0B1218] p-5 rounded-full border border-white/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]">
                  <Activity size={36} className="text-[#F56A2A]" strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* CONTEÚDO DE TEXTO - Chamada Forte */}
        <div className="text-center shrink-0 z-20 w-full mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-[38px] font-bold text-white leading-[0.95] tracking-tight mb-5" 
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Sua carteira,<br/>
            <span className="text-[#F56A2A]">evolutiva.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/50 text-[16px] leading-snug max-w-[260px] mx-auto font-medium"
          >
            Gestão inteligente de patrimônio com leitura de mercado em tempo real.
          </motion.p>
        </div>

        {/* BOTÕES DE AÇÃO - Mobile-First Real */}
        <div className="w-full flex flex-col items-center shrink-0 z-20 gap-4">
          
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="w-full bg-[#F56A2A] text-white font-bold py-5 rounded-2xl transition-all shadow-[0_20px_40px_-12px_rgba(245,106,42,0.45)] text-[18px] flex items-center justify-center gap-2 group"
          >
            Acessar Conta
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <button 
            onClick={() => navigate('/onboarding')}
            className="w-full text-white/70 hover:text-white font-bold py-2 transition-colors text-[16px] tracking-tight"
          >
            Criar conta gratuita
          </button>
          
          <div className="h-[1px] w-16 bg-white/10 my-1" />

          <button 
            onClick={() => navigate('/')}
            className="text-[#F56A2A] hover:text-[#ff8a5c] text-[14px] font-bold transition-colors flex items-center gap-2 group"
          >
            Conhecer o Esquilo Wallet
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* FOOTER - Minimalista */}
        <footer className="w-full text-center shrink-0 z-20 pt-12 pb-2">
          <p className="text-white/20 text-[11px] font-bold uppercase tracking-[0.25em]">
            Termos <span className="mx-3 opacity-40">•</span> Privacidade
          </p>
        </footer>

      </div>
    </div>
  );
}

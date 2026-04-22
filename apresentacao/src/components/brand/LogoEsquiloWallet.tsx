import React from 'react';

interface LogoEsquiloWalletProps {
  variant?: 'dark' | 'light';
  className?: string;
  title?: string;
}

// SVG inline (replica dos arquivos oficiais esquilowallet-*.svg) — renderizado
// dentro do DOM do React para herdar Sora/Inter do Google Fonts do documento.
// Via <img src="...svg"> o iOS Safari/WebKit carrega o SVG em sandbox sem
// acesso às fontes da página e cai pra fallback (sans-serif do sistema).
export const LogoEsquiloWallet: React.FC<LogoEsquiloWalletProps> = ({
  variant = 'dark',
  className,
  title = 'Esquilo Wallet',
}) => {
  const esquiloFill = variant === 'dark' ? '#ffffff' : '#0b1218';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 768.0625 108.52799"
      role="img"
      aria-label={title}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <g transform="translate(-309.36795,-5.8721008)">
        <g transform="translate(305,92)">
          <text
            x="0"
            y="0"
            fontSize="112px"
            style={{ fontWeight: 700, fontFamily: 'Sora, Inter, system-ui, -apple-system, sans-serif', fill: esquiloFill }}
          >
            esquilo
          </text>
          <text
            x="428.82883"
            y="2.0045044"
            fontSize="112px"
            style={{ fontWeight: 300, fontFamily: 'Inter, Sora, system-ui, -apple-system, sans-serif', fill: '#f56a2a' }}
          >
            <tspan style={{ fontWeight: 600, fontFamily: 'Inter, Sora, system-ui, -apple-system, sans-serif' }}>{'\\'}</tspan>
            wallet
          </text>
        </g>
      </g>
    </svg>
  );
};

export default LogoEsquiloWallet;

import React from 'react';

interface LogoEsquiloWalletProps {
  variant?: 'dark' | 'light';
  className?: string;
  title?: string;
}

export const LogoEsquiloWallet: React.FC<LogoEsquiloWalletProps> = ({
  variant = 'dark',
  className,
  title = 'Esquilo Wallet',
}) => {
  const esquiloFill = variant === 'dark' ? '#FFFFFF' : '#0B1218';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720.80884 108.52799"
      role="img"
      aria-label={title}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <g transform="translate(-314.18408,-5.872101)">
        <g transform="translate(305,92)">
          <text
            x="0"
            y="0"
            fontSize="112px"
            style={{ fontWeight: 700, fontFamily: 'Sora, sans-serif', fill: esquiloFill }}
          >
            Esquilo
          </text>
          <text
            x="428.82883"
            y="2.0045044"
            fontSize="112px"
            style={{ fontWeight: 300, fontFamily: 'Inter, sans-serif', fill: '#F56A2A' }}
          >
            wallet
          </text>
        </g>
      </g>
    </svg>
  );
};

export default LogoEsquiloWallet;

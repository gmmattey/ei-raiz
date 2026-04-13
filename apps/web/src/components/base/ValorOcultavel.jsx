import React from 'react';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';

/**
 * Componente que oculta conteúdo sensível quando o Modo Ladrão está ativo.
 */
export const ValorOcultavel = ({ children, className = "", mascara = '••••••••' }) => {
  const { ocultarValores } = useModoVisualizacao();

  if (ocultarValores) {
    return <span className={`select-none ${className}`}>{mascara}</span>;
  }

  return <>{children}</>;
};

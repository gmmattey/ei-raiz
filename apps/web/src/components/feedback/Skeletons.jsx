import React from 'react';

/**
 * Skeleton para MetricCards (Dashboard)
 */
export const MetricCardSkeleton = () => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl">
    <div className="h-2 w-16 skeleton rounded-xl mb-4"></div>
    <div className="h-8 w-24 skeleton rounded-xl"></div>
  </div>
);

/**
 * Skeleton para linhas de Tabela (Carteira/Histórico)
 */
export const TableRowSkeleton = () => (
  <tr className="border-b border-[var(--border-color)]">
    {[1, 2, 3, 4, 5].map((i) => (
      <td key={i} className="py-6 px-4">
        <div className="h-4 w-full skeleton rounded-xl"></div>
      </td>
    ))}
  </tr>
);

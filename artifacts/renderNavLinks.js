function renderNavLinks(state) {
  const tabs = [
    {
      view: 'hoje',
      label: 'Hoje',
      svgContent: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
    },
    {
      view: 'carteira',
      label: 'Carteira',
      svgContent: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>'
    },
    {
      view: 'historico',
      label: 'Histórico',
      svgContent: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
    },
    {
      view: 'importar',
      label: 'Importar',
      svgContent: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
    },
    {
      view: 'bens',
      label: 'Bens',
      svgContent: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="16"/>'
    }
  ];

  const buttons = tabs.map(({ view, label, svgContent }) => {
    const active = state.activeView === view;
    const strokeWidth = active ? 2 : 1.6;
    return `<button class="q-nav-item${active ? ' active' : ''}" onclick="navigate('${view}')">` +
      `<svg class="q-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>` +
      `<span class="q-nav-label">${label}</span>` +
      `</button>`;
  });

  return `<nav class="q-tab-bar">${buttons.join('')}</nav>`;
}

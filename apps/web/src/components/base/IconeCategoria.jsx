export function IconeCategoria({ categoria, size = 20 }) {
  const mapCategoriaToIcon = {
    acao: "acoes",
    fundo: "fundos",
    renda_fixa: "grafico",
    previdencia: "previdencia",
    poupanca: "carteira",
    bens: "carteira",
  };

  const iconName = mapCategoriaToIcon[categoria] || "carteira";

  // Usar caminho estático público
  const iconPath = `/assets/icons/laranja/${iconName}.svg`;

  return (
    <img
      src={iconPath}
      alt={categoria}
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className="inline-block"
    />
  );
}

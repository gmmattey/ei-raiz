export function IconeCategoria({ categoria, size = 20 }) {
  const mapCategoriaToIcon = {
    acao: "acoes",
    fundo: "fundos",
    renda_fixa: "renda-fixa",
    previdencia: "previdencia",
    poupanca: "poupanca",
    bens: "imovel",
  };

  const iconName = mapCategoriaToIcon[categoria] || "carteira";

  // Importar dinamicamente o SVG
  // Usando um caminho relativo que vite consegue processar
  const iconPath = new URL(`../../assets/brand/icons/laranja/${iconName}.svg`, import.meta.url).href;

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

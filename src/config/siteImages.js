export const emptyImageConfig = {
  heroBanner: "",
  historiaCard1: "",
  historiaCard2: "",
  historiaCard3: "",
  blocoExtraImagem: "",
  galeriaImagem1: "",
  galeriaImagem2: "",
  galeriaImagem3: "",
  rodapeBackground: "",
};

export const imageFallbacks = {
  heroBanner: "/foto-casal.jpg",
  historiaCard1: "/historia1.jpg",
  historiaCard2: "/historia2.jpg",
  historiaCard3: "/historia3.jpg",
  blocoExtraImagem: "",
  galeriaImagem1: "",
  galeriaImagem2: "",
  galeriaImagem3: "",
  rodapeBackground: "",
};

export function mergeImageConfig(data) {
  return {
    ...emptyImageConfig,
    ...(data || {}),
  };
}

export function resolveImageSource(...sources) {
  for (const source of sources) {
    if (typeof source === "string" && source.trim()) {
      return source.trim();
    }
  }

  return "";
}

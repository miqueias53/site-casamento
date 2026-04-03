import { imageFallbacks, resolveImageSource } from "../config/siteImages.js";

export default function BlocoExtra({ siteConfig, siteImages }) {
  const safeSiteConfig = siteConfig ?? {};
  const safeSiteImages = siteImages ?? {};
  const imageSrc = resolveImageSource(
    safeSiteImages?.blocoExtraImagem,
    safeSiteConfig?.blocoExtraImagem,
    imageFallbacks?.blocoExtraImagem
  );

  return (
    <section style={styles.section}>
      <div
        className="mx-auto grid max-w-[1180px] gap-7 rounded-[34px] border p-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] md:p-[34px]"
        style={styles.shell}
      >
        <div style={styles.copyWrap}>
          <span style={styles.eyebrow}>{safeSiteConfig?.blocoExtraEyebrow || "Conteúdo especial"}</span>
          <h2
            style={{
              ...styles.title,
              fontFamily: safeSiteConfig?.titulosFontFamily || styles.title.fontFamily,
              fontWeight: safeSiteConfig?.titulosFontWeight || styles.title.fontWeight,
              fontSize: safeSiteConfig?.titulosFontSize || styles.title.fontSize,
            }}
          >
            {safeSiteConfig?.blocoExtraTitulo || "Uma mensagem especial"}
          </h2>
          <p
            className="whitespace-pre-line"
            style={{
              ...styles.copy,
              fontFamily: safeSiteConfig?.textosFontFamily || styles.copy.fontFamily,
              fontWeight: safeSiteConfig?.textosFontWeight || styles.copy.fontWeight,
              fontSize: safeSiteConfig?.textosFontSize || styles.copy.fontSize,
            }}
          >
            {safeSiteConfig?.blocoExtraTexto ||
              "Este bloco adicional pode ser usado para recados, agradecimentos ou qualquer conteúdo pós-casamento."}
          </p>
        </div>

        <div style={styles.imageWrap}>
          {imageSrc ? (
            <img src={imageSrc} alt={safeSiteConfig?.blocoExtraTitulo || "Bloco extra"} loading="lazy" style={styles.image} />
          ) : (
            <div style={styles.placeholder}>Imagem do bloco extra</div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "0 20px",
  },
  shell: {
    alignItems: "center",
    background: "linear-gradient(135deg, rgba(255, 253, 248, 0.98) 0%, rgba(244, 235, 220, 0.92) 100%)",
    border: "1px solid rgba(196, 166, 97, 0.18)",
    boxShadow: "0 26px 60px rgba(36, 27, 47, 0.08)",
  },
  copyWrap: {
    display: "grid",
    gap: 16,
  },
  eyebrow: {
    display: "inline-flex",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(196, 166, 97, 0.14)",
    color: "#8f7a4f",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "34px",
    fontWeight: "600",
    color: "#241b2f",
  },
  copy: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: 1.8,
    color: "#5a4c67",
  },
  imageWrap: {
    overflow: "hidden",
    borderRadius: 28,
    minHeight: 300,
    background: "linear-gradient(135deg, #f4ede3 0%, #efe2cf 100%)",
    border: "1px solid rgba(196, 166, 97, 0.14)",
  },
  image: {
    width: "100%",
    height: "100%",
    minHeight: 300,
    objectFit: "cover",
    objectPosition: "center",
  },
  placeholder: {
    minHeight: 300,
    display: "grid",
    placeItems: "center",
    color: "#8c7a58",
    fontWeight: 700,
    textAlign: "center",
    padding: 24,
  },
};

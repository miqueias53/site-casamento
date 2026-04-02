import { imageFallbacks, resolveImageSource } from "../config/siteImages.js";

export default function GaleriaPosCasamento({ siteConfig, siteImages }) {
  const safeSiteConfig = siteConfig ?? {};
  const safeSiteImages = siteImages ?? {};

  const photos = [
    resolveImageSource(safeSiteImages?.galeriaImagem1, safeSiteConfig?.galeriaImagem1, imageFallbacks?.galeriaImagem1),
    resolveImageSource(safeSiteImages?.galeriaImagem2, safeSiteConfig?.galeriaImagem2, imageFallbacks?.galeriaImagem2),
    resolveImageSource(safeSiteImages?.galeriaImagem3, safeSiteConfig?.galeriaImagem3, imageFallbacks?.galeriaImagem3),
  ].filter(Boolean);

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>{safeSiteConfig?.galeriaPosEyebrow || "Pós-casamento"}</span>
        <h2
          style={{
            ...styles.title,
            fontFamily: safeSiteConfig?.titulosFontFamily || styles.title.fontFamily,
            fontWeight: safeSiteConfig?.titulosFontWeight || styles.title.fontWeight,
            fontSize: safeSiteConfig?.titulosFontSize || styles.title.fontSize,
          }}
        >
          {safeSiteConfig?.galeriaPosTitulo || "Galeria do grande dia"}
        </h2>
        <p
          style={{
            ...styles.copy,
            fontFamily: safeSiteConfig?.textosFontFamily || styles.copy.fontFamily,
            fontWeight: safeSiteConfig?.textosFontWeight || styles.copy.fontWeight,
            fontSize: safeSiteConfig?.textosFontSize || styles.copy.fontSize,
          }}
        >
          {safeSiteConfig?.galeriaPosDescricao ||
            "Um espaço reservado para partilhar os melhores registos depois da celebração."}
        </p>
      </div>

      <div style={styles.grid}>
        {photos.map((photo, index) => (
          <article key={`${photo}-${index}`} style={styles.card}>
            <img src={photo} alt={`Galeria pós-casamento ${index + 1}`} loading="lazy" style={styles.image} />
          </article>
        ))}

        {!photos.length ? (
          <div style={styles.emptyState}>As fotografias pós-casamento serão publicadas aqui.</div>
        ) : null}
      </div>
    </section>
  );
}

const styles = {
  section: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "96px 20px",
  },
  header: {
    maxWidth: 720,
    margin: "0 auto 34px",
    textAlign: "center",
  },
  eyebrow: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(196, 166, 97, 0.12)",
    color: "#8f7a4f",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  title: {
    margin: "16px 0 12px",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
  },
  card: {
    overflow: "hidden",
    borderRadius: 28,
    background: "#fffefb",
    border: "1px solid rgba(196, 166, 97, 0.14)",
    boxShadow: "0 18px 40px rgba(36, 27, 47, 0.08)",
  },
  image: {
    width: "100%",
    height: 280,
    objectFit: "cover",
    objectPosition: "center",
  },
  emptyState: {
    gridColumn: "1 / -1",
    padding: 22,
    borderRadius: 24,
    background: "rgba(255, 253, 248, 0.94)",
    border: "1px solid rgba(196, 166, 97, 0.18)",
    color: "#5a4c67",
    textAlign: "center",
  },
};

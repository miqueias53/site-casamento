import useViewport from "../hooks/useViewport.js";

const defaultLocal = {
  titulo: "Local da Cerimônia",
  data: "11 de julho de 2026",
  hora: "17:00 da tarde",
  nome: "Espaço Recanto Eventos",
  endereco: "Av. Nossa Senhora da Guia, 620\nFloriano - PI",
  mapsLink: "https://www.google.com/maps/search/?api=1&query=Espaco+Recanto+Eventos+Floriano+PI",
  mapsLabel: "Abrir rota no Google Maps",
  cardBackgroundColor: "rgba(255, 255, 255, 0.08)",
};

export default function Local({ siteConfig }) {
  const viewport = useViewport();
  const localTitulo = siteConfig?.localTitulo || defaultLocal.titulo;
  const localData = siteConfig?.localData || defaultLocal.data;
  const localHora = siteConfig?.localHora || defaultLocal.hora;
  const localNome = siteConfig?.localNome || defaultLocal.nome;
  const localEndereco = siteConfig?.localEndereco || defaultLocal.endereco;
  const localMapsLink = siteConfig?.localMapsLink || defaultLocal.mapsLink;
  const localMapsLabel = siteConfig?.localMapsButtonLabel || defaultLocal.mapsLabel;
  const localCardBackgroundColor = siteConfig?.localCardBackgroundColor || defaultLocal.cardBackgroundColor;
  const localAreaBackgroundColor = siteConfig?.corFundoLocalArea?.trim() || "#0b1b3a";

  return (
    <section
      style={{
        background: localAreaBackgroundColor,
        color: "#ffffff",
        padding: viewport.isMobile ? "64px 16px" : "80px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          margin: "0 auto",
          padding: viewport.isMobile ? "24px" : "34px",
          borderRadius: viewport.isMobile ? "22px" : "28px",
          background: localCardBackgroundColor,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 56px rgba(3, 10, 24, 0.28)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            fontSize: siteConfig?.titulosFontSize
              ? `clamp(2rem, 5vw, ${siteConfig.titulosFontSize})`
              : viewport.isMobile
                ? "28px"
                : "32px",
            marginBottom: "16px",
            fontFamily: siteConfig?.titulosFontFamily || "Georgia, serif",
            fontWeight: siteConfig?.titulosFontWeight || "600",
            color: "#ffffff",
          }}
        >
          {localTitulo}
        </h2>

        <p
          style={{
            fontSize: siteConfig?.dataFontSize
              ? `clamp(1rem, 3vw, ${siteConfig.dataFontSize})`
              : viewport.isMobile
                ? "16px"
                : "18px",
            marginBottom: "10px",
            fontFamily: siteConfig?.dataFontFamily || "Georgia, serif",
            fontWeight: siteConfig?.dataFontWeight || "500",
            color: "#fff7d6",
          }}
        >
          {localData}
        </p>

        <p
          style={{
            fontSize: siteConfig?.dataFontSize
              ? `clamp(1rem, 3vw, ${siteConfig.dataFontSize})`
              : viewport.isMobile
                ? "16px"
                : "18px",
            marginBottom: "20px",
            fontFamily: siteConfig?.dataFontFamily || "Georgia, serif",
            fontWeight: siteConfig?.dataFontWeight || "500",
            color: "#f4ede3",
          }}
        >
          {localHora}
        </p>

        <p
          style={{
            fontSize: siteConfig?.textosFontSize
              ? `clamp(1rem, 3vw, ${siteConfig.textosFontSize})`
              : viewport.isMobile
                ? "16px"
                : "18px",
            marginBottom: "30px",
            whiteSpace: "pre-line",
            fontFamily: siteConfig?.textosFontFamily || "Georgia, serif",
            fontWeight: siteConfig?.textosFontWeight || "400",
            color: "#ffffff",
          }}
        >
          {localNome}
          {"\n"}
          {localEndereco}
        </p>

        <a
          href={localMapsLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#2ecc71",
            color: "#ffffff",
            padding: viewport.isMobile ? "13px 18px" : "14px 26px",
            borderRadius: "999px",
            textDecoration: "none",
            fontSize: viewport.isMobile ? "14px" : "16px",
            fontWeight: "bold",
          }}
        >
          {localMapsLabel}
        </a>
      </div>
    </section>
  );
}

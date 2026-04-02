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
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          margin: "0 auto",
          padding: "34px",
          borderRadius: "28px",
          background: localCardBackgroundColor,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 56px rgba(3, 10, 24, 0.28)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            fontSize: siteConfig?.titulosFontSize || "32px",
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
            fontSize: siteConfig?.dataFontSize || "18px",
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
            fontSize: siteConfig?.dataFontSize || "18px",
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
            fontSize: siteConfig?.textosFontSize || "18px",
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
            padding: "14px 26px",
            borderRadius: "999px",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {localMapsLabel}
        </a>
      </div>
    </section>
  );
}

import { imageFallbacks, resolveImageSource } from "../config/siteImages.js";

export default function Footer({ siteConfig, siteImages }) {
  const safeSiteConfig = siteConfig ?? {};
  const safeSiteImages = siteImages ?? {};
  const footerBackground = resolveImageSource(safeSiteImages?.rodapeBackground, imageFallbacks.rodapeBackground);
  const footerTitle = safeSiteConfig?.heroTitulo || "Miqueias & Maria Eduarda";
  const footerDate = safeSiteConfig?.heroData || "11 de julho de 2026";
  const footerBackgroundColor = safeSiteConfig?.corFundoFooter?.trim() || "#241b2f";

  return (
    <footer
      style={{
        backgroundColor: footerBackgroundColor,
        backgroundImage: footerBackground
          ? `linear-gradient(rgba(36, 27, 47, 0.82), rgba(36, 27, 47, 0.88)), url(${footerBackground})`
          : undefined,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        color: "var(--branco, #ffffff)",
        textAlign: "center",
        padding: "40px 20px",
        marginTop: "60px",
      }}
    >
      <h2
        style={{
          fontFamily: safeSiteConfig?.titulosFontFamily || "serif",
          fontWeight: safeSiteConfig?.titulosFontWeight || "600",
          marginBottom: "10px",
        }}
      >
        {footerTitle}
      </h2>

      <p
        style={{
          marginBottom: "15px",
          fontSize: safeSiteConfig?.versiculoFontSize || "13px",
          color: safeSiteConfig?.versiculoColor || "#fff7d6",
          fontFamily: safeSiteConfig?.textosFontFamily || "serif",
          fontWeight: safeSiteConfig?.textosFontWeight || "400",
        }}
      >
        {safeSiteConfig?.versiculoTexto || "Isaías 41:20"}
      </p>

      <p
        style={{
          fontSize: safeSiteConfig?.dataFontSize || "13px",
          fontFamily: safeSiteConfig?.dataFontFamily || "serif",
          fontWeight: safeSiteConfig?.dataFontWeight || "500",
          opacity: "0.8",
        }}
      >
        {footerDate}
      </p>

      <hr
        style={{
          margin: "30px auto",
          width: "60%",
          borderColor: "rgba(255,255,255,0.2)",
        }}
      />

      <p
        style={{
          fontSize: "12px",
          opacity: "0.7",
          fontFamily: safeSiteConfig?.textosFontFamily || "serif",
          fontWeight: safeSiteConfig?.textosFontWeight || "400",
        }}
      >
        © 2026 - Todos os direitos reservados
      </p>
    </footer>
  );
}

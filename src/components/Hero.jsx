import { useEffect, useState } from "react";
import { imageFallbacks, resolveImageSource } from "../config/siteImages.js";

export default function Hero({ siteConfig, siteImages }) {
  const [show, setShow] = useState(false);
  const safeSiteConfig = siteConfig ?? {};
  const safeSiteImages = siteImages ?? {};
  const heroImage = resolveImageSource(safeSiteImages?.heroBanner, imageFallbacks.heroBanner);
  const heroTitle = safeSiteConfig?.heroTitulo || "Miqueias & Maria Eduarda";
  const heroDate = safeSiteConfig?.heroData || "11 de julho de 2026";

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#fff",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6))",
        }}
      ></div>

      <div style={{ position: "relative" }}>
        <h1
          style={{
            fontSize: safeSiteConfig?.heroTituloFontSize || "70px",
            lineHeight: "1.2",
            marginBottom: "20px",
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(40px)",
            transition: "all 1s ease",
            fontFamily: safeSiteConfig?.titulosFontFamily || "Georgia, serif",
            fontWeight: safeSiteConfig?.titulosFontWeight || "600",
          }}
        >
          {heroTitle}
        </h1>

        <p
          className="whitespace-pre-line"
          style={{
            fontFamily: safeSiteConfig?.dataFontFamily || "Georgia, serif",
            fontSize: safeSiteConfig?.dataFontSize || "18px",
            fontWeight: safeSiteConfig?.dataFontWeight || "500",
          }}
        >
          {heroDate}
        </p>
      </div>
    </div>
  );
}

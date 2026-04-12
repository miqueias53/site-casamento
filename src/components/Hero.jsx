import { useEffect, useState } from "react";

import { imageFallbacks, resolveImageSource } from "../config/siteImages.js";
import useViewport from "../hooks/useViewport.js";

export default function Hero({ siteConfig, siteImages }) {
  const [show, setShow] = useState(false);
  const viewport = useViewport();
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
        minHeight: viewport.isMobile ? "100svh" : "100vh",
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: viewport.isDesktop ? "fixed" : "scroll",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#fff",
        position: "relative",
        padding: viewport.isMobile ? "128px 20px 72px" : "144px 32px 92px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6))",
        }}
      />

      <div style={{ position: "relative", width: "min(900px, 100%)" }}>
        <h1
          style={{
            fontSize: safeSiteConfig?.heroTituloFontSize
              ? `clamp(2.7rem, 8vw, ${safeSiteConfig.heroTituloFontSize})`
              : "clamp(3rem, 9vw, 70px)",
            lineHeight: "1.15",
            marginBottom: viewport.isMobile ? "16px" : "20px",
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(40px)",
            transition: "all 1s ease",
            fontFamily: safeSiteConfig?.titulosFontFamily || "Georgia, serif",
            fontWeight: safeSiteConfig?.titulosFontWeight || "600",
            textWrap: "balance",
          }}
        >
          {heroTitle}
        </h1>

        <p
          className="whitespace-pre-line"
          style={{
            fontFamily: safeSiteConfig?.dataFontFamily || "Georgia, serif",
            fontSize: safeSiteConfig?.dataFontSize
              ? `clamp(1rem, 3vw, ${safeSiteConfig.dataFontSize})`
              : "clamp(1rem, 3vw, 18px)",
            fontWeight: safeSiteConfig?.dataFontWeight || "500",
            maxWidth: "min(560px, 100%)",
            margin: "0 auto",
          }}
        >
          {heroDate}
        </p>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Contagem from "./components/Contagem.jsx";
import Historia from "./components/Historia.jsx";
import Local from "./components/Local.jsx";
import Presentes from "./components/Presentes.jsx";
import RSVP from "./components/RSVP.jsx";
import Footer from "./components/Footer.jsx";
import BlocoExtra from "./components/BlocoExtra.jsx";
import GaleriaPosCasamento from "./components/GaleriaPosCasamento.jsx";
import Admin from "./pages/Admin.jsx";
import TypographyProvider from "./providers/TypographyProvider.jsx";
import { appId, db } from "./firebase/firebase.js";
import { emptyImageConfig, mergeImageConfig } from "./config/siteImages.js";
import { defaultSiteConfig, getSectionVisibility, normalizeSiteConfig } from "./config/siteConfig.js";
import "./App.css";

const conteudoRef = () => doc(db, "artifacts", appId, "public", "data", "config", "conteudo");
const imagensRef = () => doc(db, "artifacts", appId, "public", "data", "config", "imagens");

function getInitialView() {
  if (typeof window === "undefined") {
    return "public";
  }

  return window.location.hash === "#admin" ? "admin" : "public";
}

function sectionAnimation(delay) {
  return {
    opacity: 0,
    animation: `premiumFadeUp 0.9s ease ${delay}s forwards`,
    scrollMarginTop: "110px",
  };
}

function LoadingScreen({ backgroundColor }) {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousBodyBackground = document.body.style.background;
    const previousBodyBackgroundColor = document.body.style.backgroundColor;

    document.body.style.background = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;

    return () => {
      document.body.style.background = previousBodyBackground;
      document.body.style.backgroundColor = previousBodyBackgroundColor;
    };
  }, [backgroundColor]);

  return (
    <div style={loadingScreenStyle(backgroundColor)}>
      <div style={loadingCardStyle}>
        <div style={loadingSpinnerStyle} aria-hidden="true" />
        <p style={loadingTitleStyle}>A preparar o ambiente...</p>
        <span style={loadingSubtitleStyle}>Estamos a sincronizar as preferências do site.</span>
      </div>
    </div>
  );
}

function PublicPage({ setView, siteConfig = defaultSiteConfig, siteImages = emptyImageConfig, isBootstrapping = false }) {
  const safeSiteConfig = normalizeSiteConfig(siteConfig);
  const safeSiteImages = mergeImageConfig(siteImages);
  const globalBackgroundColor = safeSiteConfig?.corFundoGlobal?.trim() || "#fffdf8";
  const visibility = getSectionVisibility(safeSiteConfig);
  const publicNavItems = [
    visibility.historia ? { id: "historia", label: "História" } : null,
    visibility.local ? { id: "local", label: "Local" } : null,
    visibility.rsvp ? { id: "rsvp", label: "RSVP" } : null,
    visibility.presentes ? { id: "presentes", label: "Presentes" } : null,
    visibility.blocoExtra ? { id: "bloco-extra", label: "Especial" } : null,
    visibility.galeriaPos ? { id: "galeria-pos", label: "Galeria" } : null,
  ].filter(Boolean);
  const publicSections = [
    visibility.hero
      ? {
          key: "hero",
          id: "inicio",
          wrapper: "section",
          content: <Hero siteConfig={safeSiteConfig} siteImages={safeSiteImages} />,
        }
      : null,
    visibility.contagem
      ? {
          key: "contagem",
          wrapper: "div",
          content: <Contagem siteConfig={safeSiteConfig} />,
        }
      : null,
    visibility.historia
      ? {
          key: "historia",
          id: "historia",
          wrapper: "section",
          content: <Historia siteConfig={safeSiteConfig} siteImages={safeSiteImages} />,
        }
      : null,
    visibility.local
      ? {
          key: "local",
          id: "local",
          wrapper: "section",
          content: <Local siteConfig={safeSiteConfig} />,
        }
      : null,
    visibility.rsvp
      ? {
          key: "rsvp",
          wrapper: "div",
          content: <RSVP siteConfig={safeSiteConfig} />,
        }
      : null,
    visibility.presentes
      ? {
          key: "presentes",
          wrapper: "div",
          content: <Presentes siteConfig={safeSiteConfig} />,
        }
      : null,
    visibility.blocoExtra
      ? {
          key: "bloco-extra",
          id: "bloco-extra",
          wrapper: "section",
          content: <BlocoExtra siteConfig={safeSiteConfig} siteImages={safeSiteImages} />,
        }
      : null,
    visibility.galeriaPos
      ? {
          key: "galeria-pos",
          id: "galeria-pos",
          wrapper: "section",
          content: <GaleriaPosCasamento siteConfig={safeSiteConfig} siteImages={safeSiteImages} />,
        }
      : null,
  ].filter(Boolean);
  const homeSectionId = visibility.hero ? "inicio" : publicSections[0]?.id || "conteudo-principal";

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousBodyBackground = document.body.style.background;
    const previousBodyBackgroundColor = document.body.style.backgroundColor;

    document.body.style.background = globalBackgroundColor;
    document.body.style.backgroundColor = globalBackgroundColor;

    return () => {
      document.body.style.background = previousBodyBackground;
      document.body.style.backgroundColor = previousBodyBackgroundColor;
    };
  }, [globalBackgroundColor]);

  return (
    <div style={publicShellStyle(globalBackgroundColor)}>
      <div style={ambientGlowTopStyle} aria-hidden="true" />
      <div style={ambientGlowBottomStyle} aria-hidden="true" />

      <Navbar
        setView={setView}
        siteConfig={safeSiteConfig}
        navItems={publicNavItems}
        homeSectionId={homeSectionId}
      />

      <main id="conteudo-principal" style={mainStyle}>
        {isBootstrapping ? (
          <div style={loadingRibbonStyle} aria-live="polite">
            A carregar conteúdo personalizado...
          </div>
        ) : null}

        {publicSections.map((item, index) => {
          const Wrapper = item.wrapper === "section" ? "section" : "div";

          return (
            <Wrapper
              key={item.key}
              id={item.id}
              style={sectionAnimation(0.05 + index * 0.1)}
            >
              {item.content}
            </Wrapper>
          );
        })}
      </main>

      <div style={footerShellStyle}>
        <Footer siteConfig={safeSiteConfig} siteImages={safeSiteImages} />
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState(getInitialView);
  const [siteConfig, setSiteConfig] = useState(defaultSiteConfig);
  const [siteImages, setSiteImages] = useState(emptyImageConfig);
  const [contentReady, setContentReady] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      conteudoRef(),
      (snapshot) => {
        setSiteConfig(snapshot.exists() ? normalizeSiteConfig(snapshot.data()) : defaultSiteConfig);
        setContentReady(true);
      },
      (error) => {
        console.error("Erro ao ouvir conteúdo do site:", error);
        setSiteConfig(defaultSiteConfig);
        setContentReady(true);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      imagensRef(),
      (snapshot) => {
        setSiteImages(snapshot.exists() ? mergeImageConfig(snapshot.data()) : emptyImageConfig);
        setImagesReady(true);
      },
      (error) => {
        console.error("Erro ao ouvir imagens do site:", error);
        setSiteImages(emptyImageConfig);
        setImagesReady(true);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleHashChange = () => {
      setView(window.location.hash === "#admin" ? "admin" : "public");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (view === "admin") {
      if (window.location.hash !== "#admin") {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#admin`);
      }
      return;
    }

    if (window.location.hash === "#admin") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, [view]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (view !== "public") return;

    const hash = window.location.hash;
    if (!hash || hash === "#admin") return;

    const sectionId = hash.replace("#", "");
    const timeoutId = window.setTimeout(() => {
      const target = document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [view]);

  const safeSiteConfig = useMemo(() => normalizeSiteConfig(siteConfig), [siteConfig]);
  const safeSiteImages = useMemo(() => mergeImageConfig(siteImages), [siteImages]);
  const isBootstrapping = !contentReady || !imagesReady;
  const loadingBackgroundColor = safeSiteConfig?.corFundoGlobal?.trim() || defaultSiteConfig.corFundoGlobal || "#fffdf8";

  useEffect(() => {
    if (!contentReady || !imagesReady) return;
    setIsFirebaseLoaded(true);
  }, [contentReady, imagesReady]);

  return (
    <TypographyProvider>
      {view === "admin" ? (
        <Admin onBack={() => setView("public")} />
      ) : !isFirebaseLoaded ? (
        <LoadingScreen backgroundColor={loadingBackgroundColor} />
      ) : (
        <PublicPage
          setView={setView}
          siteConfig={safeSiteConfig}
          siteImages={safeSiteImages}
          isBootstrapping={isBootstrapping}
        />
      )}
    </TypographyProvider>
  );
}

const publicShellStyle = (backgroundColor) => ({
  minHeight: "100vh",
  backgroundColor,
  backgroundImage:
    "radial-gradient(circle at top, rgba(49,46,129,0.16), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(247,241,231,0.2) 52%, rgba(243,235,222,0.28) 100%)",
  color: "#241b2f",
  position: "relative",
  overflow: "hidden",
});

const ambientGlowTopStyle = {
  position: "absolute",
  top: "-140px",
  left: "-100px",
  width: "340px",
  height: "340px",
  borderRadius: "999px",
  background: "rgba(196, 166, 97, 0.17)",
  filter: "blur(28px)",
  pointerEvents: "none",
};

const ambientGlowBottomStyle = {
  position: "absolute",
  right: "-120px",
  bottom: "160px",
  width: "360px",
  height: "360px",
  borderRadius: "999px",
  background: "rgba(49, 46, 129, 0.12)",
  filter: "blur(28px)",
  pointerEvents: "none",
};

const mainStyle = { position: "relative", zIndex: 1, paddingTop: 118 };
const footerShellStyle = { position: "relative", zIndex: 1 };
const loadingRibbonStyle = {
  width: "min(1180px, calc(100% - 40px))",
  margin: "0 auto 18px",
  padding: "12px 18px",
  borderRadius: 18,
  background: "rgba(255, 251, 245, 0.78)",
  border: "1px solid rgba(196, 166, 97, 0.18)",
  color: "#6a5531",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  boxShadow: "0 12px 30px rgba(36, 27, 47, 0.06)",
};

const loadingScreenStyle = (backgroundColor) => ({
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  backgroundColor,
  backgroundImage:
    "radial-gradient(circle at top, rgba(196, 166, 97, 0.16), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(247,241,231,0.44) 52%, rgba(243,235,222,0.58) 100%)",
});

const loadingCardStyle = {
  width: "min(420px, 100%)",
  padding: "32px 28px",
  borderRadius: 28,
  border: "1px solid rgba(196, 166, 97, 0.18)",
  background: "rgba(255, 253, 248, 0.84)",
  boxShadow: "0 24px 60px rgba(36, 27, 47, 0.08)",
  display: "grid",
  justifyItems: "center",
  gap: 14,
  textAlign: "center",
  backdropFilter: "blur(12px)",
};

const loadingSpinnerStyle = {
  width: 40,
  height: 40,
  borderRadius: "999px",
  border: "3px solid rgba(196, 166, 97, 0.24)",
  borderTopColor: "#a88642",
  animation: "premiumSpin 1s linear infinite",
};

const loadingTitleStyle = {
  margin: 0,
  color: "#241b2f",
  fontSize: 18,
  fontWeight: 700,
};

const loadingSubtitleStyle = {
  color: "#6a5531",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
};

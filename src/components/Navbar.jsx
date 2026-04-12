import React, { useEffect, useRef, useState } from "react";

import useViewport from "../hooks/useViewport.js";

const defaultNavItems = [
  { id: "historia", label: "História" },
  { id: "local", label: "Local" },
  { id: "rsvp", label: "RSVP" },
  { id: "presentes", label: "Presentes" },
];

function scrollToSection(sectionId, setView, onDone) {
  setView("public");

  const nextUrl = sectionId
    ? `${window.location.pathname}${window.location.search}#${sectionId}`
    : `${window.location.pathname}${window.location.search}`;

  window.history.pushState(null, "", nextUrl);

  window.requestAnimationFrame(() => {
    const target = sectionId ? document.getElementById(sectionId) : null;

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      onDone?.();
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    onDone?.();
  });
}

export default function Navbar({
  setView,
  siteConfig,
  navItems = defaultNavItems,
  homeSectionId = "inicio",
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const viewport = useViewport();
  const useMobileMenu = !viewport.isDesktop;
  const brandLabel = siteConfig?.heroTitulo || "Miqueias & Maria Eduarda";

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 24) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
        setIsMenuOpen(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!useMobileMenu) {
      setIsMenuOpen(false);
    }
  }, [useMobileMenu]);

  const closeMenu = () => setIsMenuOpen(false);
  const handleNavigate = (sectionId) => scrollToSection(sectionId, setView, closeMenu);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      style={{
        ...headerShellStyle,
        transform: isVisible ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <div style={headerInnerStyle(useMobileMenu, isMenuOpen)}>
        <div style={headerTopStyle}>
          <div style={logoWrapStyle}>
            <span style={eyebrowStyle}>Wedding Experience</span>
            <button type="button" onClick={() => handleNavigate(homeSectionId)} style={brandButtonStyle(useMobileMenu)}>
              {brandLabel}
            </button>
          </div>

          {useMobileMenu ? (
            <button
              type="button"
              style={menuToggleStyle}
              aria-label={isMenuOpen ? "Fechar navegacao" : "Abrir navegacao"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? "Fechar" : "Menu"}
            </button>
          ) : null}
        </div>

        <nav style={navStyle(useMobileMenu, isMenuOpen)} aria-label="Navegação principal">
          {navItems?.map((item) => (
            <button
              key={item.id}
              type="button"
              style={navButtonStyle(useMobileMenu)}
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            style={adminButtonStyle(useMobileMenu)}
            onClick={() => {
              closeMenu();
              setView("admin");
            }}
          >
            Área Admin
          </button>
        </nav>
      </div>
    </header>
  );
}

const headerShellStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  width: "100%",
  padding: "14px 14px 0",
  zIndex: 50,
  transition: "transform 300ms ease-in-out",
};

const headerInnerStyle = (useMobileMenu, isMenuOpen) => ({
  margin: "0 auto",
  width: "min(1180px, calc(100% - 20px))",
  display: "grid",
  gap: useMobileMenu && isMenuOpen ? "16px" : 0,
  padding: useMobileMenu ? "14px 16px" : "18px 24px",
  borderRadius: useMobileMenu ? "24px" : "28px",
  background: "rgba(255, 251, 245, 0.82)",
  border: "1px solid rgba(196, 166, 97, 0.22)",
  boxShadow: "0 18px 45px rgba(36, 27, 47, 0.12)",
  backdropFilter: "blur(18px)",
});

const headerTopStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
};

const logoWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  minWidth: 0,
};

const eyebrowStyle = {
  fontSize: "10px",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: "#8f7a4f",
  fontWeight: 700,
};

const brandButtonStyle = (useMobileMenu) => ({
  border: "none",
  background: "transparent",
  padding: 0,
  fontSize: useMobileMenu ? "16px" : "20px",
  fontWeight: 700,
  color: "#261f33",
  cursor: "pointer",
  textAlign: "left",
  minWidth: 0,
});

const navStyle = (useMobileMenu, isMenuOpen) => ({
  display: useMobileMenu ? (isMenuOpen ? "grid" : "none") : "flex",
  alignItems: useMobileMenu ? "stretch" : "center",
  justifyContent: useMobileMenu ? "stretch" : "flex-end",
  gap: "10px",
});

const navButtonStyle = (useMobileMenu) => ({
  border: "none",
  background: "transparent",
  color: "#3f3650",
  padding: useMobileMenu ? "12px 14px" : "10px 14px",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: useMobileMenu ? "13px" : "14px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  textAlign: useMobileMenu ? "left" : "center",
});

const adminButtonStyle = (useMobileMenu) => ({
  border: "1px solid rgba(196, 166, 97, 0.28)",
  background: "linear-gradient(135deg, #312e81 0%, #211c58 100%)",
  color: "#fffaf0",
  padding: useMobileMenu ? "12px 16px" : "11px 18px",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  boxShadow: "0 12px 24px rgba(49, 46, 129, 0.28)",
  textAlign: "center",
});

const menuToggleStyle = {
  border: "1px solid rgba(49, 46, 129, 0.14)",
  background: "#fffefb",
  color: "#312e81",
  padding: "10px 14px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  cursor: "pointer",
  flexShrink: 0,
};

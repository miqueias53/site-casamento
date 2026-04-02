import React, { useEffect, useRef, useState } from "react";

const defaultNavItems = [
  { id: "historia", label: "História" },
  { id: "local", label: "Local" },
  { id: "rsvp", label: "RSVP" },
  { id: "presentes", label: "Presentes" },
];

function scrollToSection(sectionId, setView) {
  setView("public");

  const nextUrl = sectionId
    ? `${window.location.pathname}${window.location.search}#${sectionId}`
    : `${window.location.pathname}${window.location.search}`;

  window.history.pushState(null, "", nextUrl);

  window.requestAnimationFrame(() => {
    const target = sectionId ? document.getElementById(sectionId) : null;

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

export default function Navbar({
  setView,
  siteConfig,
  navItems = defaultNavItems,
  homeSectionId = "inicio",
}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const brandLabel = siteConfig?.heroTitulo || "Miqueias & Maria Eduarda";

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 24) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      style={{
        ...headerShellStyle,
        transform: isVisible ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <div style={headerInnerStyle}>
        <div style={logoWrapStyle}>
          <span style={eyebrowStyle}>Wedding Experience</span>
          <button type="button" onClick={() => scrollToSection(homeSectionId, setView)} style={brandButtonStyle}>
            {brandLabel}
          </button>
        </div>

        <nav style={navStyle} aria-label="Navegação principal">
          {navItems?.map((item) => (
            <button
              key={item.id}
              type="button"
              style={navButtonStyle}
              onClick={() => scrollToSection(item.id, setView)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" style={adminButtonStyle} onClick={() => setView("admin")}>
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

const headerInnerStyle = {
  margin: "0 auto",
  width: "min(1180px, calc(100% - 28px))",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  padding: "18px 24px",
  borderRadius: "28px",
  background: "rgba(255, 251, 245, 0.82)",
  border: "1px solid rgba(196, 166, 97, 0.22)",
  boxShadow: "0 18px 45px rgba(36, 27, 47, 0.12)",
  backdropFilter: "blur(18px)",
};

const logoWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const eyebrowStyle = {
  fontSize: "10px",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: "#8f7a4f",
  fontWeight: 700,
};

const brandButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  fontSize: "20px",
  fontWeight: 700,
  color: "#261f33",
  cursor: "pointer",
  textAlign: "left",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "10px",
};

const navButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#3f3650",
  padding: "10px 14px",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const adminButtonStyle = {
  border: "1px solid rgba(196, 166, 97, 0.28)",
  background: "linear-gradient(135deg, #312e81 0%, #211c58 100%)",
  color: "#fffaf0",
  padding: "11px 18px",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  boxShadow: "0 12px 24px rgba(49, 46, 129, 0.28)",
};

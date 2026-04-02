import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { appId, db } from "../firebase/firebase.js";

const tipografiaRef = () => doc(db, "artifacts", appId, "public", "data", "config", "tipografia");

const DEFAULT_TYPOGRAPHY = {
  titulos: {
    fontFamily: "Playfair Display",
    color: "#241b2f",
    fontSize: 68,
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: 0.02,
  },
  textos: {
    fontFamily: "Lora",
    color: "#5a4c67",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.7,
    letterSpacing: 0,
  },
  destaques: {
    fontFamily: "Montserrat",
    color: "#312e81",
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.35,
    letterSpacing: 0.04,
  },
};

const SYSTEM_FONTS = new Set([
  "arial",
  "helvetica",
  "helvetica neue",
  "verdana",
  "tahoma",
  "trebuchet ms",
  "georgia",
  "times new roman",
  "times",
  "garamond",
  "palatino",
  "palatino linotype",
  "book antiqua",
  "courier new",
  "courier",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
]);

function mergeTypography(data) {
  return {
    titulos: { ...DEFAULT_TYPOGRAPHY.titulos, ...(data?.titulos || {}) },
    textos: { ...DEFAULT_TYPOGRAPHY.textos, ...(data?.textos || {}) },
    destaques: { ...DEFAULT_TYPOGRAPHY.destaques, ...(data?.destaques || {}) },
  };
}

function extractPrimaryFont(fontFamily) {
  return String(fontFamily || "")
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function isSystemFont(fontFamily) {
  return SYSTEM_FONTS.has(extractPrimaryFont(fontFamily).toLowerCase());
}

function isSerifFont(fontFamily) {
  const primary = extractPrimaryFont(fontFamily).toLowerCase();
  return [
    "playfair display",
    "lora",
    "georgia",
    "times new roman",
    "times",
    "garamond",
    "palatino",
    "palatino linotype",
    "book antiqua",
    "serif",
    "ui-serif",
  ].includes(primary);
}

function buildFontStack(fontFamily, fallbackGroup = "sans") {
  const raw = String(fontFamily || "").trim();
  if (!raw) {
    return fallbackGroup === "serif" ? "Georgia, serif" : "ui-sans-serif, system-ui, sans-serif";
  }

  if (raw.includes(",")) return raw;

  if (isSystemFont(raw)) return raw;

  const fallback = fallbackGroup === "serif" || isSerifFont(raw)
    ? "Georgia, serif"
    : "ui-sans-serif, system-ui, sans-serif";

  return `"${extractPrimaryFont(raw)}", ${fallback}`;
}

function toPx(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" && /[a-z%]+$/i.test(value.trim())) return value.trim();

  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric}px` : fallback;
}

function toUnitless(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : fallback;
}

function toEm(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric}em` : fallback;
}

function scaledPx(value, factor, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.max(12, Math.round(numeric * factor))}px` : fallback;
}

function ensureGoogleFont(fontFamily) {
  const family = extractPrimaryFont(fontFamily);
  if (!family || isSystemFont(family)) return;

  const slug = family.toLowerCase().replace(/\s+/g, "-");
  const existing = document.head.querySelector(`link[data-google-font="${slug}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.googleFont = slug;
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

function applyTypographyVariables(typography) {
  const root = document.documentElement;
  const { titulos, textos, destaques } = typography;

  const variables = {
    "--font-titulos": buildFontStack(titulos.fontFamily, "serif"),
    "--font-textos": buildFontStack(textos.fontFamily, "sans"),
    "--font-destaques": buildFontStack(destaques.fontFamily, "sans"),
    "--color-titulos": titulos.color || DEFAULT_TYPOGRAPHY.titulos.color,
    "--color-textos": textos.color || DEFAULT_TYPOGRAPHY.textos.color,
    "--color-destaques": destaques.color || DEFAULT_TYPOGRAPHY.destaques.color,
    "--size-h1": toPx(titulos.fontSize, "68px"),
    "--size-h2": scaledPx(titulos.fontSize, 0.72, "48px"),
    "--size-h3": scaledPx(titulos.fontSize, 0.56, "38px"),
    "--size-h4": scaledPx(titulos.fontSize, 0.42, "28px"),
    "--size-h5": scaledPx(titulos.fontSize, 0.34, "22px"),
    "--size-h6": scaledPx(titulos.fontSize, 0.28, "18px"),
    "--size-p": toPx(textos.fontSize, "16px"),
    "--size-small": scaledPx(destaques.fontSize, 0.82, "14px"),
    "--size-data": toPx(destaques.fontSize, "18px"),
    "--weight-titulos": toUnitless(titulos.fontWeight, "700"),
    "--weight-textos": toUnitless(textos.fontWeight, "400"),
    "--weight-destaques": toUnitless(destaques.fontWeight, "500"),
    "--lh-titulos": toUnitless(titulos.lineHeight, "1.1"),
    "--lh-geral": toUnitless(textos.lineHeight, "1.7"),
    "--lh-destaques": toUnitless(destaques.lineHeight, "1.35"),
    "--ls-titulos": toEm(titulos.letterSpacing, "0em"),
    "--ls-textos": toEm(textos.letterSpacing, "0em"),
    "--ls-destaques": toEm(destaques.letterSpacing, "0.04em"),
  };

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export default function TypographyProvider({ children }) {
  const [typography, setTypography] = useState(DEFAULT_TYPOGRAPHY);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      tipografiaRef(),
      (snapshot) => {
        setTypography(snapshot.exists() ? mergeTypography(snapshot.data()) : DEFAULT_TYPOGRAPHY);
      },
      (error) => {
        console.error("Erro ao ouvir tipografia global:", error);
        setTypography(DEFAULT_TYPOGRAPHY);
      }
    );

    return () => unsubscribe();
  }, []);

  const googleFonts = useMemo(
    () => [typography.titulos.fontFamily, typography.textos.fontFamily, typography.destaques.fontFamily],
    [typography]
  );

  useEffect(() => {
    googleFonts.forEach((fontFamily) => ensureGoogleFont(fontFamily));
    applyTypographyVariables(typography);
  }, [googleFonts, typography]);

  return children;
}

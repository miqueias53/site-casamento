import React, { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";

import { appId, db } from "../firebase/firebase.js";
import { normalizeDeliveryConfig } from "../config/deliveryConfig.js";

const presentesRef = () => collection(db, "artifacts", appId, "public", "data", "presentes");
const pixRef = () => doc(db, "artifacts", appId, "public", "data", "config", "pix");
const entregaRef = () => doc(db, "artifacts", appId, "public", "data", "config", "entrega");

export default function Presentes({ siteConfig }) {
  const [presentes, setPresentes] = useState([]);
  const [pix, setPix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState(null);
  const [deliveryConfig, setDeliveryConfig] = useState(normalizeDeliveryConfig());
  const [toast, setToast] = useState("");
  const safeSiteConfig = siteConfig ?? {};
  const pixBackground = safeSiteConfig?.corFundoPix?.trim() || "linear-gradient(140deg, rgba(49,46,129,0.98) 0%, rgba(32,28,88,0.96) 55%, rgba(196,166,97,0.18) 100%)";

  useEffect(() => {
    const unsubGifts = onSnapshot(presentesRef(), (snap) => {
      setPresentes(
        snap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0))
      );
      setLoading(false);
    });

    const unsubPix = onSnapshot(pixRef(), (snap) => {
      setPix(snap.exists() ? snap.data() : null);
    });

    const unsubEntrega = onSnapshot(entregaRef(), (snap) => {
      setDeliveryConfig(snap.exists() ? normalizeDeliveryConfig(snap.data()) : normalizeDeliveryConfig());
    });

    return () => {
      unsubGifts();
      unsubPix();
      unsubEntrega();
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedGift) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedGift(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedGift]);

  const copyPix = async () => {
    if (!pix?.chavePix) return;
    try {
      await navigator.clipboard.writeText(pix.chavePix);
      setToast("Chave PIX copiada.");
    } catch (error) {
      console.error(error);
      setToast("Não foi possível copiar a chave PIX.");
    }
  };

  const copyAddress = async () => {
    if (!deliveryConfig?.endereco) return;
    try {
      await navigator.clipboard.writeText(deliveryConfig.endereco);
      setToast("Endereço copiado.");
    } catch (error) {
      console.error(error);
      setToast("Não foi possível copiar o endereço.");
    }
  };

  const continueToStore = () => {
    if (!selectedGift?.linkCompra) {
      setToast("Este presente ainda não possui link de loja.");
      return;
    }

    window.open(selectedGift.linkCompra, "_blank", "noopener,noreferrer");
    setSelectedGift(null);
  };

  return (
    <section id="presentes" style={styles.section}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>{safeSiteConfig?.presentesEyebrow || "Lista premium"}</span>
        <h2 style={styles.title}>{safeSiteConfig?.presentesTitulo || "Presentes e contribuições"}</h2>
        <p className="whitespace-pre-line" style={styles.copy}>
          {safeSiteConfig?.presentesDescricao ||
            "Escolhemos presentes com carinho e deixámos também a opção de contribuição via PIX para quem preferir uma oferta direta."}
        </p>
      </div>

      {pix?.chavePix ? (
        <div
          className="grid gap-6 md:grid-cols-[minmax(280px,1fr)_minmax(260px,360px)]"
          style={{ ...styles.pixCard, background: pixBackground }}
        >
          <div>
            <span style={styles.eyebrow}>{safeSiteConfig?.presentesPixEyebrow || "PIX"}</span>
            <h3 style={styles.subtitle}>{safeSiteConfig?.presentesPixTitulo || "Contribuição digital"}</h3>
            <p className="whitespace-pre-line" style={styles.copy}>
              {pix.mensagem || "Se preferir, pode contribuir diretamente através da nossa chave PIX."}
            </p>
            <div className="whitespace-pre-line" style={styles.pixMeta}>{pix.titular || "Titular"} {pix.banco ? `· ${pix.banco}` : ""}</div>
          </div>

          <div style={styles.pixBoxWrap}>
            <div style={styles.pixBox}>{pix.chavePix}</div>
            <button type="button" onClick={copyPix} style={styles.primaryButton}>Copiar chave PIX</button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div style={styles.emptyState}>{safeSiteConfig?.presentesLoadingTexto || "A carregar presentes..."}</div>
      ) : presentes.length === 0 ? (
        <div style={styles.emptyState}>{safeSiteConfig?.presentesVazioTexto || "A lista de presentes será publicada em breve."}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
          {presentes.map((gift) => {
            const disabled = Boolean(gift?.reservado);

            return (
              <article
                key={gift.id}
                className="overflow-hidden rounded-[26px] border border-amber-100/80"
                style={styles.card}
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-b from-stone-100 to-amber-50 p-4">
                  {gift?.imagem ? (
                    <img
                      src={gift.imagem}
                      alt={gift?.nome || "Presente"}
                      loading="lazy"
                      className="h-32 w-full object-contain object-center md:h-36"
                    />
                  ) : (
                    <div className="grid h-32 w-full place-items-center rounded-2xl border border-dashed border-amber-200 text-center text-sm font-semibold text-amber-700">
                      Sem imagem
                    </div>
                  )}

                  {disabled ? <div style={styles.badge}>Já reservado</div> : null}
                </div>

                <div className="grid gap-4 p-4">
                  <div>
                    <span style={styles.store}>{gift?.loja || gift?.lojaNome || "Seleção do casal"}</span>
                    <h3 style={styles.cardTitle}>{gift?.nome || "Presente"}</h3>
                    <p style={styles.price}>{gift?.valor || "Valor sob consulta"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedGift(gift)}
                    disabled={disabled}
                    style={disabled ? styles.disabledButtonCompact : styles.primaryButtonCompact}
                  >
                    {disabled
                      ? safeSiteConfig?.presentesBotaoIndisponivel || "Indisponível"
                      : safeSiteConfig?.presentesBotaoComprar || "Comprar presente"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {toast ? <div style={styles.toast}>{toast}</div> : null}

      {selectedGift ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
          onClick={() => setSelectedGift(null)}
        >
          <div
            className="max-h-[90vh] overflow-y-auto"
            style={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <span style={styles.eyebrow}>Entrega</span>
            <h3 style={styles.subtitle}>{deliveryConfig?.titulo || "Antes de ir para a loja"}</h3>
            <p className="whitespace-pre-line" style={styles.copy}>{deliveryConfig?.mensagem}</p>

            <div style={styles.deliveryBox}>
              <strong style={styles.deliveryLabel}>Endereço de entrega</strong>
              <p className="whitespace-pre-line" style={styles.deliveryAddress}>{deliveryConfig?.endereco}</p>
              <button type="button" onClick={copyAddress} style={styles.secondaryButtonCompact}>
                Copiar Endereço
              </button>
            </div>

            <div style={styles.modalActions}>
              <button type="button" onClick={() => setSelectedGift(null)} style={styles.secondaryButton}>
                {deliveryConfig?.botaoCancelar || "Cancelar"}
              </button>
              <button
                type="button"
                onClick={continueToStore}
                style={!selectedGift?.linkCompra ? styles.disabledButton : styles.primaryButton}
                disabled={!selectedGift?.linkCompra}
              >
                {deliveryConfig?.botaoContinuar || "Continuar para a Loja"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  section: { maxWidth: 1180, margin: "0 auto", padding: "96px 20px 110px" },
  header: { maxWidth: 720, margin: "0 auto 42px", textAlign: "center" },
  eyebrow: { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(196,166,97,0.12)", color: "#8f7a4f", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" },
  title: { margin: "16px 0 12px", fontSize: 48, color: "#241b2f" },
  subtitle: { margin: "14px 0 10px", fontSize: 30, color: "#241b2f" },
  copy: { margin: 0, fontSize: 16, lineHeight: 1.8, color: "#5a4c67" },
  pixCard: { alignItems: "center", padding: 32, marginBottom: 34, borderRadius: 30, background: "linear-gradient(140deg, rgba(49,46,129,0.98) 0%, rgba(32,28,88,0.96) 55%, rgba(196,166,97,0.18) 100%)", color: "#fffaf2", boxShadow: "0 30px 70px rgba(36,27,47,0.22)" },
  pixMeta: { marginTop: 14, color: "#f5ddaa", fontWeight: 700 },
  pixBoxWrap: { display: "grid", gap: 14 },
  pixBox: { padding: 20, borderRadius: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(216,191,127,0.18)", fontFamily: "ui-monospace, monospace", wordBreak: "break-all", lineHeight: 1.6 },
  emptyState: { padding: 24, borderRadius: 24, background: "rgba(255,253,248,0.94)", border: "1px solid rgba(196,166,97,0.18)", color: "#5a4c67" },
  card: { background: "rgba(255,253,248,0.96)", boxShadow: "0 18px 40px rgba(36,27,47,0.08)" },
  badge: { position: "absolute", top: 14, right: 14, padding: "9px 12px", borderRadius: 999, background: "rgba(36,27,47,0.78)", color: "#fffaf2", fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" },
  store: { display: "inline-flex", marginBottom: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8f7a4f" },
  cardTitle: { margin: "0 0 6px", fontSize: 20, color: "#241b2f" },
  price: { margin: 0, color: "#312e81", fontWeight: 700 },
  primaryButton: { padding: "16px 18px", borderRadius: 18, border: "1px solid rgba(196,166,97,0.24)", background: "linear-gradient(135deg, #c4a661 0%, #a88642 100%)", color: "#241b2f", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none", textAlign: "center" },
  primaryButtonCompact: { padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(196,166,97,0.24)", background: "linear-gradient(135deg, #c4a661 0%, #a88642 100%)", color: "#241b2f", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" },
  secondaryButton: { padding: "15px 18px", borderRadius: 18, border: "1px solid rgba(49,46,129,0.16)", background: "#fffefb", color: "#312e81", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", textAlign: "center", cursor: "pointer" },
  disabledButton: { padding: "16px 18px", borderRadius: 18, border: "1px solid rgba(36,27,47,0.08)", background: "#ece8e1", color: "#90859f", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "not-allowed" },
  disabledButtonCompact: { padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(36,27,47,0.08)", background: "#ece8e1", color: "#90859f", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "not-allowed" },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", padding: "14px 18px", borderRadius: 18, background: "#241b2f", color: "#fffaf2", boxShadow: "0 24px 50px rgba(36,27,47,0.26)", zIndex: 80 },
  modalCard: { width: "min(720px, 100%)", padding: 34, borderRadius: 30, background: "#fffefb", border: "1px solid rgba(196,166,97,0.18)", boxShadow: "0 30px 70px rgba(36,27,47,0.22)", display: "grid", gap: 18 },
  deliveryBox: { padding: 20, borderRadius: 22, background: "rgba(49,46,129,0.05)", border: "1px solid rgba(49,46,129,0.08)", display: "grid", gap: 12, justifyItems: "start" },
  deliveryLabel: { display: "block", marginBottom: 10, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8f7a4f" },
  deliveryAddress: { margin: 0, whiteSpace: "pre-line", color: "#241b2f", lineHeight: 1.7 },
  modalActions: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  secondaryButtonCompact: { padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(49,46,129,0.16)", background: "rgba(255,255,255,0.82)", color: "#312e81", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" },
};

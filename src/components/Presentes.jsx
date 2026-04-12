import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";

import { normalizeDeliveryConfig } from "../config/deliveryConfig.js";
import { appId, db } from "../firebase/firebase.js";
import useViewport from "../hooks/useViewport.js";
import { desreservarPresentePublico, reservarPresenteTransacao } from "../services/presentes.js";

const presentesRef = () => collection(db, "artifacts", appId, "public", "data", "presentes");
const pixRef = () => doc(db, "artifacts", appId, "public", "data", "config", "pix");
const entregaRef = () => doc(db, "artifacts", appId, "public", "data", "config", "entrega");

const RESERVATION_TOKEN_KEY = "casamento.presentes.reservaToken";
const RESERVATION_NAME_KEY = "casamento.presentes.reservanteNome";

function createReservationToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `reserva-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureReservationToken() {
  if (typeof window === "undefined") return "";

  const currentToken = window.localStorage.getItem(RESERVATION_TOKEN_KEY);
  if (currentToken) return currentToken;

  const nextToken = createReservationToken();
  window.localStorage.setItem(RESERVATION_TOKEN_KEY, nextToken);
  return nextToken;
}

function readReservationName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(RESERVATION_NAME_KEY) || "";
}

function persistReservationName(name) {
  if (typeof window === "undefined") return;

  if (name) {
    window.localStorage.setItem(RESERVATION_NAME_KEY, name);
    return;
  }

  window.localStorage.removeItem(RESERVATION_NAME_KEY);
}

function isGiftReservedByCurrentBrowser(gift, reservationToken) {
  return Boolean(gift?.reservado && gift?.reservaToken && reservationToken && gift.reservaToken === reservationToken);
}

function formatReservationDate(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("pt-BR");
}

export default function Presentes({ siteConfig }) {
  const viewport = useViewport();
  const [presentes, setPresentes] = useState([]);
  const [pix, setPix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [deliveryConfig, setDeliveryConfig] = useState(normalizeDeliveryConfig());
  const [toast, setToast] = useState("");
  const [reservationName, setReservationName] = useState("");
  const [reservationToken, setReservationToken] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const safeSiteConfig = siteConfig ?? {};
  const pixBackground = safeSiteConfig?.corFundoPix?.trim() || "linear-gradient(140deg, rgba(49,46,129,0.98) 0%, rgba(32,28,88,0.96) 55%, rgba(196,166,97,0.18) 100%)";
  const selectedGift = useMemo(
    () => presentes.find((item) => item.id === selectedGiftId) || null,
    [presentes, selectedGiftId]
  );
  const selectedGiftReservedByYou = selectedGift ? isGiftReservedByCurrentBrowser(selectedGift, reservationToken) : false;
  const selectedGiftReservedByOther = selectedGift ? Boolean(selectedGift.reservado && !selectedGiftReservedByYou) : false;

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
    setReservationToken(ensureReservationToken());
    setReservationName(readReservationName());
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedGiftId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedGiftId("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedGiftId]);

  useEffect(() => {
    if (!selectedGiftId) return;

    const exists = presentes.some((item) => item.id === selectedGiftId);
    if (!exists) {
      setSelectedGiftId("");
    }
  }, [presentes, selectedGiftId]);

  useEffect(() => {
    if (typeof document === "undefined" || !selectedGiftId) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedGiftId]);

  const copyPix = async () => {
    if (!pix?.chavePix) return;
    try {
      await navigator.clipboard.writeText(pix.chavePix);
      setToast("Chave PIX copiada.");
    } catch (error) {
      console.error(error);
      setToast("Nao foi possivel copiar a chave PIX.");
    }
  };

  const copyAddress = async () => {
    if (!deliveryConfig?.endereco) return;
    try {
      await navigator.clipboard.writeText(deliveryConfig.endereco);
      setToast("Endereco copiado.");
    } catch (error) {
      console.error(error);
      setToast("Nao foi possivel copiar o endereco.");
    }
  };

  const openGiftPanel = (gift) => {
    setReservationName(readReservationName());
    setSelectedGiftId(gift.id);
  };

  const closeGiftPanel = () => {
    setSelectedGiftId("");
    setActionBusy(false);
  };

  const continueToStore = (gift) => {
    if (!gift?.linkCompra) {
      setToast("Este presente ainda nao possui link de loja.");
      return;
    }

    window.open(gift.linkCompra, "_blank", "noopener,noreferrer");
    closeGiftPanel();
  };

  const handleReserveAndContinue = async () => {
    if (!selectedGift || selectedGiftReservedByOther) return;

    const currentToken = reservationToken || ensureReservationToken();
    const trimmedName = reservationName.trim();
    const safeName = trimmedName || "Convidado";
    setReservationToken(currentToken);
    persistReservationName(trimmedName);
    setActionBusy(true);

    try {
      const result = await reservarPresenteTransacao(selectedGift.id, safeName, currentToken);
      if (!result.sucesso) {
        setToast(result.erro || "Nao foi possivel reservar este presente.");
        return;
      }

      setToast(result.mensagem || "Reserva efetuada com sucesso!");
      continueToStore(selectedGift);
    } finally {
      setActionBusy(false);
    }
  };

  const handleContinueWithoutReserve = () => {
    if (!selectedGift || selectedGiftReservedByOther) return;
    continueToStore(selectedGift);
  };

  const handleUnreserve = async () => {
    if (!selectedGift || !selectedGiftReservedByYou) return;

    setActionBusy(true);
    try {
      const result = await desreservarPresentePublico(selectedGift.id, reservationToken);
      if (!result.sucesso) {
        setToast(result.erro || "Nao foi possivel cancelar esta reserva.");
        return;
      }

      setToast(result.mensagem || "Reserva cancelada com sucesso!");
      closeGiftPanel();
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <section
      id="presentes"
      style={{
        ...styles.section,
        padding: viewport.isMobile ? "72px 16px 90px" : viewport.isTablet ? "84px 20px 100px" : styles.section.padding,
      }}
    >
      <div style={{ ...styles.header, marginBottom: viewport.isMobile ? 30 : 42 }}>
        <span style={styles.eyebrow}>{safeSiteConfig?.presentesEyebrow || "Lista premium"}</span>
        <h2
          style={{
            ...styles.title,
            fontSize: safeSiteConfig?.titulosFontSize
              ? `clamp(2rem, 6vw, ${safeSiteConfig.titulosFontSize})`
              : viewport.isMobile
                ? 34
                : viewport.isTablet
                  ? 40
                  : styles.title.fontSize,
          }}
        >
          {safeSiteConfig?.presentesTitulo || "Presentes e contribuicoes"}
        </h2>
        <p className="whitespace-pre-line" style={styles.copy}>
          {safeSiteConfig?.presentesDescricao ||
            "Escolhemos presentes com carinho e deixamos tambem a opcao de contribuicao via PIX para quem preferir uma oferta direta."}
        </p>
      </div>

      {pix?.chavePix ? (
        <div
          className="grid gap-6 md:grid-cols-[minmax(280px,1fr)_minmax(260px,360px)]"
          style={{
            ...styles.pixCard,
            padding: viewport.isMobile ? 22 : 32,
            borderRadius: viewport.isMobile ? 24 : styles.pixCard.borderRadius,
            background: pixBackground,
          }}
        >
          <div>
            <span style={styles.eyebrow}>{safeSiteConfig?.presentesPixEyebrow || "PIX"}</span>
            <h3 style={{ ...styles.subtitle, fontSize: viewport.isMobile ? 24 : styles.subtitle.fontSize }}>
              {safeSiteConfig?.presentesPixTitulo || "Contribuicao digital"}
            </h3>
            <p className="whitespace-pre-line" style={styles.copy}>
              {pix.mensagem || "Se preferir, pode contribuir diretamente atraves da nossa chave PIX."}
            </p>
            <div className="whitespace-pre-line" style={styles.pixMeta}>
              {pix.titular || "Titular"} {pix.banco ? `· ${pix.banco}` : ""}
            </div>
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
        <div style={styles.emptyState}>{safeSiteConfig?.presentesVazioTexto || "A lista de presentes sera publicada em breve."}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {presentes.map((gift) => {
            const reservedByYou = isGiftReservedByCurrentBrowser(gift, reservationToken);
            const reservedByOther = Boolean(gift?.reservado && !reservedByYou);

            return (
              <article
                key={gift.id}
                className="overflow-hidden rounded-[26px] border border-amber-100/80"
                style={styles.card}
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-b from-stone-100 to-amber-50 p-4 sm:h-44">
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

                  {gift?.reservado ? (
                    <div style={reservedByYou ? styles.badgeOwned : styles.badge}>
                      {reservedByYou ? "Reserva ativa" : "Ja reservado"}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 p-4">
                  <div>
                    <span style={styles.store}>{gift?.loja || gift?.lojaNome || "Selecao do casal"}</span>
                    <h3
                      style={{
                        ...styles.cardTitle,
                        fontSize: viewport.isMobile ? 18 : styles.cardTitle.fontSize,
                      }}
                    >
                      {gift?.nome || "Presente"}
                    </h3>
                    <p style={styles.price}>{gift?.valor || "Valor sob consulta"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openGiftPanel(gift)}
                    disabled={reservedByOther}
                    style={reservedByOther ? styles.disabledButtonCompact : styles.primaryButtonCompact}
                  >
                    {reservedByYou
                      ? "Abrir reserva"
                      : reservedByOther
                        ? safeSiteConfig?.presentesBotaoIndisponivel || "Indisponivel"
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
          style={{
            ...styles.modalBackdrop,
            padding: viewport.isDesktop ? 24 : 0,
          }}
          onClick={closeGiftPanel}
        >
          <div
            style={{
              ...styles.modalCard,
              width: viewport.isDesktop ? "min(760px, calc(100vw - 48px))" : "100vw",
              height: viewport.isDesktop ? "min(92vh, 920px)" : "100vh",
              maxWidth: viewport.isDesktop ? "760px" : "100vw",
              padding: viewport.isMobile ? 22 : 34,
              borderRadius: viewport.isDesktop ? 32 : 0,
              boxShadow: viewport.isDesktop ? "0 32px 80px rgba(36,27,47,0.24)" : "none",
              border: viewport.isDesktop ? "1px solid rgba(196,166,97,0.16)" : "none",
            }}
            onClick={(event) => event.stopPropagation()}
            aria-live="polite"
          >
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.eyebrow}>Entrega e reserva</span>
                <h3
                  style={{
                    ...styles.modalTitle,
                    fontSize: viewport.isMobile ? 24 : styles.modalTitle.fontSize,
                  }}
                >
                  {deliveryConfig?.titulo || "Antes de ir para a loja"}
                </h3>
              </div>
              <button type="button" onClick={closeGiftPanel} style={styles.closeButton} aria-label="Fechar modal">
                x
              </button>
            </div>

            <div style={styles.giftSummary}>
              <span style={styles.store}>{selectedGift?.loja || selectedGift?.lojaNome || "Selecao do casal"}</span>
              <strong style={styles.giftSummaryTitle}>{selectedGift?.nome || "Presente"}</strong>
              <span style={styles.giftSummaryPrice}>{selectedGift?.valor || "Valor sob consulta"}</span>
            </div>

            {selectedGiftReservedByOther ? (
              <div style={styles.warningBox}>
                Este presente foi reservado por outra pessoa e ficou indisponivel para novas reservas ou compras por este fluxo.
              </div>
            ) : selectedGiftReservedByYou ? (
              <div style={styles.infoBox}>
                Existe uma reserva ativa neste navegador{selectedGift?.reservadoPor ? ` com o nome ${selectedGift.reservadoPor}` : ""}.
                {selectedGift?.dataReserva ? ` Reserva feita em ${formatReservationDate(selectedGift.dataReserva)}.` : ""}
              </div>
            ) : (
              <div style={styles.infoBox}>
                Pode reservar este presente antes de seguir para a loja ou continuar sem reservar. Se desistir depois, a desreserva fica disponivel neste mesmo navegador.
              </div>
            )}

            <p className="whitespace-pre-line" style={styles.copy}>{deliveryConfig?.mensagem}</p>

            <div style={styles.deliveryBox}>
              <strong style={styles.deliveryLabel}>Endereco de entrega</strong>
              <p className="whitespace-pre-line" style={styles.deliveryAddress}>{deliveryConfig?.endereco}</p>
              <button type="button" onClick={copyAddress} style={styles.secondaryButtonCompact}>
                Copiar Endereco
              </button>
            </div>

            {!selectedGiftReservedByYou && !selectedGiftReservedByOther ? (
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Nome para reserva (opcional)</span>
                <input
                  value={reservationName}
                  onChange={(event) => setReservationName(event.target.value)}
                  placeholder="Convidado"
                  style={styles.input}
                />
              </label>
            ) : null}

            <div
              style={{
                ...styles.modalActions,
                gridTemplateColumns: viewport.isMobile ? "1fr" : styles.modalActions.gridTemplateColumns,
              }}
            >
              <button type="button" onClick={closeGiftPanel} style={styles.secondaryButton}>
                {deliveryConfig?.botaoCancelar || "Cancelar"}
              </button>

              {selectedGiftReservedByYou ? (
                <>
                  <button
                    type="button"
                    onClick={handleUnreserve}
                    style={actionBusy ? styles.disabledButton : styles.secondaryButton}
                    disabled={actionBusy}
                  >
                    {actionBusy ? "A processar..." : "Desreservar presente"}
                  </button>
                  <button
                    type="button"
                    onClick={() => continueToStore(selectedGift)}
                    style={!selectedGift?.linkCompra || actionBusy ? styles.disabledButton : styles.primaryButton}
                    disabled={!selectedGift?.linkCompra || actionBusy}
                  >
                    {deliveryConfig?.botaoContinuar || "Continuar para a Loja"}
                  </button>
                </>
              ) : selectedGiftReservedByOther ? null : (
                <>
                  <button
                    type="button"
                    onClick={handleContinueWithoutReserve}
                    style={!selectedGift?.linkCompra || actionBusy ? styles.disabledButton : styles.secondaryButton}
                    disabled={!selectedGift?.linkCompra || actionBusy}
                  >
                    Continuar sem reservar
                  </button>
                  <button
                    type="button"
                    onClick={handleReserveAndContinue}
                    style={!selectedGift?.linkCompra || actionBusy ? styles.disabledButton : styles.primaryButton}
                    disabled={!selectedGift?.linkCompra || actionBusy}
                  >
                    {actionBusy ? "A reservar..." : "Reservar e continuar"}
                  </button>
                </>
              )}
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
  modalTitle: { margin: "14px 0 0", fontSize: 30, color: "#241b2f" },
  copy: { margin: 0, fontSize: 16, lineHeight: 1.8, color: "#5a4c67" },
  pixCard: { alignItems: "center", padding: 32, marginBottom: 34, borderRadius: 30, background: "linear-gradient(140deg, rgba(49,46,129,0.98) 0%, rgba(32,28,88,0.96) 55%, rgba(196,166,97,0.18) 100%)", color: "#fffaf2", boxShadow: "0 30px 70px rgba(36,27,47,0.22)" },
  pixMeta: { marginTop: 14, color: "#f5ddaa", fontWeight: 700 },
  pixBoxWrap: { display: "grid", gap: 14 },
  pixBox: { padding: 20, borderRadius: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(216,191,127,0.18)", fontFamily: "ui-monospace, monospace", wordBreak: "break-all", lineHeight: 1.6 },
  emptyState: { padding: 24, borderRadius: 24, background: "rgba(255,253,248,0.94)", border: "1px solid rgba(196,166,97,0.18)", color: "#5a4c67" },
  card: { background: "rgba(255,253,248,0.96)", boxShadow: "0 18px 40px rgba(36,27,47,0.08)" },
  badge: { position: "absolute", top: 14, right: 14, padding: "9px 12px", borderRadius: 999, background: "rgba(36,27,47,0.78)", color: "#fffaf2", fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" },
  badgeOwned: { position: "absolute", top: 14, right: 14, padding: "9px 12px", borderRadius: 999, background: "rgba(49,46,129,0.88)", color: "#fffaf2", fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase" },
  store: { display: "inline-flex", marginBottom: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8f7a4f" },
  cardTitle: { margin: "0 0 6px", fontSize: 20, color: "#241b2f" },
  price: { margin: 0, color: "#312e81", fontWeight: 700 },
  primaryButton: { padding: "16px 18px", borderRadius: 18, border: "1px solid rgba(196,166,97,0.24)", background: "linear-gradient(135deg, #c4a661 0%, #a88642 100%)", color: "#241b2f", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none", textAlign: "center" },
  primaryButtonCompact: { padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(196,166,97,0.24)", background: "linear-gradient(135deg, #c4a661 0%, #a88642 100%)", color: "#241b2f", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" },
  secondaryButton: { padding: "15px 18px", borderRadius: 18, border: "1px solid rgba(49,46,129,0.16)", background: "#fffefb", color: "#312e81", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", textAlign: "center", cursor: "pointer" },
  disabledButton: { padding: "16px 18px", borderRadius: 18, border: "1px solid rgba(36,27,47,0.08)", background: "#ece8e1", color: "#90859f", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "not-allowed" },
  disabledButtonCompact: { padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(36,27,47,0.08)", background: "#ece8e1", color: "#90859f", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "not-allowed" },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", padding: "14px 18px", borderRadius: 18, background: "#241b2f", color: "#fffaf2", boxShadow: "0 24px 50px rgba(36,27,47,0.26)", zIndex: 120, width: "min(420px, calc(100vw - 32px))", textAlign: "center" },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(18,16,32,0.36)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 0, zIndex: 110 },
  modalCard: { width: "100vw", height: "100vh", maxWidth: "100vw", maxHeight: "100vh", overflowY: "auto", padding: 34, borderRadius: 0, background: "rgba(255,253,248,0.99)", border: "none", boxShadow: "none", display: "grid", gap: 20, alignContent: "start" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  closeButton: { width: 42, height: 42, borderRadius: 999, border: "1px solid rgba(49,46,129,0.12)", background: "#fffefb", color: "#312e81", fontSize: 16, fontWeight: 900, cursor: "pointer", flexShrink: 0 },
  giftSummary: { padding: 18, borderRadius: 22, background: "linear-gradient(160deg, rgba(255,254,250,0.98) 0%, rgba(248,241,230,0.88) 100%)", border: "1px solid rgba(196,166,97,0.16)", display: "grid", gap: 6 },
  giftSummaryTitle: { color: "#241b2f", fontSize: 22 },
  giftSummaryPrice: { color: "#312e81", fontWeight: 700 },
  deliveryBox: { padding: 20, borderRadius: 22, background: "rgba(49,46,129,0.05)", border: "1px solid rgba(49,46,129,0.08)", display: "grid", gap: 12, justifyItems: "start" },
  deliveryLabel: { display: "block", marginBottom: 10, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8f7a4f" },
  deliveryAddress: { margin: 0, whiteSpace: "pre-line", color: "#241b2f", lineHeight: 1.7 },
  modalActions: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  secondaryButtonCompact: { padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(49,46,129,0.16)", background: "rgba(255,255,255,0.82)", color: "#312e81", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" },
  field: { display: "grid", gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8f7a4f" },
  input: { width: "100%", padding: "15px 16px", borderRadius: 18, border: "1px solid rgba(49,46,129,0.12)", background: "#fffefb", color: "#241b2f", fontSize: 15, outline: "none" },
  infoBox: { padding: 16, borderRadius: 18, background: "linear-gradient(140deg, rgba(49,46,129,0.08) 0%, rgba(255,255,255,0.82) 100%)", color: "#4c3f5e", lineHeight: 1.6 },
  warningBox: { padding: 16, borderRadius: 18, background: "rgba(153,27,27,0.08)", border: "1px solid rgba(153,27,27,0.12)", color: "#8f1d1d", lineHeight: 1.6 },
};

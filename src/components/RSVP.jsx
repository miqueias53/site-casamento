import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";

import { appId, db } from "../firebase/firebase.js";
import { formatRsvpResumo } from "../config/siteConfig.js";

const convidadosRef = () => collection(db, "artifacts", appId, "public", "data", "convidados");
const convidadoRef = (id) => doc(db, "artifacts", appId, "public", "data", "convidados", id);

function getGuestQueryId() {
  return new URLSearchParams(window.location.search).get("id") || "";
}

function clamp(value, max) {
  return Math.min(Math.max(Number(value) || 0, 0), Number(max) || 0);
}

export default function RSVP({ siteConfig }) {
  const [guests, setGuests] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const safeSiteConfig = useMemo(() => siteConfig ?? {}, [siteConfig]);
  const rsvpBackground = safeSiteConfig?.corFundoRSVP?.trim() || "linear-gradient(150deg, #2f2b73 0%, #181435 100%)";

  useEffect(() => {
    const unsub = onSnapshot(convidadosRef(), (snap) => {
      setGuests(snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => a.nome.localeCompare(b.nome, "pt")));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const inviteId = getGuestQueryId();
    if (!inviteId || !guests.length || selectedId) return;

    const match = guests.find((item) => item.conviteId === inviteId);
    if (match) {
      selectGuest(match);
      setStatus(safeSiteConfig?.rsvpStatusConviteEncontrado || "O seu convite foi localizado automaticamente.");
    }
  }, [guests, selectedId, safeSiteConfig]);

  const filteredGuests = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 3) return [];
    return guests.filter((item) => item.nome.toLowerCase().includes(term)).slice(0, 8);
  }, [guests, query]);

  const selectedGuest = useMemo(() => guests.find((item) => item.id === selectedId) || null, [guests, selectedId]);
  const infoItems = [
    safeSiteConfig?.rsvpInformacao1,
    safeSiteConfig?.rsvpInformacao2,
    safeSiteConfig?.rsvpInformacao3,
  ].filter(Boolean);

  function selectGuest(guest) {
    setSelectedId(guest.id);
    setQuery(guest.nome);
    setAdults(clamp(guest.adultosConfirmados ?? (guest.maxAdultos > 0 ? 1 : 0), guest.maxAdultos));
    setChildren(clamp(guest.criancasConfirmadas ?? 0, guest.maxCriancas));
  }

  function handleSearchChange(value) {
    setQuery(value);
    setStatus("");
    if (selectedGuest && value !== selectedGuest.nome) {
      setSelectedId("");
    }
  }

  async function confirmPresence() {
    if (!selectedGuest) return;
    if (adults + children <= 0) {
      setStatus(safeSiteConfig?.rsvpStatusSelecionePresenca || "Selecione pelo menos uma presença para concluir a confirmação.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      await updateDoc(convidadoRef(selectedGuest.id), {
        status: "Confirmado",
        confirmado: true,
        adultosConfirmados: clamp(adults, selectedGuest.maxAdultos),
        criancasConfirmadas: clamp(children, selectedGuest.maxCriancas),
        dataResposta: new Date().toISOString(),
      });
      setStatus(safeSiteConfig?.rsvpStatusSucesso || "Presença confirmada com sucesso. Obrigado por celebrar este momento connosco.");
    } catch (error) {
      console.error(error);
      setStatus(
        safeSiteConfig?.rsvpStatusErro ||
          "Não foi possível confirmar a presença agora. Tente novamente dentro de instantes."
      );
    } finally {
      setLoading(false);
    }
  }

  const emptyMessage = query.trim().length >= 3
    ? safeSiteConfig?.rsvpBuscaSemResultados || "Não encontramos nenhum convite com esse nome. Verifique a grafia e tente novamente."
    : safeSiteConfig?.rsvpBuscaInstrucao || "Digite pelo menos 3 letras do seu nome ou sobrenome para procurar o convite.";

  return (
    <section id="rsvp" style={styles.section}>
      <div style={styles.shell}>
        <aside style={{ ...styles.aside, background: rsvpBackground }}>
          <span style={styles.eyebrow}>{safeSiteConfig?.rsvpEyebrow || "Lista fechada"}</span>
          <h2
            style={{
              ...styles.title,
              fontFamily: safeSiteConfig?.titulosFontFamily,
              fontWeight: safeSiteConfig?.titulosFontWeight,
              fontSize: safeSiteConfig?.titulosFontSize || styles.title.fontSize,
            }}
          >
            {safeSiteConfig?.rsvpTitulo || "RSVP personalizado"}
          </h2>
          <p
            style={{
              ...styles.copy,
              fontFamily: safeSiteConfig?.textosFontFamily,
              fontWeight: safeSiteConfig?.textosFontWeight,
              fontSize: safeSiteConfig?.textosFontSize || styles.copy.fontSize,
            }}
          >
            {safeSiteConfig?.rsvpDescricao ||
              "Procure pelo seu nome ou sobrenome para abrir o convite digital e confirmar a sua presença com toda a elegância."}
          </p>

          <div style={styles.deadlineCard}>
            <span style={styles.deadlineLabel}>{safeSiteConfig?.rsvpPrazoLabel || "Data limite para confirmação"}</span>
            <strong style={styles.deadlineDate}>{safeSiteConfig?.rsvpPrazoData || "11 de maio"}</strong>
            <p style={styles.deadlineCopy}>
              {safeSiteConfig?.rsvpPrazoTexto || "Agradecemos, com carinho, que a sua resposta seja enviada até esta data."}
            </p>
          </div>

          <div style={styles.importantCard}>
            <span style={styles.importantLabel}>{safeSiteConfig?.rsvpInformacoesTitulo || "Informações importantes"}</span>
            <ul style={styles.importantList}>
              {infoItems.map((item) => (
                <li key={item} style={styles.importantItem}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>

        <div style={styles.panel}>
          <div style={styles.searchWrap}>
            <input
              value={query}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={safeSiteConfig?.rsvpBuscaPlaceholder || "Comece a escrever o seu nome ou sobrenome"}
              style={styles.input}
            />

            {filteredGuests.length > 0 && !selectedGuest ? (
              <div style={styles.dropdown}>
                {filteredGuests.map((guest) => (
                  <button key={guest.id} type="button" onClick={() => selectGuest(guest)} style={styles.dropdownItem}>
                    <strong>{guest.nome}</strong>
                    <span style={styles.dropdownMeta}>{guest.maxAdultos || 0} adultos / {guest.maxCriancas || 0} crianças</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!selectedGuest ? (
            <div style={styles.emptyState}>{emptyMessage}</div>
          ) : (
            <div style={styles.inviteCard}>
              <span style={styles.eyebrow}>{safeSiteConfig?.rsvpConviteEyebrow || "Convite aberto"}</span>
              <h3
                style={{
                  ...styles.subtitle,
                  fontFamily: safeSiteConfig?.titulosFontFamily,
                  fontWeight: safeSiteConfig?.titulosFontWeight,
                }}
              >
                {(safeSiteConfig?.rsvpSaudacaoPrefixo || "Olá,")} {selectedGuest.nome}.
              </h3>
              <p
                style={{
                  ...styles.copy,
                  fontFamily: safeSiteConfig?.textosFontFamily,
                  fontWeight: safeSiteConfig?.textosFontWeight,
                  fontSize: safeSiteConfig?.textosFontSize || styles.copy.fontSize,
                }}
              >
                {formatRsvpResumo(safeSiteConfig?.rsvpResumoConvite, selectedGuest)}
              </p>

              <div style={styles.grid}>
                <label style={styles.field}>
                  <span style={styles.label}>{safeSiteConfig?.rsvpAdultosLabel || "Quantos adultos vão?"}</span>
                  <input
                    type="number"
                    min="0"
                    max={selectedGuest.maxAdultos || 0}
                    value={adults}
                    onChange={(event) => setAdults(clamp(event.target.value, selectedGuest.maxAdultos))}
                    style={styles.input}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>{safeSiteConfig?.rsvpCriancasLabel || "Quantas crianças vão?"}</span>
                  <input
                    type="number"
                    min="0"
                    max={selectedGuest.maxCriancas || 0}
                    value={children}
                    onChange={(event) => setChildren(clamp(event.target.value, selectedGuest.maxCriancas))}
                    style={styles.input}
                  />
                </label>
              </div>

              <div style={styles.info}>
                {safeSiteConfig?.rsvpEstadoLabel || "Estado atual"}: <strong>{selectedGuest.status || "Pendente"}</strong>
              </div>

              <button type="button" onClick={confirmPresence} disabled={loading} style={styles.primaryButton}>
                {loading
                  ? "A confirmar..."
                  : selectedGuest.status === "Confirmado"
                    ? safeSiteConfig?.rsvpBotaoAtualizar || "Atualizar confirmação"
                    : safeSiteConfig?.rsvpBotaoConfirmar || "Confirmar Presença"}
              </button>
            </div>
          )}

          {status ? <div style={styles.status}>{status}</div> : null}
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: { padding: "96px 20px", background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,248,239,0.9) 100%)" },
  shell: { maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(280px, 0.9fr) minmax(320px, 1.1fr)", gap: 24 },
  aside: { padding: 42, borderRadius: 32, background: "linear-gradient(150deg, #2f2b73 0%, #181435 100%)", color: "#fffaf2", boxShadow: "0 26px 60px rgba(36,27,47,0.26)", display: "grid", gap: 20 },
  panel: { position: "relative", padding: 42, borderRadius: 32, background: "rgba(255,253,248,0.94)", border: "1px solid rgba(196,166,97,0.18)", boxShadow: "0 22px 60px rgba(36,27,47,0.08)" },
  eyebrow: { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(196,166,97,0.14)", color: "#d8bf7f", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" },
  title: { margin: "18px 0 0", fontSize: 46, lineHeight: 1.05, color: "#fffaf2" },
  subtitle: { margin: "14px 0 10px", fontSize: 30, color: "#241b2f" },
  copy: { margin: 0, fontSize: "16px", lineHeight: 1.75, color: "#5a4c67" },
  deadlineCard: { padding: 22, borderRadius: 24, background: "linear-gradient(135deg, rgba(196,166,97,0.24) 0%, rgba(255,255,255,0.08) 100%)", border: "1px solid rgba(255,247,214,0.22)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" },
  deadlineLabel: { display: "block", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#f4dfaa", marginBottom: 10 },
  deadlineDate: { display: "block", fontSize: 32, color: "#fff7d6", marginBottom: 8 },
  deadlineCopy: { margin: 0, color: "rgba(255,250,242,0.82)", lineHeight: 1.65 },
  importantCard: {
    padding: 22,
    borderRadius: 24,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,247,214,0.16)",
  },
  importantLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#f4dfaa",
    marginBottom: 12,
  },
  importantList: { margin: 0, paddingLeft: 18, display: "grid", gap: 10, color: "rgba(255,250,242,0.86)", lineHeight: 1.6 },
  importantItem: { margin: 0 },
  searchWrap: { position: "relative", marginBottom: 18 },
  input: { width: "100%", padding: "16px 18px", borderRadius: 18, border: "1px solid rgba(49,46,129,0.12)", background: "#fffefb", fontSize: 15, color: "#241b2f", outline: "none" },
  dropdown: { position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0, borderRadius: 20, background: "#fffefb", border: "1px solid rgba(196,166,97,0.16)", boxShadow: "0 24px 50px rgba(36,27,47,0.12)", zIndex: 10, overflow: "hidden" },
  dropdownItem: { display: "grid", gap: 4, width: "100%", padding: "16px 18px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", color: "#241b2f" },
  dropdownMeta: { color: "#7a6a58", fontSize: 13 },
  emptyState: { padding: 22, borderRadius: 20, background: "rgba(49,46,129,0.05)", color: "#5a4c67" },
  inviteCard: { display: "grid", gap: 18, padding: 24, borderRadius: 24, background: "linear-gradient(160deg, #fffefb 0%, #f8f1e6 100%)", border: "1px solid rgba(196,166,97,0.18)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  field: { display: "grid", gap: 8 },
  label: { fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8f7a4f" },
  info: { padding: 16, borderRadius: 18, background: "rgba(49,46,129,0.06)", color: "#4b3f5d" },
  primaryButton: { padding: "18px 22px", borderRadius: 20, border: "1px solid rgba(196,166,97,0.28)", background: "linear-gradient(135deg, #c4a661 0%, #a88642 100%)", color: "#241b2f", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" },
  status: { marginTop: 18, padding: "14px 16px", borderRadius: 18, background: "rgba(49,46,129,0.08)", color: "#312e81", fontWeight: 700 },
};

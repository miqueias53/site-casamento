import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

import { appId, auth, db } from "../firebase/firebase.js";
import { emptyImageConfig, imageFallbacks, mergeImageConfig, resolveImageSource } from "../config/siteImages.js";
import { normalizeDeliveryConfig } from "../config/deliveryConfig.js";
import { defaultSiteConfig, normalizeSiteConfig } from "../config/siteConfig.js";
import { exportRowsToPdf, exportRowsToXlsx } from "../utils/adminExport.js";

const presentesRef = () => collection(db, "artifacts", appId, "public", "data", "presentes");
const convidadosRef = () => collection(db, "artifacts", appId, "public", "data", "convidados");
const pixRef = () => doc(db, "artifacts", appId, "public", "data", "config", "pix");
const conteudoRef = () => doc(db, "artifacts", appId, "public", "data", "config", "conteudo");
const entregaRef = () => doc(db, "artifacts", appId, "public", "data", "config", "entrega");
const convitesRef = () => doc(db, "artifacts", appId, "public", "data", "config", "convites");
const tipografiaRef = () => doc(db, "artifacts", appId, "public", "data", "config", "tipografia");
const imagensRef = () => doc(db, "artifacts", appId, "public", "data", "config", "imagens");
const presenteRef = (id) => doc(db, "artifacts", appId, "public", "data", "presentes", id);
const convidadoRef = (id) => doc(db, "artifacts", appId, "public", "data", "convidados", id);

const emptyGift = { nome: "", valor: "", loja: "", linkCompra: "", imagem: "" };
const emptyGuest = { nome: "", maxAdultos: 2, maxCriancas: 0 };
const emptyPix = { chavePix: "", banco: "", titular: "", mensagem: "" };
const emptyConvites = {
  mensagemPadrao:
    "Ola [NOME]! Estamos muito felizes em partilhar este momento consigo. Aqui esta o link para o nosso site onde podera ver os detalhes e confirmar a sua presenca: [LINK]",
  urlCartaz: "",
};
const emptyEntrega = normalizeDeliveryConfig();
const fontOptions = [
  "Arial",
  "Inter",
  "Playfair Display",
  "Montserrat",
  "Lora",
  "Georgia",
  "system-ui",
  "sans-serif",
  "serif",
];
const emptyTypography = {
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
const emptyContent = normalizeSiteConfig(defaultSiteConfig);

function makeInviteId(nome) {
  const base = (nome || "convite")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);
  const suffix = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
  return `${base || "convite"}-${suffix}`;
}

function siteUrl(conviteId) {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";
  url.searchParams.set("id", conviteId);
  return url.toString();
}

function buildInviteMessage(template, guest) {
  const baseMessage = template?.mensagemPadrao?.trim() || emptyConvites.mensagemPadrao;
  const inviteLink = siteUrl(guest?.conviteId || "");
  return baseMessage.replace(/\[NOME\]/g, guest?.nome || "").replace(/\[LINK\]/g, inviteLink);
}

function mergeTypography(data) {
  return {
    titulos: { ...emptyTypography.titulos, ...(data?.titulos || {}) },
    textos: { ...emptyTypography.textos, ...(data?.textos || {}) },
    destaques: { ...emptyTypography.destaques, ...(data?.destaques || {}) },
  };
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR");
}

export default function Admin({ onBack }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("presentes");
  const [presentes, setPresentes] = useState([]);
  const [convidados, setConvidados] = useState([]);
  const [pix, setPix] = useState(emptyPix);
  const [conteudo, setConteudo] = useState(emptyContent);
  const [entrega, setEntrega] = useState(emptyEntrega);
  const [convites, setConvites] = useState(emptyConvites);
  const [tipografia, setTipografia] = useState(emptyTypography);
  const [imagens, setImagens] = useState(emptyImageConfig);
  const [giftForm, setGiftForm] = useState(emptyGift);
  const [guestForm, setGuestForm] = useState(emptyGuest);
  const [inviteGuest, setInviteGuest] = useState(null);
  const [showInviteTemplate, setShowInviteTemplate] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (value) => {
      setUser(value);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const unsubGifts = onSnapshot(presentesRef(), (snap) => {
      setPresentes(snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));
    });
    const unsubGuests = onSnapshot(convidadosRef(), (snap) => {
      setConvidados(snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => a.nome.localeCompare(b.nome, "pt")));
    });
    const unsubPix = onSnapshot(pixRef(), (snap) => setPix(snap.exists() ? { ...emptyPix, ...snap.data() } : emptyPix));
    const unsubConteudo = onSnapshot(conteudoRef(), (snap) => setConteudo(snap.exists() ? normalizeSiteConfig(snap.data()) : emptyContent));
    const unsubEntrega = onSnapshot(entregaRef(), (snap) => setEntrega(snap.exists() ? normalizeDeliveryConfig(snap.data()) : emptyEntrega));
    const unsubConvites = onSnapshot(convitesRef(), (snap) => setConvites(snap.exists() ? { ...emptyConvites, ...snap.data() } : emptyConvites));
    const unsubTipografia = onSnapshot(tipografiaRef(), (snap) => setTipografia(snap.exists() ? mergeTypography(snap.data()) : emptyTypography));
    const unsubImagens = onSnapshot(imagensRef(), (snap) => setImagens(snap.exists() ? mergeImageConfig(snap.data()) : emptyImageConfig));
    return () => { unsubGifts(); unsubGuests(); unsubPix(); unsubConteudo(); unsubEntrega(); unsubConvites(); unsubTipografia(); unsubImagens(); };
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const confirmed = convidados.filter((item) => item.status === "Confirmado" || item.confirmado === true);
    return {
      gifts: presentes.length,
      guests: convidados.length,
      confirmed: confirmed.length,
      people: confirmed.reduce((t, item) => t + Number(item.adultosConfirmados ?? item.adultos ?? 0) + Number(item.criancasConfirmadas ?? item.criancas ?? 0), 0),
    };
  }, [convidados, presentes]);

  const inviteLink = inviteGuest?.conviteId ? siteUrl(inviteGuest.conviteId) : "";
  const invitePreview = inviteGuest ? buildInviteMessage(convites, inviteGuest) : "";
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copyInviteText = async () => {
    if (!invitePreview) return;

    try {
      await navigator.clipboard.writeText(invitePreview);
      setToast("Texto do convite copiado.");
    } catch (error) {
      console.error(error);
      setToast("Nao foi possivel copiar o texto do convite.");
    }
  };

  const fetchPosterAsset = async () => {
    if (!convites?.urlCartaz) return null;

    const response = await fetch(convites.urlCartaz);
    if (!response.ok) {
      throw new Error("Nao foi possivel obter a imagem do cartaz.");
    }

    const blob = await response.blob();
    const extension = blob.type?.split("/")[1]?.split("+")[0] || "jpg";
    const safeName = (inviteGuest?.nome || "convite")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return new File([blob], `${safeName || "convite-vip"}.${extension}`, {
      type: blob.type || "image/jpeg",
    });
  };

  const downloadPosterImage = async () => {
    if (!convites?.urlCartaz) {
      setToast("Nao existe imagem configurada para este convite.");
      return;
    }

    try {
      const file = await fetchPosterAsset();
      if (!file) {
        setToast("Nao existe imagem configurada para este convite.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setToast("Imagem do cartaz descarregada.");
    } catch (error) {
      console.error(error);
      window.open(convites.urlCartaz, "_blank", "noopener,noreferrer");
      setToast("Abrimos a imagem em nova aba para facilitar o download.");
    }
  };

  const shareInvite = async () => {
    if (!inviteGuest || !invitePreview) return;
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setToast("Partilha direta indisponivel neste dispositivo.");
      return;
    }

    setShareBusy(true);

    try {
      const shareData = {
        title: `Convite VIP - ${inviteGuest.nome}`,
        text: invitePreview,
      };

      if (convites?.urlCartaz && typeof navigator.canShare === "function") {
        try {
          const file = await fetchPosterAsset();
          if (file && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (error) {
          console.error(error);
        }
      }

      await navigator.share(shareData);
      setToast("Convite partilhado com sucesso.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        setToast("Nao foi possivel concluir a partilha neste dispositivo.");
      }
    } finally {
      setShareBusy(false);
    }
  };

  const onSaveGift = async (event) => {
    event.preventDefault();
    try {
      await addDoc(presentesRef(), { ...giftForm, lojaNome: giftForm.loja.trim(), reservado: false, reservadoPor: null, dataCriacao: new Date().toISOString() });
      setGiftForm(emptyGift);
      setToast("Presente adicionado ao catálogo.");
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível guardar o presente.");
    }
  };

  const onSaveGuest = async (event) => {
    event.preventDefault();
    try {
      await addDoc(convidadosRef(), {
        nome: guestForm.nome.trim(),
        conviteId: makeInviteId(guestForm.nome),
        maxAdultos: Number(guestForm.maxAdultos) || 0,
        maxCriancas: Number(guestForm.maxCriancas) || 0,
        adultosConfirmados: 0,
        criancasConfirmadas: 0,
        status: "Pendente",
        dataCriacao: new Date().toISOString(),
      });
      setGuestForm(emptyGuest);
      setToast("Convidado adicionado a lista fechada.");
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel guardar o convidado.");
    }
  };

  const onSavePix = async (event) => {
    event.preventDefault();
    try {
      await setDoc(pixRef(), { ...pix, ultimaAtualizacao: new Date().toISOString() }, { merge: true });
      setToast("Configuração PIX atualizada.");
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível guardar o PIX.");
    }
  };

  const onSaveContent = async (event) => {
    event.preventDefault();
    try {
      await setDoc(conteudoRef(), { ...conteudo, ultimaAtualizacao: new Date().toISOString() }, { merge: true });
      setToast("Aparencia e conteudo atualizados.");
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel guardar a aparencia do site.");
    }
  };

  const onSaveEntrega = async (event) => {
    event.preventDefault();
    try {
      await setDoc(entregaRef(), { ...entrega, ultimaAtualizacao: new Date().toISOString() }, { merge: true });
      setToast("Modal de entrega atualizado.");
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel guardar o modal de entrega.");
    }
  };

  const onSaveConvites = async (event) => {
    event.preventDefault();
    try {
      await setDoc(convitesRef(), { ...convites, ultimaAtualizacao: new Date().toISOString() }, { merge: true });
      setToast("Template do convite atualizado.");
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel guardar o template do convite.");
    }
  };

  const onSaveTipografia = async (event) => {
    event.preventDefault();
    try {
      await setDoc(tipografiaRef(), { ...tipografia, ultimaAtualizacao: new Date().toISOString() }, { merge: true });
      setToast("Sistema tipografico atualizado.");
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel guardar a tipografia global.");
    }
  };

  const onSaveImagens = async (event) => {
    event.preventDefault();
    try {
      await setDoc(imagensRef(), { ...imagens, ultimaAtualizacao: new Date().toISOString() }, { merge: true });
      setToast("Biblioteca de imagens atualizada.");
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel guardar a configuracao de imagens.");
    }
  };

  const removeGift = async (id) => {
    if (!window.confirm("Deseja remover este presente?")) return;
    try {
      await deleteDoc(presenteRef(id));
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível remover o presente.");
    }
  };

  const removeGuest = async (id) => {
    if (!window.confirm("Deseja remover este convidado?")) return;
    try {
      await deleteDoc(convidadoRef(id));
      if (inviteGuest?.id === id) setInviteGuest(null);
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível remover o convidado.");
    }
  };

  const openInvite = async (guest) => {
    if (guest.conviteId) {
      setInviteGuest(guest);
      return;
    }
    const conviteId = makeInviteId(guest.nome);
    await updateDoc(convidadoRef(guest.id), { conviteId, ultimaAtualizacao: new Date().toISOString() });
    setInviteGuest({ ...guest, conviteId });
  };

  const updateTypographyField = (group, field, value) => {
    setTipografia((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value,
      },
    }));
  };

  const updateContentField = (field, value) => {
    setConteudo((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateEntregaField = (field, value) => {
    setEntrega((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateImageField = (field, value) => {
    setImagens((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const exportPresentesAsXlsx = () => {
    const rows = presentes.map((item) => ({
      Presente: item.nome || "",
      Loja: item.loja || item.lojaNome || "",
      Valor: item.valor || "",
      Estado: item.reservado ? "Reservado" : "Disponivel",
      "Reservado por": item.reservadoPor || "",
      "Link da loja": item.linkCompra || "",
      "Data de criacao": formatDateTime(item.dataCriacao),
    }));

    exportRowsToXlsx({
      baseName: "presentes",
      sheetName: "Presentes",
      rows,
    });
    setToast("Lista de presentes exportada em Excel.");
  };

  const exportPresentesAsPdf = () => {
    const body = presentes.map((item) => ([
      item.nome || "-",
      item.loja || item.lojaNome || "-",
      item.valor || "-",
      item.reservado ? "Reservado" : "Disponivel",
      item.reservadoPor || "-",
    ]));

    exportRowsToPdf({
      baseName: "presentes",
      title: "Lista de Presentes",
      head: [["Presente", "Loja", "Valor", "Estado", "Reservado por"]],
      body,
    });
    setToast("Lista de presentes exportada em PDF.");
  };

  const exportConvidadosAsXlsx = () => {
    const rows = convidados.map((item) => ({
      Convidado: item.nome || "",
      "Convite ID": item.conviteId || "",
      "Max. adultos": Number(item.maxAdultos || 0),
      "Max. criancas": Number(item.maxCriancas || 0),
      "Adultos confirmados": Number(item.adultosConfirmados || 0),
      "Criancas confirmadas": Number(item.criancasConfirmadas || 0),
      Status: item.status || "Pendente",
      "Data de criacao": formatDateTime(item.dataCriacao),
      "Data de resposta": formatDateTime(item.dataResposta),
    }));

    exportRowsToXlsx({
      baseName: "convidados",
      sheetName: "Convidados",
      rows,
    });
    setToast("Lista de convidados exportada em Excel.");
  };

  const exportConvidadosAsPdf = () => {
    const body = convidados.map((item) => ([
      item.nome || "-",
      item.conviteId || "-",
      `${item.maxAdultos || 0}A / ${item.maxCriancas || 0}C`,
      `${item.adultosConfirmados || 0}A / ${item.criancasConfirmadas || 0}C`,
      item.status || "Pendente",
    ]));

    exportRowsToPdf({
      baseName: "convidados",
      title: "Lista de Convidados",
      head: [["Convidado", "Convite ID", "Lotacao", "Confirmados", "Status"]],
      body,
    });
    setToast("Lista de convidados exportada em PDF.");
  };

  const adminTabs = [
    { key: "presentes", label: "Presentes" },
    { key: "convidados", label: "Convidados" },
    { key: "pix", label: "PIX" },
    { key: "aparencia", label: "Aparencia" },
    { key: "cores-site", label: "Cores do Site" },
    { key: "midia", label: "Midia e Imagens" },
    { key: "tipografia", label: "Tipografia Profissional" },
  ];

  if (loadingAuth) return <div style={styles.screen}>A validar acesso...</div>;

  if (!user) {
    return (
      <div style={styles.screen}>
        <div style={styles.authCard}>
          <span style={styles.eyebrow}>Dashboard privado</span>
          <h1 style={styles.title}>Comando Central</h1>
          <form onSubmit={async (event) => {
            event.preventDefault();
            setLoadingAuth(true);
            try {
              await signInWithEmailAndPassword(auth, event.target.email.value, event.target.password.value);
            } catch (error) {
              console.error(error);
              setLoadingAuth(false);
              window.alert("Credenciais inválidas.");
            }
          }} style={styles.form}>
            <input name="email" type="email" placeholder="E-mail" style={styles.input} />
            <input name="password" type="password" placeholder="Senha" style={styles.input} />
            <button type="submit" style={styles.primaryButton}>Entrar</button>
          </form>
          <button type="button" onClick={onBack} style={styles.linkButton}>Voltar ao site</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div>
          <span style={styles.eyebrow}>Luxury dashboard</span>
          <h1 style={styles.title}>Gestão Manual do Casamento</h1>
        </div>
        <div style={styles.row}>
          <button type="button" onClick={onBack} style={styles.secondaryButton}>Ver site</button>
          <button type="button" onClick={() => signOut(auth)} style={styles.dangerButton}>Terminar sessão</button>
        </div>
      </header>

      <main style={styles.content}>
        <section style={styles.metrics}>
          <Metric label="Presentes" value={stats.gifts} />
          <Metric label="Convidados" value={stats.guests} />
          <Metric label="Confirmados" value={stats.confirmed} />
          <Metric label="Pessoas" value={stats.people} />
        </section>

        <section style={styles.card}>
          <div style={styles.tabs}>
            {adminTabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={activeTab === tab.key ? styles.tabActive : styles.tab}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "presentes" && (
            <div style={styles.split}>
              <div style={styles.panel}>
                <span style={styles.eyebrow}>Catálogo premium</span>
                <h2 style={styles.subtitle}>Adicionar presente manual</h2>
                <form onSubmit={onSaveGift} style={styles.form}>
                  <input value={giftForm.nome} onChange={(e) => setGiftForm({ ...giftForm, nome: e.target.value })} placeholder="Nome do Presente" style={styles.input} required />
                  <input value={giftForm.valor} onChange={(e) => setGiftForm({ ...giftForm, valor: e.target.value })} placeholder="Valor (€ ou R$)" style={styles.input} required />
                  <input value={giftForm.loja} onChange={(e) => setGiftForm({ ...giftForm, loja: e.target.value })} placeholder="Loja" style={styles.input} required />
                  <input value={giftForm.linkCompra} onChange={(e) => setGiftForm({ ...giftForm, linkCompra: e.target.value })} placeholder="Link de Compra" style={styles.input} />
                  <input value={giftForm.imagem} onChange={(e) => setGiftForm({ ...giftForm, imagem: e.target.value })} placeholder="URL da Imagem" style={styles.input} />
                  <button type="submit" style={styles.primaryButton}>Guardar presente</button>
                </form>
              </div>

              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <span style={styles.eyebrow}>Lista</span>
                    <h2 style={styles.subtitle}>Presentes registados</h2>
                  </div>
                  <div style={styles.row}>
                    <button type="button" onClick={exportPresentesAsXlsx} style={styles.secondaryButton}>Exportar XLSX</button>
                    <button type="button" onClick={exportPresentesAsPdf} style={styles.secondaryButton}>Exportar PDF</button>
                  </div>
                </div>
                <Table headers={["Presente", "Loja", "Valor", "Estado", "Ação"]}>
                  {presentes.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>{item.nome}</td>
                      <td style={styles.td}>{item.loja || item.lojaNome || "Manual"}</td>
                      <td style={styles.td}>{item.valor || "Sem valor"}</td>
                      <td style={styles.td}>{item.reservado ? `Reservado por ${item.reservadoPor || "convidado"}` : "Disponível"}</td>
                      <td style={styles.td}><button type="button" onClick={() => removeGift(item.id)} style={styles.action}>Remover</button></td>
                    </tr>
                  ))}
                </Table>
              </div>
            </div>
          )}

          {activeTab === "convidados" && (
            <div style={styles.split}>
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <span style={styles.eyebrow}>Lista fechada</span>
                    <h2 style={styles.subtitle}>Cadastrar convidado</h2>
                  </div>
                  <button type="button" onClick={() => setShowInviteTemplate((value) => !value)} style={styles.secondaryButton}>
                    Configurar Template do Convite
                  </button>
                </div>

                <form onSubmit={onSaveGuest} style={styles.form}>
                  <input value={guestForm.nome} onChange={(e) => setGuestForm({ ...guestForm, nome: e.target.value })} placeholder="Nome do Convidado" style={styles.input} required />
                  <input type="number" min="0" value={guestForm.maxAdultos} onChange={(e) => setGuestForm({ ...guestForm, maxAdultos: e.target.value })} placeholder="Lotacao Maxima de Adultos" style={styles.input} required />
                  <input type="number" min="0" value={guestForm.maxCriancas} onChange={(e) => setGuestForm({ ...guestForm, maxCriancas: e.target.value })} placeholder="Lotacao Maxima de Criancas" style={styles.input} required />
                  <div style={styles.info}>Status inicial: <strong>Pendente</strong></div>
                  <button type="submit" style={styles.primaryButton}>Guardar convidado</button>
                </form>

                {showInviteTemplate ? (
                  <div style={styles.templateCard}>
                    <span style={styles.eyebrow}>Template VIP</span>
                    <h3 style={styles.templateTitle}>Configurar Template do Convite</h3>
                    <form onSubmit={onSaveConvites} style={styles.form}>
                      <textarea value={convites.mensagemPadrao} onChange={(e) => setConvites({ ...convites, mensagemPadrao: e.target.value })} placeholder="Mensagem padrao com [NOME] e [LINK]" style={styles.textarea} />
                      <input value={convites.urlCartaz} onChange={(e) => setConvites({ ...convites, urlCartaz: e.target.value })} placeholder="URL do cartaz" style={styles.input} />
                      <div style={styles.info}>Utilize as tags dinamicas <strong>[NOME]</strong> e <strong>[LINK]</strong> para personalizar a mensagem de cada convidado.</div>
                      <button type="submit" style={styles.primaryButton}>Guardar template</button>
                    </form>
                  </div>
                ) : null}
              </div>

              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <span style={styles.eyebrow}>Convites</span>
                    <h2 style={styles.subtitle}>Convidados cadastrados</h2>
                  </div>
                  <div style={styles.row}>
                    <button type="button" onClick={exportConvidadosAsXlsx} style={styles.secondaryButton}>Exportar XLSX</button>
                    <button type="button" onClick={exportConvidadosAsPdf} style={styles.secondaryButton}>Exportar PDF</button>
                  </div>
                </div>
                <Table headers={["Convidado", "Convite ID", "Lotacao", "Status", "Gerar", "Acao"]}>
                  {convidados.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>{item.nome}</td>
                      <td style={styles.td}>{item.conviteId || "A gerar..."}</td>
                      <td style={styles.td}>{item.maxAdultos || 0}A / {item.maxCriancas || 0}C</td>
                      <td style={styles.td}><span style={item.status === "Confirmado" ? styles.badgeActive : styles.badge}>{item.status || "Pendente"}</span></td>
                      <td style={styles.td}><button type="button" onClick={() => openInvite(item)} style={styles.action}>Gerar Convite</button></td>
                      <td style={styles.td}><button type="button" onClick={() => removeGuest(item.id)} style={styles.action}>Remover</button></td>
                    </tr>
                  ))}
                </Table>
              </div>
            </div>
          )}

          {activeTab === "pix" && (
            <div style={styles.panel}>
              <span style={styles.eyebrow}>Contribuições</span>
              <h2 style={styles.subtitle}>Motor PIX</h2>
              <form onSubmit={onSavePix} style={styles.form}>
                <input value={pix.chavePix} onChange={(e) => setPix({ ...pix, chavePix: e.target.value })} placeholder="Chave PIX" style={styles.input} />
                <input value={pix.banco} onChange={(e) => setPix({ ...pix, banco: e.target.value })} placeholder="Banco" style={styles.input} />
                <input value={pix.titular} onChange={(e) => setPix({ ...pix, titular: e.target.value })} placeholder="Titular" style={styles.input} />
                <textarea value={pix.mensagem} onChange={(e) => setPix({ ...pix, mensagem: e.target.value })} placeholder="Mensagem Pública" style={styles.textarea} />
                <button type="submit" style={styles.primaryButton}>Guardar PIX</button>
              </form>
            </div>
          )}

          {activeTab === "aparencia-legacy" && (
            <div style={styles.split}>
              <div style={styles.panel}>
                <span style={styles.eyebrow}>Tipografia</span>
                <h2 style={styles.subtitle}>Aparência global</h2>
                <form onSubmit={onSaveContent} style={styles.form}>
                  <div style={styles.info}>Títulos Principais</div>
                  <input value={conteudo.titulosFontFamily} onChange={(e) => setConteudo({ ...conteudo, titulosFontFamily: e.target.value })} placeholder="Font-Family dos títulos" style={styles.input} />
                  <input value={conteudo.titulosFontSize} onChange={(e) => setConteudo({ ...conteudo, titulosFontSize: e.target.value })} placeholder="Font-Size dos títulos" style={styles.input} />
                  <input value={conteudo.titulosFontWeight} onChange={(e) => setConteudo({ ...conteudo, titulosFontWeight: e.target.value })} placeholder="Font-Weight dos títulos" style={styles.input} />

                  <div style={styles.info}>Textos Gerais</div>
                  <input value={conteudo.textosFontFamily} onChange={(e) => setConteudo({ ...conteudo, textosFontFamily: e.target.value })} placeholder="Font-Family dos textos" style={styles.input} />
                  <input value={conteudo.textosFontSize} onChange={(e) => setConteudo({ ...conteudo, textosFontSize: e.target.value })} placeholder="Font-Size dos textos" style={styles.input} />
                  <input value={conteudo.textosFontWeight} onChange={(e) => setConteudo({ ...conteudo, textosFontWeight: e.target.value })} placeholder="Font-Weight dos textos" style={styles.input} />

                  <div style={styles.info}>Data do Casamento</div>
                  <input value={conteudo.dataFontFamily} onChange={(e) => setConteudo({ ...conteudo, dataFontFamily: e.target.value })} placeholder="Font-Family da data" style={styles.input} />
                  <input value={conteudo.dataFontSize} onChange={(e) => setConteudo({ ...conteudo, dataFontSize: e.target.value })} placeholder="Font-Size da data" style={styles.input} />
                  <input value={conteudo.dataFontWeight} onChange={(e) => setConteudo({ ...conteudo, dataFontWeight: e.target.value })} placeholder="Font-Weight da data" style={styles.input} />

                  <button type="submit" style={styles.primaryButton}>Guardar aparência</button>
                </form>
              </div>

              <div style={styles.panel}>
                <span style={styles.eyebrow}>Conteúdo</span>
                <h2 style={styles.subtitle}>Textos e imagens do site</h2>
                <form onSubmit={onSaveContent} style={styles.form}>
                  <input value={conteudo.rsvpTitulo} onChange={(e) => setConteudo({ ...conteudo, rsvpTitulo: e.target.value })} placeholder="Título do RSVP" style={styles.input} />
                  <input value={conteudo.historiaTitulo} onChange={(e) => setConteudo({ ...conteudo, historiaTitulo: e.target.value })} placeholder="Título da História" style={styles.input} />
                  <textarea value={conteudo.historiaDescricao} onChange={(e) => setConteudo({ ...conteudo, historiaDescricao: e.target.value })} placeholder="Descrição da História" style={styles.textarea} />

                  <input value={conteudo.historiaCard1Titulo} onChange={(e) => setConteudo({ ...conteudo, historiaCard1Titulo: e.target.value })} placeholder="História 1 - título" style={styles.input} />
                  <textarea value={conteudo.historiaCard1Texto} onChange={(e) => setConteudo({ ...conteudo, historiaCard1Texto: e.target.value })} placeholder="História 1 - texto" style={styles.textarea} />
                  <input value={conteudo.historiaCard1Imagem} onChange={(e) => setConteudo({ ...conteudo, historiaCard1Imagem: e.target.value })} placeholder="História 1 - imagem URL" style={styles.input} />

                  <input value={conteudo.historiaCard2Titulo} onChange={(e) => setConteudo({ ...conteudo, historiaCard2Titulo: e.target.value })} placeholder="História 2 - título" style={styles.input} />
                  <textarea value={conteudo.historiaCard2Texto} onChange={(e) => setConteudo({ ...conteudo, historiaCard2Texto: e.target.value })} placeholder="História 2 - texto" style={styles.textarea} />
                  <input value={conteudo.historiaCard2Imagem} onChange={(e) => setConteudo({ ...conteudo, historiaCard2Imagem: e.target.value })} placeholder="História 2 - imagem URL" style={styles.input} />

                  <input value={conteudo.historiaCard3Titulo} onChange={(e) => setConteudo({ ...conteudo, historiaCard3Titulo: e.target.value })} placeholder="História 3 - título" style={styles.input} />
                  <textarea value={conteudo.historiaCard3Texto} onChange={(e) => setConteudo({ ...conteudo, historiaCard3Texto: e.target.value })} placeholder="História 3 - texto" style={styles.textarea} />
                  <input value={conteudo.historiaCard3Imagem} onChange={(e) => setConteudo({ ...conteudo, historiaCard3Imagem: e.target.value })} placeholder="História 3 - imagem URL" style={styles.input} />

                  <input value={conteudo.galeriaImagem1} onChange={(e) => setConteudo({ ...conteudo, galeriaImagem1: e.target.value })} placeholder="Galeria - imagem 1 URL" style={styles.input} />
                  <input value={conteudo.galeriaImagem2} onChange={(e) => setConteudo({ ...conteudo, galeriaImagem2: e.target.value })} placeholder="Galeria - imagem 2 URL" style={styles.input} />
                  <input value={conteudo.galeriaImagem3} onChange={(e) => setConteudo({ ...conteudo, galeriaImagem3: e.target.value })} placeholder="Galeria - imagem 3 URL" style={styles.input} />

                  <div style={styles.info}>Local da Cerimonia</div>
                  <input value={conteudo.localNome} onChange={(e) => setConteudo({ ...conteudo, localNome: e.target.value })} placeholder="Nome do local" style={styles.input} />
                  <textarea value={conteudo.localEndereco} onChange={(e) => setConteudo({ ...conteudo, localEndereco: e.target.value })} placeholder="Endereco completo" style={styles.textarea} />
                  <input value={conteudo.localMapsLink} onChange={(e) => setConteudo({ ...conteudo, localMapsLink: e.target.value })} placeholder="Link do Google Maps" style={styles.input} />

                  <input value={conteudo.versiculoTexto} onChange={(e) => setConteudo({ ...conteudo, versiculoTexto: e.target.value })} placeholder="Versículo / rodapé" style={styles.input} />
                  <input value={conteudo.versiculoFontSize} onChange={(e) => setConteudo({ ...conteudo, versiculoFontSize: e.target.value })} placeholder="Tamanho da fonte do versículo" style={styles.input} />
                  <input value={conteudo.versiculoColor} onChange={(e) => setConteudo({ ...conteudo, versiculoColor: e.target.value })} placeholder="Cor do versículo" style={styles.input} />

                  <button type="submit" style={styles.primaryButton}>Guardar conteúdo</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "aparencia" && (
            <ContentCmsTab
              conteudo={conteudo}
              entrega={entrega}
              onContentChange={updateContentField}
              onEntregaChange={updateEntregaField}
              onSaveContent={onSaveContent}
              onSaveEntrega={onSaveEntrega}
            />
          )}

          {activeTab === "cores-site" && (
            <SiteColorsTab
              conteudo={conteudo}
              onContentChange={updateContentField}
              onSaveContent={onSaveContent}
            />
          )}

          {activeTab === "midia" && (
            <MediaImagesTab
              imagens={imagens}
              conteudo={conteudo}
              onFieldChange={updateImageField}
              onSave={onSaveImagens}
            />
          )}

          {activeTab === "tipografia" && (
            <TypographyProfessionalTab
              tipografia={tipografia}
              onFieldChange={updateTypographyField}
              onSave={onSaveTipografia}
            />
          )}
        </section>
      </main>

      {toast ? <div style={styles.toast}>{toast}</div> : null}

      {inviteGuest ? (
        <div style={styles.modalBackdrop}>
          <div className="max-h-[90vh] overflow-y-auto" style={styles.inviteCard}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.eyebrow}>Convite VIP</span>
                <h2 style={styles.subtitle}>{inviteGuest.nome}</h2>
              </div>
              <button type="button" onClick={() => setInviteGuest(null)} style={styles.linkButton}>Fechar</button>
            </div>
            <p style={styles.copy}>Este convite contempla ate {inviteGuest.maxAdultos || 0} adultos e {inviteGuest.maxCriancas || 0} criancas.</p>
            {convites.urlCartaz ? <img src={convites.urlCartaz} alt="Cartaz do convite" loading="lazy" style={styles.posterPreview} /> : null}
            <div style={styles.info}>ID do convite: <strong>{inviteGuest.conviteId}</strong></div>
            <div style={styles.info}>Link unico: <strong>{inviteLink}</strong></div>
            <div style={styles.previewWrap}>
              <div style={styles.previewLabel}>Preview da mensagem</div>
              <div style={styles.previewBox}>{invitePreview}</div>
            </div>
            <div style={styles.note}>
              Dica: Se a imagem nao carregar automaticamente no WhatsApp, clique em "Baixar Imagem" e anexe-a manualmente para garantir a alta qualidade.
            </div>

            {canNativeShare ? (
              <button type="button" onClick={shareInvite} disabled={shareBusy} style={styles.shareButton}>
                {shareBusy ? "A partilhar..." : "Partilhar no dispositivo"}
              </button>
            ) : null}

            <div style={styles.modalActions}>
              <button type="button" onClick={copyInviteText} style={styles.secondaryButton}>
                Copiar Texto
              </button>
              <button type="button" onClick={downloadPosterImage} style={styles.secondaryButton}>
                Baixar Imagem
              </button>
            </div>

            <button type="button" onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(invitePreview), "_blank", "noopener,noreferrer")} style={styles.whatsappButton}>
              Enviar pelo WhatsApp
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }) {
  return <article style={styles.metric}><span style={styles.metricLabel}>{label}</span><strong style={styles.metricValue}>{value}</strong></article>;
}

function Table({ headers, children }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead><tr>{headers.map((head) => <th key={head} style={styles.th}>{head}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const cmsSectionGroups = [
  {
    key: "toggles",
    eyebrow: "Feature Toggles",
    title: "Visibilidade do site",
    description: "Ligue ou desligue secoes inteiras sem remover codigo nem mexer no deploy.",
    fields: [
      { key: "mostrarHero", label: "Mostrar Hero", type: "checkbox" },
      { key: "mostrarContagem", label: "Mostrar Contagem", type: "checkbox" },
      { key: "mostrarHistoria", label: "Mostrar Historia", type: "checkbox" },
      { key: "mostrarLocal", label: "Mostrar Local", type: "checkbox" },
      { key: "mostrarRSVP", label: "Mostrar RSVP", type: "checkbox" },
      { key: "mostrarPresentes", label: "Mostrar Presentes", type: "checkbox" },
      { key: "mostrarBlocoExtra", label: "Mostrar Bloco Extra", type: "checkbox" },
      { key: "mostrarGaleriaPos", label: "Mostrar Galeria Pos-Casamento", type: "checkbox" },
    ],
  },
  {
    key: "hero",
    eyebrow: "Hero",
    title: "Topo e assinatura do site",
    description: "Controla a primeira impressao, a data principal e o rodape editorial.",
    fields: [
      { key: "heroTitulo", label: "Titulo do hero", placeholder: "Miqueias & Maria Eduarda" },
      { key: "heroData", label: "Data principal", placeholder: "11 de julho de 2026" },
      { key: "heroTituloFontSize", label: "Tamanho do titulo do hero", placeholder: "70px" },
      { key: "versiculoTexto", label: "Versiculo do rodape", placeholder: "Isaías 41:20" },
      { key: "versiculoFontSize", label: "Tamanho do versiculo", placeholder: "13px" },
      { key: "versiculoColor", label: "Cor do versiculo", type: "color" },
    ],
  },
  {
    key: "historia",
    eyebrow: "Historia",
    title: "Storytelling e cards",
    description: "Todos os titulos, textos e a cor de fundo dos cards da historia ficam geridos aqui.",
    fields: [
      { key: "historiaTitulo", label: "Titulo da secao" },
      { key: "historiaDescricao", label: "Descricao da secao", type: "textarea" },
      { key: "historiaCardBackgroundColor", label: "Cor de fundo dos cards", placeholder: "#fffaf2 ou rgba(...)" },
      { key: "historiaCard1Titulo", label: "Card 1 - titulo" },
      { key: "historiaCard1Texto", label: "Card 1 - texto", type: "textarea" },
      { key: "historiaCard2Titulo", label: "Card 2 - titulo" },
      { key: "historiaCard2Texto", label: "Card 2 - texto", type: "textarea" },
      { key: "historiaCard3Titulo", label: "Card 3 - titulo" },
      { key: "historiaCard3Texto", label: "Card 3 - texto", type: "textarea" },
    ],
  },
  {
    key: "local",
    eyebrow: "Local",
    title: "Cerimonia e mapa",
    description: "Tambem inclui a cor de fundo do quadro principal do local.",
    fields: [
      { key: "localTitulo", label: "Titulo da secao" },
      { key: "localData", label: "Data exibida" },
      { key: "localHora", label: "Hora exibida" },
      { key: "localNome", label: "Nome do local" },
      { key: "localEndereco", label: "Endereco completo", type: "textarea" },
      { key: "localMapsLink", label: "Link do Google Maps" },
      { key: "localMapsButtonLabel", label: "Texto do botao do mapa" },
      { key: "localCardBackgroundColor", label: "Cor de fundo do quadro", placeholder: "rgba(255,255,255,0.08)" },
    ],
  },
  {
    key: "rsvp",
    eyebrow: "RSVP",
    title: "Convite e confirmacao",
    description: "Todos os textos visiveis da experiencia de RSVP ficam configuraveis aqui.",
    fields: [
      { key: "rsvpEyebrow", label: "Eyebrow da secao" },
      { key: "rsvpTitulo", label: "Titulo do RSVP" },
      { key: "rsvpDescricao", label: "Descricao principal", type: "textarea" },
      { key: "rsvpPrazoLabel", label: "Rotulo da data limite" },
      { key: "rsvpPrazoData", label: "Data limite" },
      { key: "rsvpPrazoTexto", label: "Texto de apoio da data limite", type: "textarea" },
      { key: "rsvpInformacoesTitulo", label: "Titulo das informacoes importantes" },
      { key: "rsvpInformacao1", label: "Informacao 1" },
      { key: "rsvpInformacao2", label: "Informacao 2" },
      { key: "rsvpInformacao3", label: "Informacao 3" },
      { key: "rsvpBuscaPlaceholder", label: "Placeholder da busca" },
      { key: "rsvpBuscaInstrucao", label: "Mensagem inicial da busca", type: "textarea" },
      { key: "rsvpBuscaSemResultados", label: "Mensagem sem resultados", type: "textarea" },
      { key: "rsvpStatusConviteEncontrado", label: "Status: convite localizado" },
      { key: "rsvpStatusSelecionePresenca", label: "Status: validar selecao" },
      { key: "rsvpStatusSucesso", label: "Status: sucesso" },
      { key: "rsvpStatusErro", label: "Status: erro" },
      { key: "rsvpConviteEyebrow", label: "Eyebrow do convite aberto" },
      { key: "rsvpSaudacaoPrefixo", label: "Prefixo da saudacao" },
      { key: "rsvpResumoConvite", label: "Resumo do convite ([ADULTOS] / [CRIANCAS])", type: "textarea" },
      { key: "rsvpAdultosLabel", label: "Rotulo adultos" },
      { key: "rsvpCriancasLabel", label: "Rotulo criancas" },
      { key: "rsvpEstadoLabel", label: "Rotulo do estado atual" },
      { key: "rsvpBotaoConfirmar", label: "Botao confirmar" },
      { key: "rsvpBotaoAtualizar", label: "Botao atualizar" },
    ],
  },
  {
    key: "presentes",
    eyebrow: "Presentes",
    title: "Secao de presentes",
    description: "Textos, labels do grid e CTA principal da lista de presentes.",
    fields: [
      { key: "presentesEyebrow", label: "Eyebrow da secao" },
      { key: "presentesTitulo", label: "Titulo da secao" },
      { key: "presentesDescricao", label: "Descricao da secao", type: "textarea" },
      { key: "presentesPixEyebrow", label: "Eyebrow do PIX" },
      { key: "presentesPixTitulo", label: "Titulo do card PIX" },
      { key: "presentesLoadingTexto", label: "Texto de carregamento" },
      { key: "presentesVazioTexto", label: "Texto sem presentes", type: "textarea" },
      { key: "presentesBotaoComprar", label: "CTA comprar presente" },
      { key: "presentesBotaoIndisponivel", label: "CTA indisponivel" },
    ],
  },
  {
    key: "extra",
    eyebrow: "Pos-Casamento",
    title: "Bloco extra e galeria",
    description: "Estrutura editorial para o periodo depois do casamento sem virar um website builder.",
    fields: [
      { key: "blocoExtraEyebrow", label: "Eyebrow do bloco extra" },
      { key: "blocoExtraTitulo", label: "Titulo do bloco extra" },
      { key: "blocoExtraTexto", label: "Texto do bloco extra", type: "textarea" },
      { key: "galeriaPosEyebrow", label: "Eyebrow da galeria" },
      { key: "galeriaPosTitulo", label: "Titulo da galeria" },
      { key: "galeriaPosDescricao", label: "Descricao da galeria", type: "textarea" },
    ],
  },
];

function ContentCmsTab({ conteudo, entrega, onContentChange, onEntregaChange, onSaveContent, onSaveEntrega }) {
  return (
    <div className="grid gap-6">
      <form onSubmit={onSaveContent} className="grid gap-6">
        <section className="rounded-[32px] border border-amber-200/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-700">
                CMS Headless
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Conteudo e Feature Toggles</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Toda a camada editorial do site, incluindo blocos condicionais e o pos-casamento, passa a ser controlada por configuracao.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-950 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-indigo-950/25 transition hover:-translate-y-0.5 hover:bg-indigo-900"
            >
              Guardar Conteudo
            </button>
          </div>
        </section>

        {cmsSectionGroups.map((section) => (
          <CmsSectionCard
            key={section.key}
            section={section}
            values={conteudo}
            onChange={onContentChange}
          />
        ))}
      </form>

      <form onSubmit={onSaveEntrega} className="grid gap-6">
        <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-700">
                Config / entrega
              </span>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Modal de Entrega da Loja</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Este bloco intercepta o clique em comprar presente para orientar o convidado antes de abrir a loja.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-amber-600/20 transition hover:-translate-y-0.5 hover:bg-amber-500"
            >
              Guardar Modal
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <CmsField
              field={{ key: "titulo", label: "Titulo do modal" }}
              value={entrega?.titulo}
              onChange={(value) => onEntregaChange("titulo", value)}
            />
            <CmsField
              field={{ key: "botaoContinuar", label: "Texto do botao continuar" }}
              value={entrega?.botaoContinuar}
              onChange={(value) => onEntregaChange("botaoContinuar", value)}
            />
            <CmsField
              field={{ key: "mensagem", label: "Mensagem do modal", type: "textarea" }}
              value={entrega?.mensagem}
              onChange={(value) => onEntregaChange("mensagem", value)}
            />
            <CmsField
              field={{ key: "endereco", label: "Endereco de entrega", type: "textarea" }}
              value={entrega?.endereco}
              onChange={(value) => onEntregaChange("endereco", value)}
            />
            <CmsField
              field={{ key: "botaoCancelar", label: "Texto do botao cancelar" }}
              value={entrega?.botaoCancelar}
              onChange={(value) => onEntregaChange("botaoCancelar", value)}
            />
          </div>
        </section>
      </form>
    </div>
  );
}

const siteColorFields = [
  { key: "corFundoGlobal", label: "Fundo global da pagina", fallback: "#fffdf8" },
  { key: "corFundoRSVP", label: "Fundo do quadro principal do RSVP", fallback: "linear-gradient(150deg, #2f2b73 0%, #181435 100%)", colorFallback: "#2f2b73" },
  { key: "corFundoLocalArea", label: "Fundo da area externa do Local", fallback: "#0b1b3a" },
  { key: "corFundoContagemArea", label: "Fundo da area externa da Contagem", fallback: "#fafafa" },
  { key: "corFundoContagemCards", label: "Fundo dos cards de Dias / Horas / Min / Seg", fallback: "#fff" },
  { key: "corFundoPix", label: "Fundo do quadro da chave PIX", fallback: "linear-gradient(140deg, rgba(49,46,129,0.98) 0%, rgba(32,28,88,0.96) 55%, rgba(196,166,97,0.18) 100%)", colorFallback: "#312e81" },
  { key: "corFundoFooter", label: "Fundo geral do rodape", fallback: "#241b2f" },
];

function SiteColorsTab({ conteudo, onContentChange, onSaveContent }) {
  return (
    <form onSubmit={onSaveContent} className="grid gap-6">
      <section className="rounded-[32px] border border-amber-200/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-700">
              CMS Headless
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Cores do Site</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Controle apenas os backgrounds do site publico. O painel admin permanece com visual estatico por seguranca de contraste e navegacao.
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-950 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-indigo-950/25 transition hover:-translate-y-0.5 hover:bg-indigo-900"
          >
            Guardar Cores
          </button>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-700">
          Background Tokens
        </span>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Paleta publica por secao</h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Cada campo abaixo grava uma cor no `config/conteudo`. Se nada for definido, o site usa automaticamente o fallback visual original.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {siteColorFields.map((field) => (
            <SiteColorField
              key={field.key}
              field={field}
              value={conteudo?.[field.key]}
              onChange={(value) => onContentChange(field.key, value)}
            />
          ))}
        </div>
      </section>
    </form>
  );
}

function SiteColorField({ field, value, onChange }) {
  const effectiveValue = value || "";
  const swatchColor = effectiveValue || field.colorFallback || field.fallback;

  return (
    <label className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
          <p className="mt-2 text-sm leading-6 text-slate-500">Fallback original: {field.fallback}</p>
        </div>

        <div
          className="h-12 w-12 rounded-2xl border border-slate-200 shadow-inner shadow-slate-900/5"
          style={{ background: swatchColor }}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="color"
          value={effectiveValue || field.colorFallback || field.fallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-0"
        />
        <input
          type="text"
          value={effectiveValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.fallback}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        />
      </div>
    </label>
  );
}

function CmsSectionCard({ section, values, onChange }) {
  return (
    <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
      <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-700">
        {section.eyebrow}
      </span>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{section.title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{section.description}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {section.fields.map((field) => (
          <CmsField
            key={field.key}
            field={field}
            value={values?.[field.key]}
            onChange={(value) => onChange(field.key, value)}
          />
        ))}
      </div>
    </section>
  );
}

function CmsField({ field, value, onChange }) {
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900">
        <span className="font-semibold text-slate-700">{field.label}</span>
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 accent-indigo-600"
        />
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="grid gap-2 md:col-span-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
        <textarea
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
    );
  }

  if (field.type === "color") {
    return (
      <label className="grid gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <input
            type="color"
            value={value || "#fff7d6"}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-0"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 outline-none"
          />
        </div>
      </label>
    );
  }

  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
      <input
        type="text"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function MediaImagesTab({ imagens, conteudo, onFieldChange, onSave }) {
  const categories = [
    {
      key: "hero",
      eyebrow: "Hero / Banner",
      title: "Imagem principal da home",
      description: "Atualiza o grande pano de fundo do topo sem exigir novo deploy.",
      fields: [
        {
          key: "heroBanner",
          label: "Banner principal",
          placeholder: "https://...",
          helper: "Aceita URL direta para a imagem da capa da secao inicial.",
          preview: resolveImageSource(imagens.heroBanner, imageFallbacks.heroBanner),
        },
      ],
    },
    {
      key: "historia",
      eyebrow: "Historia",
      title: "Cards narrativos",
      description: "Estas imagens alimentam os tres momentos da secao Nossa Historia.",
      fields: [
        {
          key: "historiaCard1",
          label: "Historia 1",
          placeholder: "https://...",
          helper: "Substitui a primeira imagem do storytelling.",
          preview: resolveImageSource(imagens.historiaCard1, conteudo.historiaCard1Imagem, imageFallbacks.historiaCard1),
        },
        {
          key: "historiaCard2",
          label: "Historia 2",
          placeholder: "https://...",
          helper: "Substitui a segunda imagem do storytelling.",
          preview: resolveImageSource(imagens.historiaCard2, conteudo.historiaCard2Imagem, imageFallbacks.historiaCard2),
        },
        {
          key: "historiaCard3",
          label: "Historia 3",
          placeholder: "https://...",
          helper: "Substitui a terceira imagem do storytelling.",
          preview: resolveImageSource(imagens.historiaCard3, conteudo.historiaCard3Imagem, imageFallbacks.historiaCard3),
        },
      ],
    },
    {
      key: "galeria",
      eyebrow: "Galeria",
      title: "Reserva visual para futuras galerias",
      description: "As imagens ficam persistidas no CMS e prontas para qualquer secao publica de galeria.",
      fields: [
        {
          key: "galeriaImagem1",
          label: "Galeria 1",
          placeholder: "https://...",
          helper: "Primeira imagem reservada para a galeria.",
          preview: resolveImageSource(imagens.galeriaImagem1, conteudo.galeriaImagem1),
        },
        {
          key: "galeriaImagem2",
          label: "Galeria 2",
          placeholder: "https://...",
          helper: "Segunda imagem reservada para a galeria.",
          preview: resolveImageSource(imagens.galeriaImagem2, conteudo.galeriaImagem2),
        },
        {
          key: "galeriaImagem3",
          label: "Galeria 3",
          placeholder: "https://...",
          helper: "Terceira imagem reservada para a galeria.",
          preview: resolveImageSource(imagens.galeriaImagem3, conteudo.galeriaImagem3),
        },
      ],
    },
    {
      key: "bloco-extra",
      eyebrow: "Bloco Extra",
      title: "Imagem do bloco adicional",
      description: "Utilize este asset para o bloco extra condicional do pos-casamento.",
      fields: [
        {
          key: "blocoExtraImagem",
          label: "Imagem do bloco extra",
          placeholder: "https://...",
          helper: "Imagem unica do bloco especial dinamico.",
          preview: resolveImageSource(imagens.blocoExtraImagem, conteudo.blocoExtraImagem, imageFallbacks.blocoExtraImagem),
        },
      ],
    },
    {
      key: "rodape",
      eyebrow: "Rodape",
      title: "Background editorial",
      description: "Opcionalmente, pode adicionar uma imagem sutil ao fundo do rodape mantendo a mesma composicao.",
      fields: [
        {
          key: "rodapeBackground",
          label: "Imagem do rodape",
          placeholder: "https://...",
          helper: "Se vazio, o rodape usa apenas a cor base atual.",
          preview: resolveImageSource(imagens.rodapeBackground),
        },
      ],
    },
  ];

  return (
    <div className="grid gap-6">
      <form onSubmit={onSave} className="grid gap-6">
        <section className="rounded-[32px] border border-amber-200/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-700">
                URL only
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Midia e Imagens</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Todas as imagens do site passam a ser geridas centralmente no Firebase. Cole apenas URLs diretas para evitar base64 e manter o Firestore leve.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-950 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-indigo-950/25 transition hover:-translate-y-0.5 hover:bg-indigo-900"
            >
              Guardar Midia
            </button>
          </div>
        </section>

        {categories.map((category) => (
          <section
            key={category.key}
            className="rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur"
          >
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-700">
              {category.eyebrow}
            </span>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{category.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{category.description}</p>

            <div className="mt-6 grid gap-5">
              {category.fields.map((field) => (
                <MediaFieldCard
                  key={field.key}
                  label={field.label}
                  value={imagens[field.key]}
                  placeholder={field.placeholder}
                  helper={field.helper}
                  preview={field.preview}
                  onChange={(value) => onFieldChange(field.key, value)}
                />
              ))}
            </div>
          </section>
        ))}
      </form>
    </div>
  );
}

function MediaFieldCard({ label, value, placeholder, helper, preview, onChange }) {
  return (
    <div className="grid gap-4 rounded-[28px] border border-amber-100/80 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm shadow-slate-900/5 md:grid-cols-[minmax(0,1.1fr)_260px] md:items-center">
      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">{label}</span>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <p className="text-sm leading-6 text-slate-500">{helper}</p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-inner shadow-slate-900/5">
        {preview ? (
          <img
            src={preview}
            alt={label}
            loading="lazy"
            className="h-52 w-full object-cover object-center"
          />
        ) : (
          <div className="grid h-52 place-items-center bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100 p-6 text-center">
            <div>
              <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-700">
                Placeholder
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-500">Sem imagem configurada para esta area.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TypographyProfessionalTab({ tipografia, onFieldChange, onSave }) {
  const groups = [
    {
      key: "titulos",
      title: "Titulos Principais",
      description: "Define a assinatura tipografica dos headings e chamadas principais.",
      accent: "from-indigo-950 via-indigo-900 to-indigo-700",
    },
    {
      key: "textos",
      title: "Textos Gerais",
      description: "Controla a legibilidade da narrativa, listas e blocos informativos.",
      accent: "from-stone-900 via-stone-800 to-stone-700",
    },
    {
      key: "destaques",
      title: "Datas / Destaques",
      description: "Ajusta datas, versiculos e pequenos elementos de enfase.",
      accent: "from-amber-700 via-amber-600 to-amber-500",
    },
  ];

  const previewTitleStyle = {
    fontFamily: tipografia.titulos.fontFamily,
    color: tipografia.titulos.color,
    fontSize: `${tipografia.titulos.fontSize}px`,
    fontWeight: tipografia.titulos.fontWeight,
    lineHeight: tipografia.titulos.lineHeight,
    letterSpacing: `${tipografia.titulos.letterSpacing}em`,
  };

  const previewTextStyle = {
    fontFamily: tipografia.textos.fontFamily,
    color: tipografia.textos.color,
    fontSize: `${tipografia.textos.fontSize}px`,
    fontWeight: tipografia.textos.fontWeight,
    lineHeight: tipografia.textos.lineHeight,
    letterSpacing: `${tipografia.textos.letterSpacing}em`,
  };

  const previewAccentStyle = {
    fontFamily: tipografia.destaques.fontFamily,
    color: tipografia.destaques.color,
    fontSize: `${tipografia.destaques.fontSize}px`,
    fontWeight: tipografia.destaques.fontWeight,
    lineHeight: tipografia.destaques.lineHeight,
    letterSpacing: `${tipografia.destaques.letterSpacing}em`,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
      <form onSubmit={onSave} className="grid gap-6">
        <div className="rounded-[32px] border border-amber-200/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-700">
                CMS Headless
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Tipografia Profissional</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Ajuste a voz visual do site inteiro com fontes, tamanhos, pesos, espacamentos e cores persistidos no Firebase.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-950 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-indigo-950/25 transition hover:-translate-y-0.5 hover:bg-indigo-900"
            >
              Guardar Tipografia
            </button>
          </div>

          <div className="grid gap-5">
            {groups.map((group) => (
              <TypographyGroupCard
                key={group.key}
                groupKey={group.key}
                title={group.title}
                description={group.description}
                accent={group.accent}
                config={tipografia[group.key]}
                onFieldChange={onFieldChange}
              />
            ))}
          </div>
        </div>
      </form>

      <aside className="h-fit rounded-[32px] border border-indigo-100 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-2xl shadow-slate-950/20 xl:sticky xl:top-8">
        <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-200">
          Preview em Tempo Real
        </span>
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p style={previewAccentStyle}>11 de julho de 2026</p>
          <h3 className="mt-4" style={previewTitleStyle}>
            Miqueias & Maria Eduarda
          </h3>
          <p className="mt-4" style={previewTextStyle}>
            Cada detalhe tipografico desta composicao responde em tempo real aos seus controlos, mantendo a atmosfera premium do site.
          </p>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p style={previewTextStyle}>Versiculo / destaque editorial</p>
            <p className="mt-3" style={previewAccentStyle}>
              Isaias 41:20
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TypographyGroupCard({ groupKey, title, description, accent, config, onFieldChange }) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-5 shadow-sm shadow-slate-900/5">
      <div className={`mb-5 rounded-[24px] bg-gradient-to-r ${accent} px-5 py-4 text-white`}>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Fonte</span>
          <input
            list={`${groupKey}-fonts`}
            value={config.fontFamily}
            onChange={(event) => onFieldChange(groupKey, "fontFamily", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Ex: Inter"
          />
          <datalist id={`${groupKey}-fonts`}>
            {fontOptions.map((font) => (
              <option key={font} value={font} />
            ))}
          </datalist>
        </label>

        <label className="grid gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Cor</span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input
              type="color"
              value={config.color}
              onChange={(event) => onFieldChange(groupKey, "color", event.target.value)}
              className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent p-0"
            />
            <span className="text-sm font-medium text-slate-700">{config.color}</span>
          </div>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <RangeField
          label="Tamanho"
          value={config.fontSize}
          min="12"
          max={groupKey === "titulos" ? "96" : "42"}
          step="1"
          suffix="px"
          onChange={(event) => onFieldChange(groupKey, "fontSize", Number(event.target.value))}
        />
        <RangeField
          label="Peso"
          value={config.fontWeight}
          min="300"
          max="900"
          step="100"
          suffix=""
          onChange={(event) => onFieldChange(groupKey, "fontWeight", Number(event.target.value))}
        />
        <RangeField
          label="Line Height"
          value={config.lineHeight}
          min="1"
          max="2.2"
          step="0.05"
          suffix=""
          onChange={(event) => onFieldChange(groupKey, "lineHeight", Number(event.target.value))}
        />
        <RangeField
          label="Letter Spacing"
          value={config.letterSpacing}
          min="-0.05"
          max="0.2"
          step="0.01"
          suffix="em"
          onChange={(event) => onFieldChange(groupKey, "letterSpacing", Number(event.target.value))}
        />
      </div>
    </section>
  );
}

function RangeField({ label, value, min, max, step, suffix, onChange }) {
  return (
    <label className="grid gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full accent-indigo-600"
      />
    </label>
  );
}

const styles = {
  screen: { minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg, #fffdf8 0%, #f5ecde 100%)", color: "#312e81", fontWeight: 700 },
  page: { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(196,166,97,0.18), transparent 28%), linear-gradient(180deg, #fffdf8 0%, #f6efe4 100%)", padding: "22px 16px 54px" },
  topbar: { maxWidth: 1180, margin: "0 auto 22px", padding: 24, borderRadius: 30, background: "rgba(255,252,247,0.92)", border: "1px solid rgba(196,166,97,0.22)", boxShadow: "0 26px 56px rgba(36,27,47,0.1)", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" },
  content: { maxWidth: 1180, margin: "0 auto" },
  row: { display: "flex", gap: 12, alignItems: "center" },
  metrics: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18, marginBottom: 22 },
  metric: { padding: 24, borderRadius: 28, background: "rgba(255,254,250,0.94)", border: "1px solid rgba(196,166,97,0.18)", boxShadow: "0 22px 46px rgba(49,46,129,0.08)" },
  metricLabel: { display: "block", marginBottom: 10, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8f7a4f" },
  metricValue: { fontSize: 38, color: "#241b2f" },
  card: { background: "rgba(255,253,248,0.95)", border: "1px solid rgba(196,166,97,0.18)", borderRadius: 34, boxShadow: "0 26px 66px rgba(36,27,47,0.08)", padding: 24 },
  tabs: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 },
  tab: { padding: "12px 18px", borderRadius: 999, border: "1px solid rgba(49,46,129,0.12)", background: "#fffefb", color: "#4c3f5e", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" },
  tabActive: { padding: "12px 18px", borderRadius: 999, border: "1px solid rgba(49,46,129,0.12)", background: "linear-gradient(135deg, #312e81 0%, #211c58 100%)", color: "#fffaf2", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" },
  split: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22 },
  panel: { padding: 24, borderRadius: 28, background: "rgba(255,255,255,0.62)", border: "1px solid rgba(196,166,97,0.18)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 18 },
  eyebrow: { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(196,166,97,0.14)", color: "#8f7a4f", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" },
  title: { margin: "8px 0 0", fontSize: 34, color: "#241b2f" },
  subtitle: { margin: "10px 0 18px", fontSize: 30, color: "#241b2f" },
  templateTitle: { margin: "10px 0 18px", fontSize: 22, color: "#241b2f" },
  copy: { margin: "0 0 18px", color: "#5a4c67", lineHeight: 1.7 },
  form: { display: "grid", gap: 16 },
  input: { width: "100%", padding: "15px 16px", borderRadius: 18, border: "1px solid rgba(49,46,129,0.12)", background: "#fffefb", color: "#241b2f", fontSize: 15, outline: "none" },
  textarea: { width: "100%", minHeight: 130, padding: "15px 16px", borderRadius: 18, border: "1px solid rgba(49,46,129,0.12)", background: "#fffefb", color: "#241b2f", fontSize: 15, outline: "none", resize: "vertical" },
  primaryButton: { padding: "16px 20px", borderRadius: 18, border: "1px solid rgba(196,166,97,0.26)", background: "linear-gradient(135deg, #c4a661 0%, #a88642 100%)", color: "#241b2f", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" },
  secondaryButton: { padding: "13px 16px", borderRadius: 16, border: "1px solid rgba(49,46,129,0.12)", background: "#fffefb", color: "#312e81", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" },
  dangerButton: { padding: "13px 16px", borderRadius: 16, border: "1px solid rgba(153,27,27,0.12)", background: "rgba(254,242,242,0.95)", color: "#991b1b", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" },
  linkButton: { border: "none", background: "transparent", color: "#312e81", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0 },
  tableWrap: { overflowX: "auto", borderRadius: 24, border: "1px solid rgba(196,166,97,0.16)", background: "#fffefb" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "16px 18px", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8f7a4f", borderBottom: "1px solid rgba(196,166,97,0.16)" },
  td: { padding: "16px 18px", fontSize: 14, color: "#3f3650", borderBottom: "1px solid rgba(36,27,47,0.06)", verticalAlign: "top" },
  action: { border: "none", background: "transparent", color: "#312e81", fontWeight: 700, cursor: "pointer" },
  badge: { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(196,166,97,0.12)", color: "#8f6d37", fontSize: 11, fontWeight: 800, textTransform: "uppercase" },
  badgeActive: { display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(49,46,129,0.12)", color: "#312e81", fontSize: 11, fontWeight: 800, textTransform: "uppercase" },
  info: { padding: 16, borderRadius: 18, background: "linear-gradient(140deg, rgba(49,46,129,0.08) 0%, rgba(255,255,255,0.82) 100%)", color: "#5a4c67", lineHeight: 1.6 },
  templateCard: { marginTop: 20, padding: 22, borderRadius: 26, background: "linear-gradient(160deg, rgba(255,253,248,0.96) 0%, rgba(249,241,230,0.96) 100%)", border: "1px solid rgba(196,166,97,0.18)", boxShadow: "0 18px 42px rgba(36,27,47,0.08)" },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", padding: "14px 18px", borderRadius: 18, background: "#241b2f", color: "#fffaf2", boxShadow: "0 24px 50px rgba(36,27,47,0.22)", zIndex: 80 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  posterPreview: { width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(196,166,97,0.18)" },
  previewWrap: { display: "grid", gap: 10 },
  previewLabel: { fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8f7a4f" },
  previewBox: { padding: 18, borderRadius: 20, background: "rgba(49,46,129,0.06)", color: "#241b2f", lineHeight: 1.75, whiteSpace: "pre-wrap" },
  note: { padding: 16, borderRadius: 18, background: "rgba(196,166,97,0.12)", color: "#6a5531", lineHeight: 1.6 },
  modalActions: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(18,16,32,0.56)", backdropFilter: "blur(12px)", display: "grid", placeItems: "center", padding: 20, zIndex: 90 },
  inviteCard: { width: "min(620px, 100%)", padding: 24, borderRadius: 32, background: "rgba(255,253,248,0.98)", border: "1px solid rgba(196,166,97,0.18)", boxShadow: "0 32px 80px rgba(36,27,47,0.24)", display: "grid", gap: 14 },
  shareButton: { padding: "16px 18px", borderRadius: 18, border: "1px solid rgba(49,46,129,0.14)", background: "linear-gradient(135deg, #312e81 0%, #211c58 100%)", color: "#fffefb", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" },
  whatsappButton: { padding: "16px 18px", borderRadius: 18, border: "1px solid rgba(25,135,84,0.16)", background: "linear-gradient(135deg, #25d366 0%, #149f4b 100%)", color: "#fffefb", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer" },
  authCard: { width: "min(460px, 100%)", padding: 42, borderRadius: 34, background: "rgba(255,253,248,0.96)", border: "1px solid rgba(196,166,97,0.2)", boxShadow: "0 30px 70px rgba(36,27,47,0.12)" },
};















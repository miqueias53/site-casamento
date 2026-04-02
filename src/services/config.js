import { doc, getDoc, setDoc } from "firebase/firestore";

import { appId, db } from "../firebase/firebase.js";

function getPixDoc() {
  return doc(db, "artifacts", appId, "public", "data", "config", "pix");
}

export async function buscarConfiguracoes() {
  try {
    const snap = await getDoc(getPixDoc());

    if (snap.exists()) {
      return snap.data();
    }

    return {
      chavePix: "",
      banco: "",
      titular: "",
      mensagem: "Obrigado por nos ajudar com o nosso sonho!",
    };
  } catch (erro) {
    console.error("Erro ao buscar configurações no Firestore:", erro);
    return null;
  }
}

export async function salvarConfiguracoesAdmin(dados) {
  try {
    await setDoc(
      getPixDoc(),
      {
        ...dados,
        ultimaAtualizacao: new Date().toISOString(),
      },
      { merge: true }
    );

    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao salvar PIX:", erro);
    return { sucesso: false, erro: erro.message };
  }
}

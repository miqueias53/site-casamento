import { addDoc, collection, deleteDoc, doc, getDocs } from "firebase/firestore";

import { appId, db } from "../firebase/firebase.js";

function getConvidadosCollection() {
  return collection(db, "artifacts", appId, "public", "data", "convidados");
}

function getConvidadoDoc(id) {
  return doc(db, "artifacts", appId, "public", "data", "convidados", id);
}

export async function buscarConvidados() {
  try {
    const snapshot = await getDocs(getConvidadosCollection());
    const lista = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    return lista.sort((a, b) => new Date(b.dataRegisto) - new Date(a.dataRegisto));
  } catch (erro) {
    console.error("Erro ao buscar lista de convidados:", erro);
    throw new Error("Não foi possível carregar a lista de confirmações.");
  }
}

export async function registrarPresenca(dados) {
  try {
    await addDoc(getConvidadosCollection(), {
      ...dados,
      dataRegisto: new Date().toISOString(),
    });

    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao registar presença:", erro);
    return { sucesso: false, erro: erro.message };
  }
}

export async function eliminarConvidadoAdmin(id) {
  try {
    await deleteDoc(getConvidadoDoc(id));
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao eliminar registo de convidado:", erro);
    return { sucesso: false, erro: erro.message };
  }
}

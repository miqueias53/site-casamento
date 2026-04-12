import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

import { appId, db } from "../firebase/firebase.js";

function getPresentesCollection() {
  return collection(db, "artifacts", appId, "public", "data", "presentes");
}

function getPresenteDoc(id) {
  return doc(db, "artifacts", appId, "public", "data", "presentes", id);
}

export async function buscarPresentes() {
  try {
    const snapshot = await getDocs(getPresentesCollection());
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (erro) {
    console.error("Erro ao procurar presentes:", erro);
    throw new Error("Falha na sincronizacao do catalogo.");
  }
}

export async function reservarPresenteTransacao(
  id,
  nomeConvidado = "Convidado",
  reservaToken = null
) {
  const presenteRef = getPresenteDoc(id);

  try {
    await runTransaction(db, async (transaction) => {
      const presenteDoc = await transaction.get(presenteRef);

      if (!presenteDoc.exists()) {
        throw new Error("Item inexistente no sistema.");
      }

      if (presenteDoc.data().reservado === true) {
        throw new Error("Este item ja foi reservado por outra pessoa.");
      }

      transaction.update(presenteRef, {
        reservado: true,
        reservadoPor: nomeConvidado,
        dataReserva: new Date().toISOString(),
        reservaToken: reservaToken || null,
      });
    });

    return { sucesso: true, mensagem: "Reserva efetuada com sucesso!" };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

export async function desreservarPresentePublico(id, reservaToken) {
  const presenteRef = getPresenteDoc(id);

  try {
    await runTransaction(db, async (transaction) => {
      const presenteDoc = await transaction.get(presenteRef);

      if (!presenteDoc.exists()) {
        throw new Error("Item inexistente no sistema.");
      }

      if (presenteDoc.data().reservado !== true) {
        throw new Error("Este presente ja esta disponivel.");
      }

      if (!reservaToken || presenteDoc.data().reservaToken !== reservaToken) {
        throw new Error("A desreserva so pode ser feita no mesmo navegador que reservou o presente.");
      }

      transaction.update(presenteRef, {
        reservado: false,
        reservadoPor: null,
        dataReserva: null,
        reservaToken: null,
      });
    });

    return { sucesso: true, mensagem: "Reserva cancelada com sucesso!" };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

export async function adicionarPresenteAdmin(dados) {
  try {
    await addDoc(getPresentesCollection(), {
      ...dados,
      reservado: false,
      reservadoPor: null,
      reservaToken: null,
      dataReserva: null,
      dataCriacao: new Date().toISOString(),
    });

    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

export async function eliminarPresenteAdmin(id) {
  try {
    await deleteDoc(getPresenteDoc(id));
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

export async function libertarPresenteAdmin(id) {
  try {
    await updateDoc(getPresenteDoc(id), {
      reservado: false,
      reservadoPor: null,
      dataReserva: null,
      reservaToken: null,
    });

    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
}

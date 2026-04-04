export const GUEST_STATUS = {
  CONFIRMED: "Confirmado",
  DECLINED: "Não Comparecerá",
  PENDING: "Pendente",
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeGuestStatus(guest) {
  const normalizedStatus = normalizeText(guest?.status);

  if (["confirmado", "confirmada"].includes(normalizedStatus)) {
    return GUEST_STATUS.CONFIRMED;
  }

  if ([
    "nao comparecera",
    "nao comparecerao",
    "nao podera comparecer",
    "ausente",
    "ausentes",
    "recusado",
    "declined",
  ].includes(normalizedStatus)) {
    return GUEST_STATUS.DECLINED;
  }

  if (["pendente", "pending"].includes(normalizedStatus)) {
    return GUEST_STATUS.PENDING;
  }

  if (guest?.confirmado === true) {
    return GUEST_STATUS.CONFIRMED;
  }

  if (guest?.confirmado === false) {
    return GUEST_STATUS.DECLINED;
  }

  return GUEST_STATUS.PENDING;
}

export function getGuestConfirmedFlag(status) {
  if (status === GUEST_STATUS.CONFIRMED) return true;
  if (status === GUEST_STATUS.DECLINED) return false;
  return null;
}


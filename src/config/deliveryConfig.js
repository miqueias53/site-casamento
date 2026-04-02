export const defaultDeliveryConfig = {
  titulo: "Antes de ir para a loja",
  mensagem:
    "Se optar por comprar este presente diretamente na loja, por favor utilize o endereço abaixo para a entrega.",
  endereco: "Endereço de entrega não configurado.",
  botaoCancelar: "Cancelar",
  botaoContinuar: "Continuar para a Loja",
};

export function normalizeDeliveryConfig(data) {
  return {
    ...defaultDeliveryConfig,
    ...(data || {}),
  };
}

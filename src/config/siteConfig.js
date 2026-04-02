export const defaultSiteConfig = {
  titulosFontFamily: "Georgia, serif",
  titulosFontSize: "34px",
  titulosFontWeight: "600",
  textosFontFamily: "Georgia, serif",
  textosFontSize: "16px",
  textosFontWeight: "400",
  dataFontFamily: "Georgia, serif",
  dataFontSize: "18px",
  dataFontWeight: "500",
  heroTitulo: "Miqueias & Maria Eduarda",
  heroData: "11 de julho de 2026",
  heroTituloFontSize: "70px",
  corFundoGlobal: "",
  corFundoRSVP: "",
  corFundoLocalArea: "",
  corFundoContagemArea: "",
  corFundoContagemCards: "",
  corFundoPix: "",
  corFundoFooter: "",
  mostrarHero: true,
  mostrarContagem: true,
  mostrarHistoria: true,
  mostrarLocal: true,
  mostrarRSVP: true,
  mostrarPresentes: true,
  mostrarBlocoExtra: false,
  mostrarGaleriaPos: false,
  historiaTitulo: "Nossa História",
  historiaDescricao: "Cada passo da nossa história que nos trouxe até o presente momento.",
  historiaCardBackgroundColor: "#fffaf2",
  historiaCard1Titulo: "O começo",
  historiaCard1Texto: "Tudo começou quando nossos caminhos se cruzaram pela primeira vez.",
  historiaCard1Imagem: "/historia1.jpg",
  historiaCard2Titulo: "Momentos especiais",
  historiaCard2Texto: "Entre risadas, sonhos e muitos momentos inesquecíveis, fomos construindo nossa história.",
  historiaCard2Imagem: "/historia2.jpg",
  historiaCard3Titulo: "O pedido",
  historiaCard3Texto: "E então chegou o momento em que decidimos caminhar juntos para sempre.",
  historiaCard3Imagem: "/historia3.jpg",
  localTitulo: "Local da Cerimônia",
  localData: "11 de julho de 2026",
  localHora: "17:00 da tarde",
  localNome: "Espaço Recanto Eventos",
  localEndereco: "Av. Nossa Senhora da Guia, 620\nFloriano - PI",
  localMapsLink: "https://www.google.com/maps/search/?api=1&query=Espaco+Recanto+Eventos+Floriano+PI",
  localMapsButtonLabel: "Abrir rota no Google Maps",
  localCardBackgroundColor: "rgba(255, 255, 255, 0.08)",
  rsvpEyebrow: "Lista fechada",
  rsvpTitulo: "RSVP personalizado",
  rsvpDescricao:
    "Procure pelo seu nome ou sobrenome para abrir o convite digital e confirmar a sua presença com toda a elegância.",
  rsvpPrazoLabel: "Data limite para confirmação",
  rsvpPrazoData: "11 de maio",
  rsvpPrazoTexto: "Agradecemos, com carinho, que a sua resposta seja enviada até esta data.",
  rsvpInformacoesTitulo: "Informações importantes",
  rsvpInformacao1: "Traje: esporte fino.",
  rsvpInformacao2: "Pedimos gentilmente que evite roupas totalmente brancas.",
  rsvpInformacao3: "Sugerimos chegar com pelo menos 30 minutos de antecedência.",
  rsvpBuscaPlaceholder: "Comece a escrever o seu nome ou sobrenome",
  rsvpBuscaInstrucao: "Digite pelo menos 3 letras do seu nome ou sobrenome para procurar o convite.",
  rsvpBuscaSemResultados: "Não encontramos nenhum convite com esse nome. Verifique a grafia e tente novamente.",
  rsvpStatusConviteEncontrado: "O seu convite foi localizado automaticamente.",
  rsvpStatusSelecionePresenca: "Selecione pelo menos uma presença para concluir a confirmação.",
  rsvpStatusSucesso: "Presença confirmada com sucesso. Obrigado por celebrar este momento connosco.",
  rsvpStatusErro: "Não foi possível confirmar a presença agora. Tente novamente dentro de instantes.",
  rsvpConviteEyebrow: "Convite aberto",
  rsvpSaudacaoPrefixo: "Olá,",
  rsvpResumoConvite: "O seu convite é para até [ADULTOS] adultos e [CRIANCAS] crianças.",
  rsvpAdultosLabel: "Quantos adultos vão?",
  rsvpCriancasLabel: "Quantas crianças vão?",
  rsvpEstadoLabel: "Estado atual",
  rsvpBotaoConfirmar: "Confirmar Presença",
  rsvpBotaoAtualizar: "Atualizar confirmação",
  presentesEyebrow: "Lista premium",
  presentesTitulo: "Presentes e contribuições",
  presentesDescricao:
    "Escolhemos presentes com carinho e deixámos também a opção de contribuição via PIX para quem preferir uma oferta direta.",
  presentesPixEyebrow: "PIX",
  presentesPixTitulo: "Contribuição digital",
  presentesLoadingTexto: "A carregar presentes...",
  presentesVazioTexto: "A lista de presentes será publicada em breve.",
  presentesBotaoLoja: "Ver loja",
  presentesBotaoComprar: "Comprar presente",
  presentesBotaoIndisponivel: "Indisponível",
  blocoExtraEyebrow: "Conteúdo especial",
  blocoExtraTitulo: "Uma mensagem especial",
  blocoExtraTexto: "Este bloco adicional pode ser usado para recados, agradecimentos ou qualquer conteúdo pós-casamento.",
  blocoExtraImagem: "",
  galeriaImagem1: "",
  galeriaImagem2: "",
  galeriaImagem3: "",
  galeriaPosEyebrow: "Pós-casamento",
  galeriaPosTitulo: "Galeria do grande dia",
  galeriaPosDescricao: "Um espaço reservado para partilhar os melhores registos depois da celebração.",
  versiculoTexto: "Isaías 41:20",
  versiculoFontSize: "13px",
  versiculoColor: "#fff7d6",
};

export function normalizeSiteConfig(data) {
  return {
    ...defaultSiteConfig,
    ...(data || {}),
  };
}

export function getSectionVisibility(config) {
  const safeConfig = normalizeSiteConfig(config);

  return {
    hero: safeConfig?.mostrarHero !== false,
    contagem: safeConfig?.mostrarContagem !== false,
    historia: safeConfig?.mostrarHistoria !== false,
    local: safeConfig?.mostrarLocal !== false,
    rsvp: safeConfig?.mostrarRSVP !== false,
    presentes: safeConfig?.mostrarPresentes !== false,
    blocoExtra: safeConfig?.mostrarBlocoExtra === true,
    galeriaPos: safeConfig?.mostrarGaleriaPos === true,
  };
}

export function formatRsvpResumo(template, guest) {
  const safeTemplate = template || defaultSiteConfig.rsvpResumoConvite;
  const adults = Number(guest?.maxAdultos ?? 0);
  const children = Number(guest?.maxCriancas ?? 0);

  return safeTemplate
    .replace(/\[ADULTOS\]/g, `${adults}`)
    .replace(/\[CRIANCAS\]/g, `${children}`);
}

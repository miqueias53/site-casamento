ARQUITETURA
1. Visão Geral do Sistema
Este projeto é um site público de casamento com um painel administrativo embutido na mesma aplicação React. A aplicação funciona como um CMS headless simplificado sobre Firebase: quase todo o conteúdo, a visibilidade de seções, tipografia, imagens, PIX, RSVP, modal de entrega e templates de convite são persistidos no Firestore e observados em tempo real com onSnapshot(...).

A base atual já incorpora as evoluções mais recentes:

suporte a RSVP com estados Confirmado, Não Comparecerá e Pendente
utilitário central de status em src/utils/guestStatus.js
correção do FOUC / flash de carregamento no src/App.jsx
uso de whitespace-pre-line em componentes públicos para respeitar quebras de linha salvas no CMS
modal de entrega expandido em src/components/Presentes.jsx, com botão Copiar Endereço
pesquisa em tempo real no src/pages/Admin.jsx para listas de convidados e presentes
Stack real encontrada no código
React 18.3.1
Vite 8
Tailwind CSS v4
Firebase Auth
Firebase Firestore
xlsx
jspdf
jspdf-autotable
Dependência instalada mas não usada de forma relevante no fluxo atual:

react-router-dom
Topologia da aplicação
src/
  App.jsx
  main.jsx
  index.css
  App.css
  firebase/
    firebase.js
  providers/
    TypographyProvider.jsx
  config/
    siteConfig.js
    siteImages.js
    deliveryConfig.js
  pages/
    Admin.jsx
    Home.jsx
  components/
    Navbar.jsx
    Hero.jsx
    Contagem.jsx
    Historia.jsx
    Local.jsx
    RSVP.jsx
    Presentes.jsx
    BlocoExtra.jsx
    GaleriaPosCasamento.jsx
    Footer.jsx
    FadeInSection.jsx
  services/
    config.js
    convidados.js
    presentes.js
  utils/
    adminExport.js
    guestStatus.js
docs/
  ARQUITETURA.md
Papel de cada núcleo
src/App.jsx
Orquestra a app inteira. Decide entre vista pública e admin, observa o conteúdo principal e imagens do Firestore, resolve o boot inicial e controla o hash #admin.

src/pages/Admin.jsx
Painel monolítico de gestão. Autentica utilizadores, observa múltiplos documentos do Firestore, mantém formulários administrativos, exporta dados, gere convites e agora também aplica filtros de pesquisa em tempo real.

src/providers/TypographyProvider.jsx
Observa config/tipografia, injeta Google Fonts dinamicamente e aplica variáveis CSS globais em :root.

src/config/siteConfig.js
Define o schema de facto do CMS público: textos, toggles, labels, cores de fundo e vários conteúdos configuráveis.

src/config/siteImages.js
Resolve imagens configuráveis, fallbacks e mistura de fontes visuais.

src/config/deliveryConfig.js
Define o contrato default do modal de entrega da loja.

src/components/*
Representam o frontend público. Vários componentes consomem dados do Firestore via props vindas do App, e alguns componentes também observam Firestore diretamente.

src/utils/adminExport.js
Isola a exportação para XLSX e PDF.

src/utils/guestStatus.js
Novo módulo de normalização de estados de RSVP, criado para manter compatibilidade com convidados antigos e reduzir duplicação de lógica entre frontend público e admin.

Arquitetura funcional atual
A aplicação não usa roteamento formal para separar público e admin.
A troca de contexto acontece por window.location.hash:
#admin para o painel
ausência de #admin para o site público
O sistema inteiro depende de sincronização reativa com Firestore.
O frontend público usa majoritariamente inline styles combinados com conteúdo vindo do CMS.
O painel admin usa uma mistura de:
classes Tailwind v4
componentes internos
styles inline legados
2. Modelo de Dados e Firebase
Firebase e caminho base
Em src/firebase/firebase.js, a aplicação expõe:

db
auth
appId = "casamento-miqueias"
Todos os dados observados e persistidos são ancorados em:

artifacts/casamento-miqueias/public/data
Coleções e documentos reais
Coleções:

artifacts/casamento-miqueias/public/data/presentes
artifacts/casamento-miqueias/public/data/convidados
Documentos de configuração:

artifacts/casamento-miqueias/public/data/config/pix
artifacts/casamento-miqueias/public/data/config/conteudo
artifacts/casamento-miqueias/public/data/config/entrega
artifacts/casamento-miqueias/public/data/config/convites
artifacts/casamento-miqueias/public/data/config/tipografia
artifacts/casamento-miqueias/public/data/config/imagens
Estratégia de sincronização
O padrão dominante é onSnapshot(...), usado em:

src/App.jsx

conteudoRef()
imagensRef()
src/providers/TypographyProvider.jsx

tipografiaRef()
src/pages/Admin.jsx

presentesRef()
convidadosRef()
pixRef()
conteudoRef()
entregaRef()
convitesRef()
tipografiaRef()
imagensRef()
src/components/Presentes.jsx

presentesRef()
pixRef()
entregaRef()
src/components/RSVP.jsx

convidadosRef()
Consequência prática:

o painel admin e o site público convergem sobre o mesmo backend reativo
alterações feitas no admin refletem-se no frontend sem refresh total
não existe backend intermediário próprio
Padrões de hardening de dados
O projeto usa três mecanismos consistentes:

Funções de normalização
normalizeSiteConfig(data)
normalizeDeliveryConfig(data)
mergeImageConfig(data)
mergeTypography(data)
normalizeGuestStatus(guest)
Fallbacks com ||
ex.: safeSiteConfig?.rsvpTitulo || "RSVP personalizado"
snapshot.exists() ? ... : fallback
ex.: snapshot.exists() ? normalizeSiteConfig(snapshot.data()) : defaultSiteConfig
3. Schema Atual do Firestore
config/conteudo
src/config/siteConfig.js define defaultSiteConfig, que hoje funciona como schema central do CMS.

Campos observados no runtime:

titulosFontFamily
titulosFontSize
titulosFontWeight
textosFontFamily
textosFontSize
textosFontWeight
dataFontFamily
dataFontSize
dataFontWeight
heroTitulo
heroData
heroTituloFontSize

corFundoGlobal
corFundoRSVP
corFundoLocalArea
corFundoContagemArea
corFundoContagemCards
corFundoPix
corFundoFooter

mostrarHero
mostrarContagem
mostrarHistoria
mostrarLocal
mostrarRSVP
mostrarPresentes
mostrarBlocoExtra
mostrarGaleriaPos

historiaTitulo
historiaDescricao
historiaCardBackgroundColor
historiaCard1Titulo
historiaCard1Texto
historiaCard1Imagem
historiaCard2Titulo
historiaCard2Texto
historiaCard2Imagem
historiaCard3Titulo
historiaCard3Texto
historiaCard3Imagem

localTitulo
localData
localHora
localNome
localEndereco
localMapsLink
localMapsButtonLabel
localCardBackgroundColor

rsvpEyebrow
rsvpTitulo
rsvpDescricao
rsvpPrazoLabel
rsvpPrazoData
rsvpPrazoTexto
rsvpInformacoesTitulo
rsvpInformacao1
rsvpInformacao2
rsvpInformacao3
rsvpBuscaPlaceholder
rsvpBuscaInstrucao
rsvpBuscaSemResultados
rsvpStatusConviteEncontrado
rsvpStatusSelecionePresenca
rsvpStatusSucesso
rsvpStatusErro
rsvpConviteEyebrow
rsvpSaudacaoPrefixo
rsvpResumoConvite
rsvpAdultosLabel
rsvpCriancasLabel
rsvpEstadoLabel
rsvpBotaoConfirmar
rsvpBotaoAtualizar

presentesEyebrow
presentesTitulo
presentesDescricao
presentesPixEyebrow
presentesPixTitulo
presentesLoadingTexto
presentesVazioTexto
presentesBotaoLoja
presentesBotaoComprar
presentesBotaoIndisponivel

blocoExtraEyebrow
blocoExtraTitulo
blocoExtraTexto
blocoExtraImagem

galeriaImagem1
galeriaImagem2
galeriaImagem3
galeriaPosEyebrow
galeriaPosTitulo
galeriaPosDescricao

versiculoTexto
versiculoFontSize
versiculoColor
Observação importante:

O suporte a RSVP com Não Comparecerá foi adicionado no fluxo, mas os textos do CMS ainda continuam majoritariamente estruturados em torno de confirmação tradicional. O novo estado é tratado na lógica do componente, não por novos campos de conteúdo.
config/pix
Campos:

chavePix
banco
titular
mensagem
ultimaAtualizacao
config/entrega
Definido em src/config/deliveryConfig.js com defaultDeliveryConfig.

Campos:

titulo
mensagem
endereco
botaoCancelar
botaoContinuar
ultimaAtualizacao
Esse documento passou a ter maior relevância após a expansão do modal de entrega e da adição do botão Copiar Endereço.

config/convites
Campos:

mensagemPadrao
urlCartaz
ultimaAtualizacao
Placeholders suportados por buildInviteMessage(template, guest) em src/pages/Admin.jsx:

[NOME]
[LINK]
config/tipografia
Estrutura atual:

titulos.fontFamily
titulos.color
titulos.fontSize
titulos.fontWeight
titulos.lineHeight
titulos.letterSpacing

textos.fontFamily
textos.color
textos.fontSize
textos.fontWeight
textos.lineHeight
textos.letterSpacing

destaques.fontFamily
destaques.color
destaques.fontSize
destaques.fontWeight
destaques.lineHeight
destaques.letterSpacing

ultimaAtualizacao
config/imagens
Campos operacionais:

heroBanner
historiaCard1
historiaCard2
historiaCard3
blocoExtraImagem
galeriaImagem1
galeriaImagem2
galeriaImagem3
rodapeBackground
ultimaAtualizacao
Coleção presentes
Campos encontrados:

nome
valor
loja
lojaNome
linkCompra
imagem
reservado
reservadoPor
dataCriacao
dataReserva
Coleção convidados
Campos encontrados:

nome
conviteId
maxAdultos
maxCriancas
adultosConfirmados
criancasConfirmadas
status
confirmado
dataCriacao
dataResposta
dataRegisto
ultimaAtualizacao
Observação relevante:

coexistem dois modelos históricos:
modelo de lista fechada atual, baseado em conviteId, limites e atualização com updateDoc
modelo legado acessível por src/services/convidados.js, que ainda expõe registrarPresenca(dados) e grava dataRegisto
4. Sistema de Status de Convidados
Novo módulo central: src/utils/guestStatus.js
Este ficheiro foi introduzido para resolver dois problemas arquiteturais:

compatibilidade com convidados antigos que não tinham status explícito
unificação da lógica entre RSVP.jsx e Admin.jsx
Constantes exportadas
export const GUEST_STATUS = {
  CONFIRMED: "Confirmado",
  DECLINED: "Não Comparecerá",
  PENDING: "Pendente",
};
normalizeGuestStatus(guest)
A função:

normaliza texto com normalize("NFD")
remove diacríticos
converte para lowercase
aceita variações legadas como:
"confirmado"
"confirmada"
"nao comparecera"
"nao comparecerao"
"nao podera comparecer"
"ausente"
"ausentes"
"recusado"
"declined"
"pendente"
"pending"
Fallbacks importantes:

se guest.confirmado === true, devolve Confirmado
se guest.confirmado === false, devolve Não Comparecerá
se nada estiver consistente, devolve Pendente
Isto garante retrocompatibilidade com registos antigos.

getGuestConfirmedFlag(status)
Mapeia o status textual de volta para o booleano persistido:

Confirmado -> true
Não Comparecerá -> false
Pendente -> null
Esse helper é usado no admin para manter o campo booleano confirmado coerente com o campo textual status.

5. Fluxo Público
src/App.jsx
Função principal
O App atual controla:

view
siteConfig
siteImages
contentReady
imagesReady
isFirebaseLoaded
Resolução do FOUC / flash de carregamento
Nas últimas alterações, o problema do piscar visual no boot foi tratado com uma estratégia explícita de pré-carregamento visual.

Mecanismo atual
O App mantém dois readiness flags independentes:

contentReady
imagesReady
Esses flags só são ativados quando os listeners de Firestore retornam com sucesso ou erro tratado:

listener de conteudoRef()
listener de imagensRef()
Depois disso, um efeito controla:

useEffect(() => {
  if (!contentReady || !imagesReady) return;
  setIsFirebaseLoaded(true);
}, [contentReady, imagesReady]);
Enquanto isFirebaseLoaded for false, o componente renderiza LoadingScreen em vez da PublicPage.

LoadingScreen({ backgroundColor })
A tela de loading:

aplica diretamente o backgroundColor em document.body.style.background
aplica também document.body.style.backgroundColor
restaura o valor anterior no cleanup
Isto evita que o body apareça momentaneamente com fundo inconsistente antes do conteúdo definitivo ser aplicado.

loadingBackgroundColor
Durante o boot, o fundo já tenta respeitar o tema configurado:

const loadingBackgroundColor =
  safeSiteConfig?.corFundoGlobal?.trim() ||
  defaultSiteConfig.corFundoGlobal ||
  "#fffdf8";
Mesmo sem a página final montada, a loading screen já usa o tema global resolvido, reduzindo o salto visual.

Alternância pública/admin
getInitialView() lê window.location.hash
hashchange mantém o estado sincronizado
outro efeito escreve ou remove #admin ao mudar view
Scroll por hash para secções públicas
Há um efeito adicional que:

ignora #admin
tenta localizar secções por id
faz scrollIntoView({ behavior: "smooth", block: "start" })
6. Frontend Público por Componente
src/components/RSVP.jsx
Fonte de dados
Observa:

artifacts/casamento-miqueias/public/data/convidados
Estados locais principais
guests
query
selectedId
adults
children
attendanceStatus
status
loading
Localização automática por convite
getGuestQueryId() lê ?id=<conviteId>.

No useEffect(...), se existir id na URL, o componente procura um convidado cujo conviteId corresponda e chama selectGuest(match).

Pesquisa de convidados no público
filteredGuests:

só pesquisa quando query.trim().length >= 3
faz filtro por nome
usa toLowerCase()
limita a 8 resultados
Suporte ao novo estado Não Comparecerá
attendanceStatus
Novo estado local que guarda a escolha corrente do formulário:

Confirmado
Não Comparecerá
selectGuest(guest)
Ao selecionar um convidado:

usa normalizeGuestStatus(guest)
se o convidado já estiver como Não Comparecerá, o formulário entra nesse estado
nesse caso, adults e children são zerados
handleAttendanceChange(value)
Se o utilizador escolhe Não Comparecerá:

adults = 0
children = 0
Se volta para Confirmado e não houver contagem:

reidrata uma presença mínima a partir dos limites do convidado
submitResponse()
A submissão agora grava:

status
confirmado
adultosConfirmados
criancasConfirmadas
dataResposta
Regras:

se attendanceStatus === Confirmado, exige pelo menos 1 presença
se attendanceStatus === Não Comparecerá, grava:
confirmado: false
adultosConfirmados: 0
criancasConfirmadas: 0
Estado atual exibido
O badge textual de estado usa:

const currentGuestStatus = selectedGuest
  ? normalizeGuestStatus(selectedGuest)
  : GUEST_STATUS.PENDING;
Logo, o frontend público não depende apenas de selectedGuest.status; ele normaliza a realidade do documento.

Whitespace e parágrafos
O componente passou a usar className="whitespace-pre-line" em vários pontos:

descrição principal
texto de prazo
resumo do convite
caixa de status/feedback
Isto permite que quebras de linha gravadas no Firestore apareçam como parágrafos reais no frontend.

src/components/Presentes.jsx
Fontes de dados
Observa:

presentesRef()
pixRef()
entregaRef()
Estado local
presentes
pix
loading
selectedGift
deliveryConfig
toast
Modal de entrega expandido
Quando o utilizador clica em comprar um presente:

setSelectedGift(gift)
abre um modal overlay com backdrop
o modal lê deliveryConfig, vindo de config/entrega
Campos usados no modal
deliveryConfig.titulo
deliveryConfig.mensagem
deliveryConfig.endereco
deliveryConfig.botaoCancelar
deliveryConfig.botaoContinuar
Função copyAddress()
Nova funcionalidade introduzida:

valida deliveryConfig.endereco
usa navigator.clipboard.writeText(deliveryConfig.endereco)
mostra toast:
sucesso: "Endereço copiado."
erro: "Não foi possível copiar o endereço."
continueToStore()
se selectedGift.linkCompra não existir:
mostra "Este presente ainda não possui link de loja."
caso exista:
window.open(selectedGift.linkCompra, "_blank", "noopener,noreferrer")
fecha o modal
PIX
A seção PIX continua com copyPix(), mas agora todo o bloco também usa whitespace-pre-line para respeitar quebras de linha em pix.mensagem e metadados.

Whitespace e parágrafos
whitespace-pre-line foi aplicado em:

presentesDescricao
pix.mensagem
pixMeta
deliveryConfig.mensagem
deliveryConfig.endereco
Comportamento de disponibilidade
Se gift.reservado for verdadeiro:

mostra badge "Já reservado"
desativa CTA
usa styles.disabledButtonCompact
Outros componentes públicos com whitespace-pre-line
A aplicação hoje respeita quebras de linha configuradas no CMS também em:

src/components/Hero.jsx
src/components/Historia.jsx
src/components/BlocoExtra.jsx
src/components/Footer.jsx
src/components/RSVP.jsx
src/components/Presentes.jsx
Isto significa que o conteúdo editorial agora pode ser escrito com blocos multiline no admin e chegar ao frontend sem colapsar parágrafos.

7. Painel Administrativo
src/pages/Admin.jsx
Natureza do ficheiro
Continua a ser o maior ponto de concentração de lógica do sistema. Hoje reúne:

autenticação
CRUD de presentes
CRUD de convidados
gestão de status RSVP
métricas
exportação
template de convites
modal de partilha
CMS de conteúdo
CMS do modal de entrega
CMS de cores
CMS de imagens
CMS de tipografia
pesquisa em tempo real de presentes e convidados
Autenticação
Usa:

onAuthStateChanged(auth, ...)
signInWithEmailAndPassword(auth, ...)
signOut(auth)
Abas atuais
presentes
convidados
pix
aparencia
cores-site
midia
tipografia
A branch aparencia-legacy continua no código, mas não está presente em adminTabs.

8. Gestão de Convidados no Admin
Estados relevantes
guestForm
convidados
buscaConvidado
inviteGuest
toast
Métricas
stats usa normalizeGuestStatus(item) para calcular:

guests
confirmed
declined
people
O novo card visual introduzido foi:

Não Comparecerão
Cadastro manual
onSaveGuest(event) agora suporta criação com status inicial:

Confirmado
Não Comparecerá
Pendente
Regras de persistência
Usa:

status: guestStatus
confirmado: getGuestConfirmedFlag(guestStatus)
dataResposta: null se Pendente
presença mínima coerente se Confirmado
getDefaultConfirmedCounts(guest)
Novo helper interno de Admin.jsx que impede inconsistência entre status e contagens.

Regra:

se maxAdultos > 0 e ainda não houver confirmados, assume pelo menos 1 adulto ao marcar como Confirmado
Edição rápida de status
A tabela de convidados hoje possui um select inline por linha.

A mudança chama:

updateGuestStatus(item, event.target.value)
updateGuestStatus(guest, nextStatus)
Regras:

ignora se o status novo for igual ao atual normalizado
grava:
status
confirmado
ultimaAtualizacao
se Confirmado
preenche adultosConfirmados e criancasConfirmadas com base em getDefaultConfirmedCounts
se Pendente ou Não Comparecerá
zera adultosConfirmados
zera criancasConfirmadas
dataResposta
null para Pendente
now para Confirmado ou Não Comparecerá
Badges visuais de status
getGuestStatusMeta(guest) resolve o estado e devolve o estilo correto:

styles.badgeConfirmed
styles.badgeDeclined
styles.badgePending
Pesquisa em tempo real de convidados
Nova funcionalidade.

Estado
const [buscaConvidado, setBuscaConvidado] = useState("");
Lista derivada
const convidadosFiltrados = useMemo(() => {
  const termo = buscaConvidado.trim().toLowerCase();
  if (!termo) return convidados;
  return convidados.filter((item) => item.nome?.toLowerCase().includes(termo));
}, [buscaConvidado, convidados]);
UI
Foi adicionado um input acima da tabela de convidados com placeholder:

Pesquisar convidado por nome...
Se a pesquisa não encontrar nada, a tabela mostra:

Nenhum resultado encontrado para a sua pesquisa.
9. Gestão de Presentes no Admin
Estados relevantes
giftForm
presentes
buscaPresente
Cadastro manual
onSaveGift(event) grava:

...giftForm
lojaNome: giftForm.loja.trim()
reservado: false
reservadoPor: null
dataCriacao: new Date().toISOString()
Pesquisa em tempo real de presentes
Nova funcionalidade.

Estado
const [buscaPresente, setBuscaPresente] = useState("");
Lista derivada
const presentesFiltrados = useMemo(() => {
  const termo = buscaPresente.trim().toLowerCase();
  if (!termo) return presentes;

  return presentes.filter((item) => {
    const nome = item.nome?.toLowerCase() || "";
    const loja = (item.loja || item.lojaNome || "").toLowerCase();
    return nome.includes(termo) || loja.includes(termo);
  });
}, [buscaPresente, presentes]);
UI
Foi introduzido um input acima da listagem com placeholder:

Pesquisar presente ou loja...
A pesquisa é:

case-insensitive
por nome
por loja ou lojaNome
Sem resultados, o admin mostra:

Nenhum resultado encontrado para a sua pesquisa.
Exportação de presentes
Continua intacta.

exportPresentesAsXlsx()
exportPresentesAsPdf()
A pesquisa não altera a exportação, que continua a trabalhar sobre o array completo presentes.

10. Convites VIP no Admin
Admin.jsx mantém um subsistema de convites com:

makeInviteId(nome)
siteUrl(conviteId)
buildInviteMessage(template, guest)
openInvite(guest)
copyInviteText()
downloadPosterImage()
shareInvite()
Regras principais
conviteId é slugificado e recebe suffix único
o link final é construído como ?id=<conviteId>
o template substitui [NOME] e [LINK]
se o convidado ainda não tiver conviteId, openInvite() grava-o em Firestore
Partilha
O modal de convite permite:

copiar texto
baixar cartaz
partilha nativa com navigator.share, quando disponível
abertura direta do WhatsApp com query text
11. CMS do Modal de Entrega
Localização no Admin
Fica dentro de ContentCmsTab(...), em src/pages/Admin.jsx.

Campos editáveis
titulo
botaoContinuar
mensagem
endereco
botaoCancelar
Persistência
onSaveEntrega(event) grava em:

artifacts/casamento-miqueias/public/data/config/entrega
com merge:

setDoc(entregaRef(), { ...entrega, ultimaAtualizacao: new Date().toISOString() }, { merge: true })
Acoplamento com o frontend
O modal do frontend em Presentes.jsx é inteiramente guiado por esse documento. Ou seja:

o admin controla o título
controla o texto
controla o endereço mostrado
controla os rótulos dos botões
e o frontend adiciona sobre isso a funcionalidade operacional de Copiar Endereço
12. Tipografia Global
src/providers/TypographyProvider.jsx observa config/tipografia e aplica as mudanças a toda a aplicação.

Pipeline atual
listener em tipografiaRef()
merge com DEFAULT_TYPOGRAPHY
ensureGoogleFont(fontFamily) para fontes não-sistema
applyTypographyVariables(typography) em document.documentElement
Variáveis CSS escritas
--font-titulos
--font-textos
--font-destaques
--color-titulos
--color-textos
--color-destaques
--size-h1
--size-h2
--size-h3
--size-h4
--size-h5
--size-h6
--size-p
--size-small
--size-data
--weight-titulos
--weight-textos
--weight-destaques
--lh-titulos
--lh-geral
--lh-destaques
--ls-titulos
--ls-textos
--ls-destaques
Implicação arquitetural
A tipografia é global e sistémica. Alterar os nomes dessas variáveis ou os seletores que as consomem em src/index.css afeta todo o site.

13. Cores e Aparência Pública
As cores públicas continuam centralizadas em config/conteudo, não em config/tipografia.

Campos principais:

corFundoGlobal
corFundoRSVP
corFundoLocalArea
corFundoContagemArea
corFundoContagemCards
corFundoPix
corFundoFooter
Aplicações importantes:

App.jsx aplica corFundoGlobal ao shell e ao body
RSVP.jsx aplica corFundoRSVP
Presentes.jsx aplica corFundoPix
Local.jsx, Contagem.jsx e Footer.jsx usam os seus respetivos campos
14. Exportação
src/utils/adminExport.js continua simples e estável.

Excel
exportRowsToXlsx({ baseName, sheetName, rows })

cria workbook
converte JSON para worksheet
salva com nome <baseName>-YYYY-MM-DD.xlsx
PDF
exportRowsToPdf({ baseName, title, head, body })

cria jsPDF
desenha título
usa jspdf-autotable
salva como <baseName>-YYYY-MM-DD.pdf
Atualização recente relacionada a RSVP
As exportações de convidados no Admin.jsx foram atualizadas para usar normalizeGuestStatus(item) antes de montar linhas.

Isto garante que o export respeita:

Confirmado
Não Comparecerá
Pendente
inclusive para documentos legados que só tinham o booleano confirmado.

15. Regras de Negócio Consolidadas
Presentes
podem estar reservados ou disponíveis
reserva transacional ainda existe em src/services/presentes.js
o frontend atual não executa reserva automática; apenas encaminha para loja
RSVP
trabalha sobre documentos já existentes
o convidado pode:
confirmar presença
recusar presença
o admin pode:
criar com qualquer estado inicial
alterar o estado posteriormente
o sistema preserva compatibilidade com registos antigos
Conteúdo editorial
multiline agora é respeitado por whitespace-pre-line
isso vale para textos vindos do Firestore em vários componentes públicos
Admin
exportação continua independente dos filtros visuais
filtros de pesquisa afetam apenas renderização da lista
métricas usam os arrays completos observados
16. Zonas de Atenção
src/pages/Admin.jsx continua monolítico
Ainda é o principal risco estrutural do projeto:

muito estado local
muitos listeners
múltiplas responsabilidades
lógica de negócio e UI muito acopladas
Coexistência entre acesso direto e services
O projeto continua com duas abordagens:

acesso direto ao Firestore nos componentes
helpers em src/services/*.js
Isto aumenta o risco de divergência de contrato.

App.jsx e o flag isFirebaseLoaded
A correção do FOUC resolveu o boot visual, mas a abordagem continua baseada em estado derivado manual. Mudanças futuras no fluxo de loading devem ser feitas com cuidado para não reintroduzir flash de conteúdo.

Strings literais de negócio
O sistema ainda compara várias strings textuais em runtime:

"#admin"
placeholders [NOME] e [LINK]
labels de status de RSVP
O utilitário guestStatus.js melhorou esse cenário no domínio de convidados, mas a app ainda depende de algumas convenções literais.

17. Guia de Manutenção
Para adicionar um novo campo ao CMS
Adicionar em defaultSiteConfig em src/config/siteConfig.js
Garantir merge por normalizeSiteConfig(data)
Expor no admin:
cmsSectionGroups
siteColorFields
MediaImagesTab
ou outro formulário específico
Consumir no componente público correto
Aplicar fallback local
Para expandir os estados de RSVP
Hoje o ponto correto é src/utils/guestStatus.js.

Se surgir um novo estado, é necessário atualizar:

GUEST_STATUS
normalizeGuestStatus(guest)
getGuestConfirmedFlag(status)
RSVP.jsx
Admin.jsx
exportação de convidados
badges visuais do admin
Para alterar o modal de entrega
Os pontos reais são:

defaults em src/config/deliveryConfig.js
formulário em ContentCmsTab(...) dentro de Admin.jsx
renderização operacional em src/components/Presentes.jsx
Para mexer no boot/loading
Os pontos reais são:

contentReady
imagesReady
isFirebaseLoaded
LoadingScreen
PublicPage
efeitos de sincronização do body em App.jsx
18. Resumo Executivo da Arquitetura Atual
O sistema atual está num estágio mais maduro do que a versão anterior documentada. Em particular:

o RSVP deixou de ser binário implícito e passou a ter um domínio explícito de estados
o frontend público ganhou robustez visual no arranque com uma estratégia clara contra FOUC
o CMS passou a respeitar melhor conteúdo multiline graças a whitespace-pre-line
o modal de entrega tornou-se mais útil operacionalmente com Copiar Endereço
o admin melhorou a usabilidade com pesquisa em tempo real para convidados e presentes
a exportação foi alinhada ao novo modelo de status sem quebrar registos antigos
A base continua funcional e bem conectada ao Firestore, mas o maior ponto de dívida técnica permanece o tamanho e a concentração de responsabilidades em src/pages/Admin.jsx.
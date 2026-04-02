# ARQUITETURA

## 1. VISÃO GERAL DO SISTEMA

Este projeto é um site público de casamento com painel administrativo embutido na mesma aplicação React. A aplicação funciona como um CMS headless simplificado: o conteúdo, a visibilidade das secções, as imagens, a tipografia, o PIX, o modal de entrega e o template de convites são persistidos no Firestore; o frontend público apenas observa esses documentos e rendeiriza a experiência em tempo real.

### Stack real encontrada no código

- `React 18.3.1`
- `Vite 8`
- `Tailwind CSS v4` via `@import "tailwindcss"` em `src/index.css`
- `Firebase Auth` para acesso ao painel admin
- `Firebase Firestore` para estado persistente
- `xlsx` para exportação Excel
- `jspdf` + `jspdf-autotable` para exportação PDF
- Dependência instalada mas não utilizada na aplicação atual: `react-router-dom`

### Topologia da app

```text
src/
  App.jsx
  main.jsx
  index.css
  firebase/
    firebase.js
  config/
    siteConfig.js
    siteImages.js
    deliveryConfig.js
  providers/
    TypographyProvider.jsx
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
    presentes.js
    convidados.js
  utils/
    adminExport.js
```

### Papel de cada núcleo

- `src/App.jsx`: orquestrador principal. Decide entre visão pública e admin, observa `config/conteudo` e `config/imagens`, controla hash `#admin` e monta a página pública por secções.
- `src/pages/Admin.jsx`: painel de gestão manual. Faz autenticação, mantém listeners Firestore, salva documentos de configuração e exporta listas.
- `src/providers/TypographyProvider.jsx`: observa `config/tipografia`, injeta Google Fonts dinamicamente e escreve variáveis CSS em `:root`.
- `src/config/siteConfig.js`: contrato central do CMS público. Mistura conteúdo editorial, toggles de visibilidade e cores de fundo.
- `src/components/*`: componentes públicos consumindo `siteConfig`, `siteImages`, `pix`, `entrega` e `convidados`.
- `src/utils/adminExport.js`: módulo isolado de exportação para Excel e PDF.

### Arquitetura funcional

- O frontend público não tem roteamento formal; alterna entre `public` e `admin` através de `window.location.hash`.
- O estado principal do site não é buscado via REST nem via server actions; é lido com `onSnapshot`, o que dá comportamento reativo quase em tempo real.
- O painel admin e o site público partilham a mesma base de código e o mesmo bundle.
- O padrão predominante de UI é híbrido:
  - site público: `inline styles` com valores dinâmicos vindos do Firestore;
  - painel admin: classes Tailwind v4 combinadas com alguns objetos `styles` inline legados.

### Artefactos órfãos ou subutilizados

- `src/pages/Home.jsx` está vazio.
- `src/components/FadeInSection.jsx` existe, mas não há referências a ele no resto de `src/`.
- `src/services/*.js` encapsulam Firestore, mas o painel e alguns componentes também acedem Firestore diretamente, criando duas camadas de acesso coexistentes.

## 2. REGRAS DE NEGÓCIO

### Sistema de presentes

O catálogo de presentes é lido da coleção `presentes`. Cada presente pode estar disponível ou reservado.

### Estado do presente

- Um item é tratado como indisponível no frontend quando `Boolean(gift?.reservado)` é verdadeiro em `src/components/Presentes.jsx`.
- Quando indisponível:
  - aparece o badge `"Já reservado"`;
  - o botão usa `styles.disabledButtonCompact`;
  - o CTA muda para `safeSiteConfig?.presentesBotaoIndisponivel || "Indisponível"`;
  - o clique para abrir o modal deixa de estar disponível porque o botão fica `disabled`.

### Estado inicial ao criar presente

Ao criar um presente no admin, `onSaveGift` grava:

- `reservado: false`
- `reservadoPor: null`
- `dataCriacao: new Date().toISOString()`
- `lojaNome: giftForm.loja.trim()`

Além dos campos do formulário:

- `nome`
- `valor`
- `loja`
- `linkCompra`
- `imagem`

### Regras de reserva por transação

Existe uma implementação transacional em `src/services/presentes.js` via `reservarPresenteTransacao(id, nomeConvidado)`.

- A função usa `runTransaction(db, async (transaction) => ...)`.
- Se o documento não existir, lança `"Item inexistente no sistema."`.
- Se `presenteDoc.data().reservado === true`, lança `"Este item já foi reservado por outra pessoa."`.
- Em caso de sucesso, atualiza:
  - `reservado: true`
  - `reservadoPor: nomeConvidado`
  - `dataReserva: new Date().toISOString()`

Observação importante: essa função existe, mas o fluxo atualmente usado pelo componente `Presentes.jsx` não faz reserva automática. O componente apenas abre o modal e, se houver `linkCompra`, encaminha para a loja. Portanto, a compra e a marcação de reserva não estão acopladas no frontend público atual.

### Modal de Entrega

O modal de entrega é um interceptador obrigatório antes de abrir a loja de um presente.

Fluxo em `src/components/Presentes.jsx`:

- clicar em `"Comprar presente"` executa `setSelectedGift(gift)`;
- quando `selectedGift` existe, é aberto um overlay `className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"`;
- o modal lê conteúdo do documento `config/entrega`, normalizado por `normalizeDeliveryConfig()`;
- o botão de continuar chama `continueToStore()`;
- `continueToStore()`:
  - impede continuação se `selectedGift?.linkCompra` estiver vazio;
  - mostra toast `"Este presente ainda não possui link de loja."`;
  - caso exista link, faz `window.open(selectedGift.linkCompra, "_blank", "noopener,noreferrer")` e fecha o modal.

### Dados editáveis do modal

O admin grava em `config/entrega` os campos:

- `titulo`
- `mensagem`
- `endereco`
- `botaoCancelar`
- `botaoContinuar`
- `ultimaAtualizacao`

### Toggles de visibilidade

Os toggles do site vivem em `siteConfig` e são processados por `getSectionVisibility(config)` em `src/config/siteConfig.js`.

Regras:

- `mostrarHero !== false`
- `mostrarContagem !== false`
- `mostrarHistoria !== false`
- `mostrarLocal !== false`
- `mostrarRSVP !== false`
- `mostrarPresentes !== false`
- `mostrarBlocoExtra === true`
- `mostrarGaleriaPos === true`

Implicação prática:

- Hero, Contagem, História, Local, RSVP e Presentes são opt-out.
- Bloco Extra e Galeria Pós-Casamento são opt-in.

Em `src/App.jsx`, `publicSections` é montado por esta ordem:

1. `hero`
2. `contagem`
3. `historia`
4. `local`
5. `rsvp`
6. `presentes`
7. `bloco-extra`
8. `galeria-pos`

Se uma secção estiver desativada, ela simplesmente não entra no array e não é renderizada.

## 3. ARQUITETURA DE ESTADO E DADOS

### Firebase e caminhos reais

Configuração Firebase em `src/firebase/firebase.js`:

- app inicializada com `initializeApp(firebaseConfig)` ou reaproveitada com `getApp()`;
- Firestore exposto como `db`;
- Auth exposto como `auth`;
- identificador lógico do artefacto: `appId = "casamento-miqueias"`.

Todos os caminhos persistidos são ancorados em:

```text
artifacts/casamento-miqueias/public/data
```

### Documentos e coleções observados no runtime

Coleções:

- `artifacts/casamento-miqueias/public/data/presentes`
- `artifacts/casamento-miqueias/public/data/convidados`

Documentos de configuração:

- `artifacts/casamento-miqueias/public/data/config/pix`
- `artifacts/casamento-miqueias/public/data/config/conteudo`
- `artifacts/casamento-miqueias/public/data/config/entrega`
- `artifacts/casamento-miqueias/public/data/config/convites`
- `artifacts/casamento-miqueias/public/data/config/tipografia`
- `artifacts/casamento-miqueias/public/data/config/imagens`

### Modelo de sincronização

O padrão dominante é `onSnapshot(...)`.

Pontos de escuta:

- `src/App.jsx`
  - `conteudoRef()` para `siteConfig`
  - `imagensRef()` para `siteImages`
- `src/providers/TypographyProvider.jsx`
  - `tipografiaRef()` para tipografia global
- `src/pages/Admin.jsx`
  - `presentesRef()`
  - `convidadosRef()`
  - `pixRef()`
  - `conteudoRef()`
  - `entregaRef()`
  - `convitesRef()`
  - `tipografiaRef()`
  - `imagensRef()`
- `src/components/Presentes.jsx`
  - `presentesRef()`
  - `pixRef()`
  - `entregaRef()`
- `src/components/RSVP.jsx`
  - `convidadosRef()`

Consequência arquitetural:

- o painel e o site público convergem sobre o mesmo backend reativo;
- alterações no painel são refletidas sem refresh total;
- não existe camada intermediária de API própria.

### Fallbacks de segurança

O código usa três mecanismos principais de hardening:

1. `normalize*`

- `normalizeSiteConfig(data)`
- `normalizeDeliveryConfig(data)`
- `mergeImageConfig(data)`
- `mergeTypography(data)`

Essas funções fazem merge de defaults estáticos com dados incompletos vindos do Firestore.

2. Optional chaining e OR lógico

Exemplos recorrentes:

- `siteConfig?.localTitulo || defaultLocal.titulo`
- `safeSiteConfig?.presentesTitulo || "Presentes e contribuições"`
- `safeSiteConfig?.corFundoGlobal?.trim() || "#fffdf8"`

3. `snapshot.exists() ? ... : fallback`

Exemplos:

- `snapshot.exists() ? normalizeSiteConfig(snapshot.data()) : defaultSiteConfig`
- `snapshot.exists() ? mergeImageConfig(snapshot.data()) : emptyImageConfig`
- `snapshot.exists() ? normalizeDeliveryConfig(snapshot.data()) : emptyEntrega`

### Estrutura de dados exata esperada pelo Firestore

#### `config/conteudo`

Documento central do CMS. É o contrato mais importante da app.

Campos observados em `defaultSiteConfig` e componentes:

```text
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
ultimaAtualizacao
```

Observações:

- `presentesBotaoLoja` existe em `defaultSiteConfig`, mas não foi encontrado em uso nos componentes atuais.
- `blocoExtraImagem`, `galeriaImagem1`, `galeriaImagem2` e `galeriaImagem3` coexistem com `config/imagens`; os componentes normalmente tentam primeiro `siteImages`, depois `siteConfig`.

#### `config/pix`

Campos lidos e escritos:

```text
chavePix
banco
titular
mensagem
ultimaAtualizacao
```

#### `config/entrega`

Campos:

```text
titulo
mensagem
endereco
botaoCancelar
botaoContinuar
ultimaAtualizacao
```

#### `config/convites`

Campos:

```text
mensagemPadrao
urlCartaz
ultimaAtualizacao
```

`mensagemPadrao` suporta placeholders literais:

- `[NOME]`
- `[LINK]`

#### `config/tipografia`

Estrutura esperada:

```text
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
```

#### `config/imagens`

Campos:

```text
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
```

#### Coleção `presentes`

Campos lidos e/ou escritos no código:

```text
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
```

#### Coleção `convidados`

Campos lidos e/ou escritos no código:

```text
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
```

Observação importante:

- `src/pages/Admin.jsx` cria convidados no formato de lista fechada, com `conviteId`, limites e confirmação estruturada.
- `src/services/convidados.js` mantém uma função `registrarPresenca(dados)` que grava `dataRegisto`, mas esse fluxo não é o principal do RSVP atual. O componente `RSVP.jsx` trabalha sobre documentos já existentes e atualiza o mesmo documento com `updateDoc`.

## 4. FLUXO DE RENDERIZAÇÃO E UI

### Bootstrapping da aplicação

`src/main.jsx` monta `App` dentro de `React.StrictMode`.

`src/App.jsx` controla:

- `view`: `"public"` ou `"admin"`
- `siteConfig`
- `siteImages`
- `contentReady`
- `imagesReady`

### Seleção entre público e admin

`getInitialView()` devolve:

- `"admin"` quando `window.location.hash === "#admin"`
- `"public"` caso contrário

Há dois efeitos complementares:

- um `hashchange` listener para manter o estado sincronizado com a URL;
- um efeito que força/remova `#admin` quando `view` muda.

### Renderização pública

A página pública é montada dentro de `PublicPage`.

Ordem de composição:

- `Navbar`
- `main`
- secções condicionais de `publicSections`
- `Footer`

Cada secção recebe `siteConfig` já normalizado e, quando aplicável, `siteImages` já normalizado.

### Tipografia dinâmica

O mecanismo tipográfico não usa Styled Components. Ele usa:

- `TypographyProvider` para ouvir `config/tipografia`;
- `applyTypographyVariables(typography)` para gravar CSS custom properties em `document.documentElement`;
- regras globais em `src/index.css` para consumir essas variáveis.

Variáveis realmente escritas:

```text
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
```

Seletores globais que consomem essas variáveis:

- `body`
- `h1` a `h6`
- `p, li`
- `span, div`
- `small, time, .typography-accent, strong.typography-accent`
- `#inicio p`
- `footer p:nth-of-type(2)`
- `footer p:first-of-type`

### Injeção de Google Fonts

`TypographyProvider` também chama `ensureGoogleFont(fontFamily)`.

Regras:

- se a fonte for de sistema, nada é injetado;
- se for custom, é criado um `<link rel="stylesheet">` para `fonts.googleapis.com`;
- o link é deduplicado por `data-google-font="<slug>"`.

### Cores de fundo por secção

Aqui há uma distinção importante.

Tipografia:

- usa variáveis CSS globais.

Fundos de secção:

- não usam Styled Components;
- também não usam classes Tailwind parametrizadas;
- são aplicados principalmente por `inline style`, com valor vindo de `siteConfig`.

Campos atuais:

- `corFundoGlobal`
- `corFundoRSVP`
- `corFundoLocalArea`
- `corFundoContagemArea`
- `corFundoContagemCards`
- `corFundoPix`
- `corFundoFooter`

Pontos de aplicação:

- `src/App.jsx`
  - `globalBackgroundColor = safeSiteConfig?.corFundoGlobal?.trim() || "#fffdf8"`
  - esse valor é aplicado em `publicShellStyle(backgroundColor)`
  - também é escrito diretamente em `document.body.style.background` e `document.body.style.backgroundColor`
- `src/components/RSVP.jsx`
  - `rsvpBackground = safeSiteConfig?.corFundoRSVP?.trim() || "linear-gradient(150deg, #2f2b73 0%, #181435 100%)"`
  - aplicado no `aside`
- `src/components/Local.jsx`
  - `localAreaBackgroundColor = siteConfig?.corFundoLocalArea?.trim() || "#0b1b3a"`
  - aplicado apenas na área externa
  - o cartão interno continua controlado por `localCardBackgroundColor`
- `src/components/Contagem.jsx`
  - `areaBackground`
  - `cardBackground`
- `src/components/Presentes.jsx`
  - `pixBackground`
- `src/components/Footer.jsx`
  - `footerBackgroundColor`

### Tailwind v4 na UI

O Tailwind aparece com mais força no painel admin e em alguns componentes públicos mais recentes.

Classes críticas vistas no código:

- `rounded-[32px]`
- `border border-amber-200/60`
- `bg-white/80`
- `shadow-xl shadow-slate-900/5`
- `backdrop-blur`
- `bg-indigo-950`
- `rounded-2xl`
- `md:grid-cols-2`
- `fixed inset-0 z-50`
- `grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5`

### Imagens

Imagens são resolvidas por `resolveImageSource(...sources)` em `src/config/siteImages.js`.

Padrão:

- usa a primeira string não vazia encontrada;
- o componente pode tentar `siteImages`, depois `siteConfig`, depois fallback local.

Exemplos:

- Hero: `safeSiteImages?.heroBanner` -> `imageFallbacks.heroBanner`
- História: `safeSiteImages?.historiaCard1` -> `safeSiteConfig?.historiaCard1Imagem` -> fallback
- Bloco extra e galeria: primeiro `config/imagens`, depois `config/conteudo`

## 5. PAINEL ADMIN E EXPORTAÇÃO

### Autenticação do admin

`src/pages/Admin.jsx` usa Firebase Auth:

- `onAuthStateChanged(auth, ...)`
- `signInWithEmailAndPassword(auth, email, password)`
- `signOut(auth)`

Se não houver utilizador autenticado, o componente renderiza apenas o cartão de login.

### Abas atuais do admin

`adminTabs` contém:

- `presentes`
- `convidados`
- `pix`
- `aparencia`
- `cores-site`
- `midia`
- `tipografia`

Existe ainda uma branch `activeTab === "aparencia-legacy"`, mas ela não está listada em `adminTabs`, logo está fora da navegação atual. É código legado/dormante.

### O que cada aba faz

#### `presentes`

- cria presentes manualmente;
- lista presentes existentes;
- exporta XLSX e PDF;
- remove presentes.

#### `convidados`

- cria convidados da lista fechada;
- define `conviteId` por `makeInviteId(nome)`;
- mostra listagem com status;
- exporta XLSX e PDF;
- abre modal de convite VIP;
- permite configurar `config/convites`.

#### `pix`

- edita o documento `config/pix`.

#### `aparencia`

É o CMS principal de conteúdo e toggles.

Subgrupos definidos em `cmsSectionGroups`:

- `toggles`
- `hero`
- `historia`
- `local`
- `rsvp`
- `presentes`
- `extra`

Além disso, a mesma área contém o formulário separado para `config/entrega`.

#### `cores-site`

É a área exclusiva de fundos públicos.

Campos:

- `corFundoGlobal`
- `corFundoRSVP`
- `corFundoLocalArea`
- `corFundoContagemArea`
- `corFundoContagemCards`
- `corFundoPix`
- `corFundoFooter`

Cada card mostra:

- label humana;
- preview visual;
- `input type="color"`;
- campo textual;
- fallback original documentado.

#### `midia`

Edita `config/imagens` com previews:

- `heroBanner`
- `historiaCard1`
- `historiaCard2`
- `historiaCard3`
- `galeriaImagem1`
- `galeriaImagem2`
- `galeriaImagem3`
- `blocoExtraImagem`
- `rodapeBackground`

#### `tipografia`

Edita `config/tipografia` por grupos:

- `titulos`
- `textos`
- `destaques`

Cada grupo expõe:

- `fontFamily`
- `color`
- `fontSize`
- `fontWeight`
- `lineHeight`
- `letterSpacing`

### Convites VIP

O admin implementa um subsistema próprio em `Admin.jsx`.

Funções-chave:

- `makeInviteId(nome)`
- `siteUrl(conviteId)`
- `buildInviteMessage(template, guest)`
- `copyInviteText()`
- `downloadPosterImage()`
- `shareInvite()`
- `openInvite(guest)`

Comportamento:

- `conviteId` é slugificado com remoção de acentos e suffix aleatório;
- o link final usa query string `?id=<conviteId>`;
- `mensagemPadrao` substitui `[NOME]` e `[LINK]`;
- se `guest` ainda não tiver `conviteId`, `openInvite` grava um via `updateDoc`;
- o modal permite copiar texto, baixar cartaz, partilhar nativamente e enviar para WhatsApp.

### Exportação isolada

O módulo de exportação fica em `src/utils/adminExport.js`.

#### Excel

Função:

- `exportRowsToXlsx({ baseName, sheetName, rows })`

Implementação:

- `XLSX.utils.book_new()`
- `XLSX.utils.json_to_sheet(rows || [])`
- `XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)`
- `XLSX.writeFile(workbook, "<nome>-YYYY-MM-DD.xlsx")`

#### PDF

Função:

- `exportRowsToPdf({ baseName, title, head, body })`

Implementação:

- cria `new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })`
- escreve título em `(40, 40)`
- usa `autoTable(pdf, { ... })`
- `headStyles.fillColor = [36, 27, 47]`
- `alternateRowStyles.fillColor = [248, 244, 238]`
- guarda como `"<nome>-YYYY-MM-DD.pdf"`

### Princípio de Lockout

O painel admin não consome as próprias cores editáveis do site público.

No código atual, isso é visível em dois aspetos:

- a aba `Cores do Site` grava apenas `config/conteudo`, mas o admin continua com o seu próprio conjunto de estilos Tailwind/inline;
- o texto da aba explicita a intenção: `"O painel admin permanece com visual estático por segurança de contraste e navegação."`

Razão arquitetural:

- se o admin também lesse cores editáveis do Firestore, uma escolha inválida de contraste poderia dificultar ou até bloquear a manutenção da aplicação;
- o projeto opta por manter o painel como zona operacional segura, separada do tema do site público.

## 6. GUIA DE MANUTENÇÃO (HAND-OFF)

### Como adicionar um novo campo ao CMS

Fluxo recomendado para um novo campo editorial:

1. Declarar o campo em `src/config/siteConfig.js`.
2. Definir o valor default em `defaultSiteConfig`.
3. Garantir que `normalizeSiteConfig(data)` continua a fazer merge automaticamente.
4. Expor o campo no admin:
   - se for conteúdo/toggle, adicionar em `cmsSectionGroups` dentro de `src/pages/Admin.jsx`;
   - se for cor pública de fundo, adicionar em `siteColorFields`;
   - se for imagem, adicionar na aba `MediaImagesTab` e, se necessário, em `src/config/siteImages.js`.
5. Consumir o campo no componente público correspondente.
6. Aplicar fallback local no componente com `?.trim() || "valor-original"` ou equivalente.
7. Se o campo precisar de exportação, refletir a mudança na montagem de `rows` ou `body` em `Admin.jsx`.

### Como adicionar um novo grupo tipográfico

Hoje o sistema assume explicitamente três grupos:

- `titulos`
- `textos`
- `destaques`

Para adicionar outro:

1. atualizar `DEFAULT_TYPOGRAPHY` em `TypographyProvider.jsx`;
2. atualizar `mergeTypography`;
3. expandir `applyTypographyVariables`;
4. criar novos consumidores em `index.css`;
5. expandir a aba `TypographyProfessionalTab`.

Sem todos esses passos, o novo grupo ficará persistido mas não aplicado visualmente.

### Como adicionar uma nova secção pública

Pontos de alteração:

1. componente novo em `src/components/`;
2. novo toggle em `defaultSiteConfig` e `getSectionVisibility`;
3. inclusão ordenada em `publicSections` dentro de `src/App.jsx`;
4. inclusão opcional em `publicNavItems`;
5. campos de CMS em `cmsSectionGroups`;
6. se houver imagens, também em `config/imagens` e `MediaImagesTab`.

### Zonas de perigo

#### 1. `Admin.jsx` é um ficheiro monolítico

Riscos:

- mistura autenticação, CRUD, CMS, convite VIP, exportação, media e tipografia;
- é fácil introduzir regressões transversais ao editar handlers ou estados locais;
- o ficheiro contém blocos legados como `aparencia-legacy`.

#### 2. Dualidade de acesso ao Firestore

Existem dois estilos simultâneos:

- acesso direto nos componentes/painel;
- acesso encapsulado em `src/services/*.js`.

Risco:

- um programador pode alterar um contrato num serviço e esquecer o acesso direto, ou vice-versa.

#### 3. Modal fixo de entrega

O overlay de `Presentes.jsx` usa:

- `className="fixed inset-0 z-50 ..."`
- clique no backdrop para fechar;
- `stopPropagation()` no cartão.

Riscos:

- qualquer alteração em `z-index`, overflow ou foco pode quebrar scroll, fecho por clique externo ou visibilidade do modal.

#### 4. Injeção global de CSS variables

`TypographyProvider` escreve diretamente em `document.documentElement.style`.

Riscos:

- mudanças de naming em `--font-*`, `--color-*`, `--size-*` quebram o site inteiro;
- seletores globais como `span, div` em `index.css` têm alcance muito amplo;
- qualquer refactor de tipografia deve ser tratado como mudança sistémica, não local.

#### 5. Injeção de Google Fonts em runtime

Riscos:

- dependência de rede para fontes não-sistema;
- nomes malformados podem gerar links inválidos;
- o algoritmo assume que a primeira família antes da vírgula é a principal.

#### 6. Cores públicas com `input type="color"`

Os fundos públicos aceitam strings livres no Firestore, mas o painel usa `type="color"` para facilitar casos hexadecimais.

Implicação:

- o campo textual permite valores não-hex, incluindo gradients;
- o `type="color"` só representa bem valores hexadecimais;
- por isso os componentes públicos usam fallback com `.trim() || ...` e não dependem de defaults já preenchidos no Firestore.

#### 7. Query string de convites

O RSVP automático depende de `window.location.search` e do parâmetro `id`.

Riscos:

- qualquer refactor de URL precisa preservar `?id=<conviteId>`;
- se o nome do parâmetro mudar, `getGuestQueryId()` deixa de localizar convites.

#### 8. Dependência de campos literais

Grande parte do sistema compara strings fixas:

- `status === "Confirmado"`
- `window.location.hash === "#admin"`
- placeholders `[NOME]` e `[LINK]`

Risco:

- alterar essas strings sem mapear todos os consumidores gera bugs silenciosos.

### Recomendações práticas para futuro programador

- Tratar `src/config/siteConfig.js` como schema de facto do CMS.
- Antes de adicionar UI nova, confirmar se o dado já não existe em `config/conteudo`, `config/imagens` ou `config/tipografia`.
- Preferir criar componentes/tabs menores no admin antes de expandir ainda mais `Admin.jsx`.
- Se a app passar a reservar presentes de forma automática no site público, reutilizar `reservarPresenteTransacao()` em vez de criar atualização ingênua sem transação.
- Se houver refactor de rotas, preservar a semântica de `#admin` e `?id=<conviteId>` ou migrar ambos de forma coordenada.

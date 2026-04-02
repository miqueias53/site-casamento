import { useEffect, useState } from "react";

const dataCasamento = new Date("2026-07-11T00:00:00");

export default function Contagem({ siteConfig }) {
const safeSiteConfig = siteConfig ?? {};
const areaBackground = safeSiteConfig?.corFundoContagemArea?.trim() || "#fafafa";
const cardBackground = safeSiteConfig?.corFundoContagemCards?.trim() || "#fff";

const [tempo, setTempo] = useState({
dias: 0,
horas: 0,
minutos: 0,
segundos: 0
});

useEffect(() => {

function atualizarContagem() {

const agora = new Date();
const diferenca = dataCasamento - agora;

if (diferenca <= 0) return;

const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
const horas = Math.floor((diferenca / (1000 * 60 * 60)) % 24);
const minutos = Math.floor((diferenca / (1000 * 60)) % 60);
const segundos = Math.floor((diferenca / 1000) % 60);

setTempo({ dias, horas, minutos, segundos });

}

atualizarContagem();

const intervalo = setInterval(atualizarContagem, 1000);

return () => clearInterval(intervalo);

}, []);

return (

<section style={{
padding: "100px 20px",
textAlign: "center",
background: areaBackground
}}>

<h2 style={{
fontSize: "32px",
marginBottom: "10px",
fontFamily: "serif"
}}>
Contagem para o grande dia
</h2>

<p style={{
color: "#777",
marginBottom: "40px"
}}>
Estamos contando cada instante…
</p>

<div style={{
display: "flex",
justifyContent: "center",
gap: "30px",
flexWrap: "wrap"
}}>

{[
{ valor: tempo.dias, label: "Dias" },
{ valor: tempo.horas, label: "Horas" },
{ valor: tempo.minutos, label: "Min" },
{ valor: tempo.segundos, label: "Seg" }
].map((item, index) => (

<div
key={index}
style={{
background: cardBackground,
padding: "25px",
borderRadius: "12px",
minWidth: "90px",
boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
textAlign: "center",
transition: "0.3s",
cursor: "default"
}}
onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-10px)"}
onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
>

<h1 style={{
fontSize: "36px",
marginBottom: "5px"
}}>
{item.valor}
</h1>

<p style={{
fontSize: "14px",
color: "#777"
}}>
{item.label}
</p>

</div>

))}

</div>

</section>

);

}

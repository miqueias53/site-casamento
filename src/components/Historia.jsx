import { useEffect, useMemo, useState } from "react";
import { imageFallbacks, resolveImageSource } from "../config/siteImages.js";

const defaultItems = [
  {
    img: imageFallbacks.historiaCard1,
    titulo: "O começo",
    texto: "Tudo começou quando nossos caminhos se cruzaram pela primeira vez.",
  },
  {
    img: imageFallbacks.historiaCard2,
    titulo: "Momentos especiais",
    texto: "Entre risadas, sonhos e muitos momentos inesquecíveis, fomos construindo nossa história.",
  },
  {
    img: imageFallbacks.historiaCard3,
    titulo: "O pedido",
    texto: "E então chegou o momento em que decidimos caminhar juntos para sempre.",
  },
];

export default function Historia({ siteConfig, siteImages }) {
  const [show, setShow] = useState(false);
  const safeSiteConfig = useMemo(() => siteConfig ?? {}, [siteConfig]);
  const safeSiteImages = useMemo(() => siteImages ?? {}, [siteImages]);
  const cardBackgroundColor = safeSiteConfig?.historiaCardBackgroundColor || "#fffaf2";

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 200);
    return () => window.clearTimeout(timer);
  }, []);

  const itens = useMemo(
    () => [
      {
        img: resolveImageSource(safeSiteImages?.historiaCard1, safeSiteConfig?.historiaCard1Imagem, defaultItems[0].img),
        titulo: safeSiteConfig?.historiaCard1Titulo || defaultItems[0].titulo,
        texto: safeSiteConfig?.historiaCard1Texto || defaultItems[0].texto,
      },
      {
        img: resolveImageSource(safeSiteImages?.historiaCard2, safeSiteConfig?.historiaCard2Imagem, defaultItems[1].img),
        titulo: safeSiteConfig?.historiaCard2Titulo || defaultItems[1].titulo,
        texto: safeSiteConfig?.historiaCard2Texto || defaultItems[1].texto,
      },
      {
        img: resolveImageSource(safeSiteImages?.historiaCard3, safeSiteConfig?.historiaCard3Imagem, defaultItems[2].img),
        titulo: safeSiteConfig?.historiaCard3Titulo || defaultItems[2].titulo,
        texto: safeSiteConfig?.historiaCard3Texto || defaultItems[2].texto,
      },
    ],
    [safeSiteConfig, safeSiteImages]
  );

  return (
    <section
      style={{
        padding: "100px 20px",
        textAlign: "center",
        background: "#fff",
      }}
    >
      <h2
        style={{
          fontSize: safeSiteConfig?.titulosFontSize || "34px",
          marginBottom: "10px",
          fontFamily: safeSiteConfig?.titulosFontFamily || "serif",
          fontWeight: safeSiteConfig?.titulosFontWeight || "600",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(40px)",
          transition: "all 1s ease",
        }}
      >
        {safeSiteConfig?.historiaTitulo || "Nossa História"}
      </h2>

      <p
        style={{
          maxWidth: "600px",
          margin: "0 auto 50px",
          color: "#777",
          fontFamily: safeSiteConfig?.textosFontFamily || "Georgia, serif",
          fontSize: safeSiteConfig?.textosFontSize || "16px",
          fontWeight: safeSiteConfig?.textosFontWeight || "400",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(40px)",
          transition: "all 1s ease",
          transitionDelay: "0.2s",
        }}
      >
        {safeSiteConfig?.historiaDescricao || "Cada passo da nossa história que nos trouxe até o presente momento."}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "28px",
        }}
      >
        {itens.map((item, index) => (
          <article
            key={index}
            style={{
              maxWidth: "320px",
              padding: "20px",
              borderRadius: "24px",
              background: cardBackgroundColor,
              boxShadow: "0 18px 42px rgba(36, 27, 47, 0.08)",
              border: "1px solid rgba(196, 166, 97, 0.14)",
              opacity: show ? 1 : 0,
              transform: show ? "translateY(0)" : "translateY(60px)",
              transition: "all 1s ease",
              transitionDelay: `${0.3 + index * 0.2}s`,
            }}
          >
            <div
              style={{
                overflow: "hidden",
                borderRadius: "18px",
                boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={item?.img || defaultItems[index]?.img}
                alt={item?.titulo || defaultItems[index]?.titulo || "Memória do casal"}
                loading="lazy"
                style={{
                  width: "100%",
                  aspectRatio: "4 / 5",
                  display: "block",
                  objectFit: "cover",
                  objectPosition: "center",
                  transition: "transform 0.5s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "scale(1)";
                }}
                onError={(event) => {
                  event.currentTarget.src = defaultItems[index]?.img || imageFallbacks.historiaCard1;
                }}
              />
            </div>

            <h3
              style={{
                marginTop: "18px",
                fontSize: "20px",
                fontFamily: safeSiteConfig?.titulosFontFamily || "serif",
                fontWeight: safeSiteConfig?.titulosFontWeight || "600",
              }}
            >
              {item?.titulo || defaultItems[index]?.titulo}
            </h3>

            <p
              style={{
                margin: "12px 0 0",
                color: "#555",
                fontSize: safeSiteConfig?.textosFontSize || "14px",
                fontFamily: safeSiteConfig?.textosFontFamily || "serif",
                fontWeight: safeSiteConfig?.textosFontWeight || "400",
              }}
            >
              {item?.texto || defaultItems[index]?.texto}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

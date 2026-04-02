import { useEffect, useRef, useState } from "react";

export default function FadeInSection({ children }) {

const ref = useRef(null);
const [visible, setVisible] = useState(false);

useEffect(() => {

const observer = new IntersectionObserver(
([entry]) => {
if (entry.isIntersecting) {
setVisible(true);
}
},
{ threshold: 0.2 }
);

if (ref.current) {
observer.observe(ref.current);
}

return () => observer.disconnect();

}, []);

return (

<div
ref={ref}
className={`fade-section ${visible ? "visible" : ""}`}
>

{children}

</div>

);

}
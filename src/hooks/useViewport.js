import { useEffect, useState } from "react";

const MOBILE_MAX_WIDTH = 768;
const DESKTOP_MIN_WIDTH = 1024;

function getViewportWidth() {
  if (typeof window === "undefined") {
    return DESKTOP_MIN_WIDTH;
  }

  return window.innerWidth || DESKTOP_MIN_WIDTH;
}

export default function useViewport() {
  const [width, setWidth] = useState(getViewportWidth);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setWidth(window.innerWidth || DESKTOP_MIN_WIDTH);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isSmallMobile: width < 480,
    isMobile: width < MOBILE_MAX_WIDTH,
    isTablet: width >= MOBILE_MAX_WIDTH && width < DESKTOP_MIN_WIDTH,
    isDesktop: width >= DESKTOP_MIN_WIDTH,
  };
}

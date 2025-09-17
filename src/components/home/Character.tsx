"use client";
import { useEffect } from "react";
import { gsap } from "gsap";

export default function Character() {
  useEffect(() => {
    const mouth = document.getElementById("mouth");
    if (!mouth) return;

    // animate when clicked
    mouth.addEventListener("click", () => {
      gsap.to(mouth, {
        scaleY: 0.6,
        y: 3,
        transformOrigin: "center center",
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
      });

      // return to normal after
      gsap.to(mouth, {
        scaleY: 1,
        y: 0,
        delay: 1.2,
        duration: 0.6,
        ease: "power2.out",
      });
    });
  }, []);

  return (
    <svg
      width="400"
      height="400"
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Your character body */}
      <circle cx="200" cy="200" r="150" fill="#FFD700" />

      {/* Mouth with id for GSAP */}
      <path
        id="mouth"
        d="M0 0 C3.06 2.31 3.06 2.31 5 5 C5 5.99 5 6.98 5 8 
           C2.23 7.47 -0.32 6.89 -3 6 
           C-7.38 5.76 -10.17 5.88 -14 8 
           C-15.32 8 -16.64 8 -18 8 
           C-17.62 5.29 -17.21 4.20 -15.18 2.31 
           C-10.62 -0.42 -5.19 -0.84 0 0 Z"
        fill="#402613"
        transform="translate(200,260)"
      />
    </svg>
  );
}

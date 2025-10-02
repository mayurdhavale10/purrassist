"use client";
import React from "react";
// import { useEffect } from "react";
type Person = {
  src: string;              // public path to image
  left: string;             // left position (e.g. "6%", "22%")
  size: number;             // width in px (height auto)
  duration: number;         // seconds to float up (faster now)
  delay: number;            // seconds before starting
  blur?: boolean;           // subtle depth blur for parallax
};

/** Parse various filename formats and handle special casess */
function metaFromFilename(src: string) {
  // get file name only
  const file = src.split("/").pop() ?? "";
  const core = file.replace(/\.(webp|jpg|jpeg|png)$/i, "");
  
  // Handle special cases first
  if (core === "gujrati_girl") {
    return { display: "Priya, 22", location: "Gujarat" };
  }
  
  const parts = core.split("_");
  
  // Try to find age (1-2 digit number)
  const ageIndex = parts.findIndex(part => /^\d{1,2}$/.test(part));
  
  let name = "";
  let age = "";
  let location = "";
  
  if (ageIndex !== -1) {
    // Age found, everything before is name, everything after is location
    name = parts.slice(0, ageIndex).join(" ");
    age = `, ${parts[ageIndex]}`;
    location = parts.slice(ageIndex + 1).join(" ");
  } else {
    // No age found, try different patterns
    if (parts.length >= 3) {
      // Pattern like "mumbai_aisha_23" - location_name_age
      const lastPart = parts[parts.length - 1];
      if (/^\d{1,2}$/.test(lastPart)) {
        location = parts[0];
        name = parts.slice(1, -1).join(" ");
        age = `, ${lastPart}`;
      } else {
        // Default: first is name, rest is location
        name = parts[0];
        location = parts.slice(1).join(" ");
      }
    } else {
      // Simple case: name_location or just name
      name = parts[0] || "User";
      location = parts.slice(1).join(" ");
    }
  }
  
  // Capitalize and clean up
  name = name ? name.charAt(0).toUpperCase() + name.slice(1) : "User";
  location = location ? location.charAt(0).toUpperCase() + location.slice(1).replace(/-/g, " ") : "Online";
  
  return { display: `${name}${age}`, location };
}

const PEOPLE: Person[] = [
  // Wave 1 - Reduced speed burst
  { src: "/users/aayush_21_Haryana.webp", left: "2%", size: 88, duration: 18, delay: 0 },
  { src: "/users/alice_26_marnies.webp", left: "8%", size: 92, duration: 20, delay: 1.5 },
  { src: "/users/alok_21_bhopal.webp", left: "14%", size: 86, duration: 17, delay: 3, blur: true },
  { src: "/users/elina_21_bandra.webp", left: "20%", size: 90, duration: 19, delay: 1 },
  { src: "/users/eoma_24_mizoram.webp", left: "26%", size: 84, duration: 18, delay: 2.5 },
  { src: "/users/greece_26_greek.webp", left: "32%", size: 88, duration: 21, delay: 4, blur: true },
  { src: "/users/Lalremruata_19_mizoram.webp", left: "38%", size: 86, duration: 17, delay: 1.5 },
  { src: "/users/maanvi_20_kashmir.webp", left: "44%", size: 82, duration: 19, delay: 4.5 },
  { src: "/users/Dilnaz_mumbai_21.webp", left: "50%", size: 90, duration: 18, delay: 2 },
  { src: "/users/gujrati_girl.webp", left: "56%", size: 84, duration: 20, delay: 4.2, blur: true },
  { src: "/users/mumbai_aisha_23.webp", left: "62%", size: 88, duration: 19, delay: 0.5 },
  { src: "/users/parth_bhopal_21.webp", left: "68%", size: 86, duration: 17, delay: 2.7 },
  { src: "/users/sanjot_maharashtra_21.webp", left: "74%", size: 84, duration: 21, delay: 3.5, blur: true },
  { src: "/users/sofia_21_bandra.webp", left: "80%", size: 90, duration: 18, delay: 1.2 },
  { src: "/users/yogesh_21_Jaipur.webp", left: "86%", size: 88, duration: 20, delay: 4.8 },
  
  // Wave 2 - Follow-up wave
  { src: "/users/alice_26_marnies.webp", left: "5%", size: 82, duration: 19, delay: 6 },
  { src: "/users/aayush_21_Haryana.webp", left: "11%", size: 86, duration: 18, delay: 7, blur: true },
  { src: "/users/elina_21_bandra.webp", left: "17%", size: 88, duration: 20, delay: 7.5 },
  { src: "/users/alok_21_bhopal.webp", left: "23%", size: 84, duration: 17, delay: 6.3 },
  { src: "/users/greece_26_greek.webp", left: "29%", size: 90, duration: 21, delay: 8, blur: true },
  { src: "/users/maanvi_20_kashmir.webp", left: "35%", size: 82, duration: 19, delay: 7.2 },
  { src: "/users/eoma_24_mizoram.webp", left: "41%", size: 86, duration: 18, delay: 9 },
  { src: "/users/Dilnaz_mumbai_21.webp", left: "47%", size: 88, duration: 20, delay: 7.8 },
  { src: "/users/gujrati_girl.webp", left: "53%", size: 84, duration: 17, delay: 9.5, blur: true },
  { src: "/users/mumbai_aisha_23.webp", left: "59%", size: 90, duration: 19, delay: 6.9 },
  { src: "/users/parth_bhopal_21.webp", left: "65%", size: 82, duration: 21, delay: 10.5 },
  { src: "/users/sanjot_maharashtra_21.webp", left: "71%", size: 88, duration: 18, delay: 8.7, blur: true },
  { src: "/users/sofia_21_bandra.webp", left: "77%", size: 84, duration: 20, delay: 10.2 },
  { src: "/users/yogesh_21_Jaipur.webp", left: "83%", size: 86, duration: 17, delay: 11 },
  { src: "/users/Lalremruata_19_mizoram.webp", left: "89%", size: 90, duration: 19, delay: 9.3 },
  
  // Wave 3 - Continuous flow
  { src: "/users/aayush_21_Haryana.webp", left: "3%", size: 84, duration: 18, delay: 12 },
  { src: "/users/alice_26_marnies.webp", left: "9%", size: 88, duration: 20, delay: 12.8, blur: true },
  { src: "/users/alok_21_bhopal.webp", left: "15%", size: 86, duration: 17, delay: 13.5 },
  { src: "/users/elina_21_bandra.webp", left: "21%", size: 82, duration: 19, delay: 12.5 },
  { src: "/users/eoma_24_mizoram.webp", left: "27%", size: 90, duration: 21, delay: 14, blur: true },
  { src: "/users/greece_26_greek.webp", left: "33%", size: 84, duration: 18, delay: 13.2 },
  { src: "/users/Lalremruata_19_mizoram.webp", left: "39%", size: 88, duration: 20, delay: 15 },
  { src: "/users/maanvi_20_kashmir.webp", left: "45%", size: 86, duration: 17, delay: 13.8 },
  { src: "/users/Dilnaz_mumbai_21.webp", left: "51%", size: 82, duration: 19, delay: 15.8, blur: true },
  { src: "/users/gujrati_girl.webp", left: "57%", size: 90, duration: 21, delay: 12.9 },
  { src: "/users/mumbai_aisha_23.webp", left: "63%", size: 84, duration: 18, delay: 16.5 },
  { src: "/users/parth_bhopal_21.webp", left: "69%", size: 88, duration: 20, delay: 14.7, blur: true },
  { src: "/users/sanjot_maharashtra_21.webp", left: "75%", size: 86, duration: 17, delay: 17 },
  { src: "/users/sofia_21_bandra.webp", left: "81%", size: 82, duration: 19, delay: 15.3 },
  { src: "/users/yogesh_21_Jaipur.webp", left: "87%", size: 90, duration: 21, delay: 18, blur: true },
];

export default function FloatingPeopleBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {/* Enhanced coral / soft pink background wash */}
      <div className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1400px 700px at 20% 20%, #ffe4e6 0%, #ffd7d0 20%, #ffebe8 40%, #fff0ea 60%, #ffffff 90%)",
        }}
      />

      {/* Additional subtle gradient overlay for depth */}
      <div className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(800px 400px at 80% 80%, #fecaca 0%, transparent 70%)",
        }}
      />

      {/* Static Heading */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white/90 drop-shadow-lg leading-tight">
          You're just one step away from making genuine connections!
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-white/80 drop-shadow-md mt-4">
          Join our community and crew up with like-minded users. Let's grow together!
        </p>
      </div>

      {/* Floating cards */}
      {PEOPLE.map((p, i) => {
        const meta = metaFromFilename(p.src);
        return (
          <div
            key={`${p.src}-${i}`}
            className="fpb-card absolute rounded-xl shadow-lg overflow-hidden will-change-transform transition-opacity duration-300 hover:opacity-100"
            style={
              {
                left: p.left,
                top: "110%",                         // start just below the viewport
                width: `${p.size}px`,
                "--dur": `${p.duration}s`,
                "--del": `${p.delay}s`,
                filter: p.blur ? "blur(0.8px)" : undefined,
                opacity: p.blur ? 0.85 : 0.95,
                transform: "translateZ(0)", // Force hardware acceleration
              } as React.CSSProperties
            }
          >
            <img
              src={p.src}
              alt=""
              className="block w-full h-auto object-cover"
              draggable={false}
            />
            {/* Enhanced label overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
              <div className="text-[10px] leading-tight font-semibold text-white drop-shadow-sm">
                {meta.display}
              </div>
              <div className="text-[9px] leading-tight text-white/85 drop-shadow-sm">
                {meta.location}
              </div>
            </div>
          </div>
        );
      })}

      {/* Animation CSS (scoped) */}
      <style jsx global>{`
        @keyframes fpb-float-up {
          0%   { 
            transform: translateY(0) scale(0.9); 
            opacity: 0.7;
          }
          10%  { 
            opacity: 1;
            transform: translateY(-20vh) scale(1);
          }
          90%  { 
            opacity: 1;
            transform: translateY(-200vh) scale(1);
          }
          100% { 
            transform: translateY(-220vh) scale(0.9); 
            opacity: 0.7;
          }
        }
        .fpb-card {
          animation-name: fpb-float-up;
          animation-duration: var(--dur, 25s);
          animation-delay: var(--del, 0s);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .fpb-card:hover {
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
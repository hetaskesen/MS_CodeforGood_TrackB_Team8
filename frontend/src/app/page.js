"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Mail,
  Lock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

function FloatingDecorations() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Purple bar chart — left */}
      <svg style={{ position: "absolute", top: "25%", left: "6%" }} width="80" height="100" viewBox="0 0 80 100">
        <rect x="4"  y="55" width="18" height="40" rx="3" fill="#a78bfa" opacity="0.5"/>
        <rect x="30" y="30" width="18" height="65" rx="3" fill="#a78bfa" opacity="0.75"/>
        <rect x="56" y="10" width="18" height="85" rx="3" fill="#7c3aed" opacity="0.85"/>
      </svg>
      {/* Pink donut — left */}
      <svg style={{ position: "absolute", top: "52%", left: "5%" }} width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r="28" stroke="#f472b6" strokeWidth="7" fill="none" strokeDasharray="110 65" strokeLinecap="round"/>
      </svg>
      {/* Teal curve — right */}
      <svg style={{ position: "absolute", top: "55%", right: "5%" }} width="160" height="80" viewBox="0 0 160 80">
        <path d="M10,60 Q50,10 90,40 T160,20" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="158" cy="20" r="5" fill="#14b8a6"/>
      </svg>
    </div>
  );
}

const personas = [
  { id: "operator",   label: "Pantry Operator", emoji: "🏪", color: "#1D9E75" },
  { id: "donor",      label: "Donor / Funder",  emoji: "💚", color: "#E5820A" },
  { id: "government", label: "Government",      emoji: "🏛",  color: "#7C3AED" },
];

export default function LoginPage() {
  const router = useRouter();
  const [isFlipped, setIsFlipped]         = useState(false);
  const [activePersona, setActivePersona] = useState("operator");
  const selected = personas.find((p) => p.id === activePersona);

  function handleSignIn(e) {
    e.preventDefault();
    router.push("/dashboard");
  }

  const inputStyle = {
    width: "100%",
    paddingLeft: 44,
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 14,
    background: "#f1f5f9",
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    color: "#1a1a1a",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,700&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <header style={{
        background: "#FFD840",
        padding: "0 2rem", height: 54,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #f0c800",
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍋</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, fontSize: 20, color: "#1a1a1a" }}>lemontree</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {["For neighbors", "For partners", "Volunteer"].map((l) => (
            <span key={l} style={{ fontSize: 13, fontWeight: 500, color: "#444", cursor: "pointer" }}>{l}</span>
          ))}
          <div style={{ width: 1, height: 20, background: "#00000020" }}/>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>sarah M.</span>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "1px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#555" }}>SM</div>
          <button style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", overflow: "hidden" }}>

        {/* Background — warm beige overlay like screenshot */}
        <div style={{ position: "absolute", inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=2000" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          <div style={{ position: "absolute", inset: 0, background: "rgba(255, 248, 220, 0.82)" }}/>
        </div>

        <FloatingDecorations />

        {/* FLIP CARD */}
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 480, perspective: 1200 }}>
          <div style={{
            position: "relative",
            transition: "transform 0.65s cubic-bezier(0.4,0,0.2,1)",
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            height: 530,
          }}>

            {/* FRONT */}
            <div style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              background: "#ffffff",
              borderRadius: 24,
              padding: "2rem 2rem 1.8rem",
              display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 22 }}>
                {selected?.emoji}
              </div>
              <h2 style={{ fontSize: "1.55rem", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Partner Portal</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 1.3rem" }}>Login to manage your {selected?.label} dashboard.</p>

              {/* Persona pills */}
              <div style={{ display: "flex", gap: 8, marginBottom: "1.3rem" }}>
                {personas.map((p) => (
                  <button key={p.id} onClick={() => setActivePersona(p.id)} style={{
                    flex: 1, padding: "9px 4px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                    border: activePersona === p.id ? `2px solid ${p.color}` : "1.5px solid #e2e8f0",
                    background: activePersona === p.id ? `${p.color}12` : "#f8fafc",
                    color: activePersona === p.id ? "#1a1a1a" : "#94a3b8",
                    fontSize: 11, fontWeight: 600,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    transition: "all 0.18s",
                  }}>
                    <span style={{ fontSize: 18 }}>{p.emoji}</span>
                    <span style={{ lineHeight: 1.2, textAlign: "center" }}>{p.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}/>
                  <input type="email" placeholder="Work email" style={inputStyle}/>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}/>
                  <input type="password" placeholder="Password" style={inputStyle}/>
                </div>
                <button type="submit" style={{
                  width: "100%", padding: "14px",
                  background: selected?.color || "#1D9E75",
                  border: "none", borderRadius: 14,
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 2,
                  boxShadow: `0 6px 20px ${selected?.color || "#1D9E75"}40`,
                }}>
                  Sign In <ArrowRight size={18}/>
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 12, color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, margin: 0 }}>
                  <ShieldCheck size={13}/> Radical data transparency enabled
                </p>
              </div>
            </div>

            {/* BACK */}
            <div style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#ffffff",
              borderRadius: 24,
              padding: "2rem 2rem 1.8rem",
              display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 22 }}>👤</div>
              <h2 style={{ fontSize: "1.55rem", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Employee Login</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 1.6rem" }}>Access Lemontree internal administration tools.</p>

              <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}/>
                  <input type="email" placeholder="Internal email" style={inputStyle}/>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}/>
                  <input type="password" placeholder="Admin password" style={inputStyle}/>
                </div>
                <button type="submit" style={{
                  width: "100%", padding: "14px",
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  border: "none", borderRadius: 14,
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 2,
                  boxShadow: "0 6px 20px rgba(13,148,136,0.3)",
                }}>
                  Internal Sign In <ArrowRight size={18}/>
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>Restricted internal access only</p>
              </div>
            </div>
          </div>

          {/* Flip button */}
          <button onClick={() => setIsFlipped(!isFlipped)} style={{
            marginTop: 16, width: "100%",
            background: "rgba(255,255,255,0.55)",
            border: "1.5px solid rgba(0,0,0,0.12)",
            borderRadius: 12, padding: "11px 20px",
            color: "#334155", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            backdropFilter: "blur(8px)",
          }}>
            {isFlipped ? "Are you a Community Partner?" : "Lemontree Employees login"}
            <ChevronRight size={16}/>
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#FFD840", padding: "1.8rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid #f0c800", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🍋</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, fontSize: 17, color: "#1a1a1a" }}>lemontree</span>
          <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>Community Impact Hub · Team 8</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#888" }}>Gold Transparency 2025</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>Candid.</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.5px" }}>GET FOOD</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Text 90847</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href="#" style={{ fontSize: 11, color: "#555", textDecoration: "underline" }}>Terms of Service</a>
          <a href="#" style={{ fontSize: 11, color: "#555", textDecoration: "underline" }}>Privacy Policy</a>
        </div>
      </footer>

      <style>{`
        input::placeholder { color: #94a3b8; }
        input:focus { border-color: #94a3b8 !important; background: #fff !important; }
      `}</style>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, ChevronRight } from "lucide-react";

const personas = [
  { id: "operator", label: "Pantry Operator", color: "#1D9E75" },
  { id: "donor", label: "Donor / Funder", color: "#E5820A" },
  { id: "government", label: "Government", color: "#7C3AED" },
];

function AnimatedBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Gradient orbs */}
      <div style={{
        position: "absolute",
        top: "-20%",
        left: "-10%",
        width: "50%",
        height: "50%",
        background: "radial-gradient(circle, rgba(253,233,122,0.4) 0%, transparent 70%)",
        filter: "blur(60px)",
        animation: "float1 20s ease-in-out infinite",
      }}/>
      <div style={{
        position: "absolute",
        bottom: "-10%",
        right: "-10%",
        width: "45%",
        height: "45%",
        background: "radial-gradient(circle, rgba(29,158,117,0.2) 0%, transparent 70%)",
        filter: "blur(60px)",
        animation: "float2 25s ease-in-out infinite",
      }}/>
      <div style={{
        position: "absolute",
        top: "40%",
        right: "20%",
        width: "30%",
        height: "30%",
        background: "radial-gradient(circle, rgba(155,89,182,0.15) 0%, transparent 70%)",
        filter: "blur(50px)",
        animation: "float3 18s ease-in-out infinite",
      }}/>
      
      {/* Floating community avatars - left side */}
      <svg className="float-element" style={{ position: "absolute", top: "12%", left: "4%", opacity: 0.85 }} width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r="33" fill="#E86A4A" />
        <circle cx="35" cy="28" r="11" fill="#FFD840" />
        <ellipse cx="35" cy="52" rx="16" ry="10" fill="#FFD840" />
      </svg>
      
      <svg className="float-element-reverse" style={{ position: "absolute", top: "55%", left: "6%", opacity: 0.75 }} width="55" height="55" viewBox="0 0 55 55">
        <circle cx="27.5" cy="27.5" r="26" fill="#FFD840" />
        <circle cx="27.5" cy="22" r="8" fill="#E86A4A" />
        <ellipse cx="27.5" cy="40" rx="12" ry="8" fill="#E86A4A" />
      </svg>
      
      <svg className="float-element" style={{ position: "absolute", bottom: "18%", left: "3%", opacity: 0.65 }} width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="23" fill="#1D9E75" />
        <circle cx="25" cy="20" r="7" fill="#fff" />
        <ellipse cx="25" cy="36" rx="10" ry="7" fill="#fff" />
      </svg>

      {/* Floating community avatars - right side */}
      <svg className="float-element-reverse" style={{ position: "absolute", top: "8%", right: "5%", opacity: 0.8 }} width="65" height="65" viewBox="0 0 65 65">
        <circle cx="32.5" cy="32.5" r="30" fill="#9B59B6" />
        <circle cx="32.5" cy="26" r="10" fill="#fff" />
        <ellipse cx="32.5" cy="48" rx="14" ry="9" fill="#fff" />
      </svg>
      
      <svg className="float-element" style={{ position: "absolute", top: "45%", right: "4%", opacity: 0.7 }} width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="28" fill="#14B8A6" />
        <circle cx="30" cy="24" r="9" fill="#FFD840" />
        <ellipse cx="30" cy="44" rx="13" ry="8" fill="#FFD840" />
      </svg>
      
      <svg className="float-element-reverse" style={{ position: "absolute", bottom: "15%", right: "6%", opacity: 0.6 }} width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#E5820A" />
        <circle cx="24" cy="19" r="7" fill="#fff" />
        <ellipse cx="24" cy="35" rx="10" ry="6" fill="#fff" />
      </svg>
      
      {/* Speech bubbles */}
      <svg className="float-element" style={{ position: "absolute", top: "32%", left: "12%", opacity: 0.5 }} width="45" height="40" viewBox="0 0 45 40">
        <path d="M5 5 h30 a5 5 0 0 1 5 5 v15 a5 5 0 0 1 -5 5 h-20 l-8 8 v-8 h-2 a5 5 0 0 1 -5 -5 v-15 a5 5 0 0 1 5 -5" fill="#14B8A6" />
      </svg>
      
      <svg className="float-element-reverse" style={{ position: "absolute", bottom: "35%", right: "10%", opacity: 0.45 }} width="40" height="35" viewBox="0 0 40 35">
        <path d="M5 5 h25 a5 5 0 0 1 5 5 v12 a5 5 0 0 1 -5 5 h-15 l-6 6 v-6 h-4 a5 5 0 0 1 -5 -5 v-12 a5 5 0 0 1 5 -5" fill="#E86A4A" />
      </svg>
      
      {/* Food/heart icons */}
      <svg className="float-element-slow" style={{ position: "absolute", top: "70%", left: "15%", opacity: 0.4 }} width="35" height="35" viewBox="0 0 35 35">
        <path d="M17.5 30 C8 22 3 16 3 10 a7 7 0 0 1 14.5 -2 a7 7 0 0 1 14.5 2 c0 6 -5 12 -14.5 20" fill="#E86A4A" />
      </svg>
      
      <svg className="float-element-slow" style={{ position: "absolute", top: "20%", right: "18%", opacity: 0.35 }} width="30" height="30" viewBox="0 0 30 30">
        <path d="M15 26 C7 19 3 14 3 9 a6 6 0 0 1 12 -1.5 a6 6 0 0 1 12 1.5 c0 5 -4 10 -12 17" fill="#1D9E75" />
      </svg>
      
      {/* Decorative circles */}
      <div style={{
        position: "absolute",
        top: "25%",
        left: "25%",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#FFD840",
        opacity: 0.6,
        animation: "pulse 3s ease-in-out infinite",
      }}/>
      <div style={{
        position: "absolute",
        top: "65%",
        right: "25%",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#1D9E75",
        opacity: 0.5,
        animation: "pulse 4s ease-in-out infinite 1s",
      }}/>
      <div style={{
        position: "absolute",
        bottom: "30%",
        left: "30%",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "#9B59B6",
        opacity: 0.4,
        animation: "pulse 3.5s ease-in-out infinite 0.5s",
      }}/>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
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
    background: "#fafafa",
    border: "1.5px solid #e0e0e0",
    borderRadius: 10,
    color: "#333",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif", background: "linear-gradient(135deg, #faf9f6 0%, #f0ebe3 50%, #e8f4f0 100%)" }}>
      {/* HEADER - Matching Lemontree navbar */}
      <header style={{
        background: "#FDE97A",
        padding: "0 24px",
        height: 62,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <img
            src="https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg"
            alt="Lemontree logo"
            style={{ height: 34 }}
          />
          <img
            src="https://www.foodhelpline.org/_next/static/media/wordmark.483cff36.svg"
            alt="Lemontree"
            style={{ height: 20, marginLeft: -6 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="#" style={{ fontSize: 13, fontWeight: 500, color: "#3D2200", textDecoration: "none" }}>About</a>
          <a href="#" style={{ fontSize: 13, fontWeight: 500, color: "#3D2200", textDecoration: "none" }}>Get Help</a>
          <button style={{
            background: "#1D9E75",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            Get Started
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", position: "relative" }}>
        <AnimatedBackground />
        
        <div style={{ width: "100%", maxWidth: 440, perspective: 1200, position: "relative", zIndex: 10 }}>
          
          {/* Interactive Header */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: "#666", 
                textTransform: "uppercase", 
                letterSpacing: "2.5px",
                display: "inline-block",
                padding: "5px 14px",
                background: "linear-gradient(135deg, rgba(120,120,120,0.08) 0%, rgba(180,180,180,0.12) 100%)",
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                Welcome Back
              </span>
            </div>
            <h1 style={{ 
              fontSize: 34, 
              fontWeight: 700, 
              margin: "0 0 4px", 
              letterSpacing: "-0.5px",
              color: "#2a2a2a",
            }}>
              Partner Portal
            </h1>
            <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
              Sign in to access your dashboard
            </p>
          </div>

          {/* Inspiring Quote */}
          <div style={{ 
            textAlign: "center", 
            marginBottom: 18,
            padding: "14px 24px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(245,243,239,0.6) 100%)",
            borderRadius: 16,
            backdropFilter: "blur(8px)",
            borderLeft: "3px solid #1D9E75",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}>
            <p style={{ 
              fontFamily: "'Caveat', cursive", 
              fontSize: 19, 
              color: "#4a4a4a", 
              margin: 0,
              lineHeight: 1.3,
              fontWeight: 500,
              fontStyle: "italic",
            }}>
              &ldquo;Together, we can ensure no one goes hungry&rdquo;
            </p>
            <span style={{ fontSize: 10, color: "#1D9E75", marginTop: 6, display: "block", fontWeight: 500, letterSpacing: "0.5px" }}>
              — Building stronger communities, one meal at a time
            </span>
          </div>

          <div style={{
            position: "relative",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            height: 400,
          }}>

            {/* FRONT - Partner Login */}
            <div style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              background: "#fff",
              borderRadius: 16,
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}>
              {/* Persona tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem", background: "#f5f3ef", padding: 4, borderRadius: 10 }}>
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePersona(p.id)}
                    style={{
                      flex: 1,
                      padding: "10px 6px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      border: "none",
                      background: activePersona === p.id ? "#fff" : "transparent",
                      color: activePersona === p.id ? "#3D2200" : "#6B645A",
                      fontSize: 12,
                      fontWeight: activePersona === p.id ? 700 : 500,
                      transition: "all 0.2s ease",
                      boxShadow: activePersona === p.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9a9a9a" }}/>
                  <input type="email" placeholder="Email address" style={inputStyle}/>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9a9a9a" }}/>
                  <input type="password" placeholder="Password" style={inputStyle}/>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <a href="#" style={{ fontSize: 12, color: "#1D9E75", textDecoration: "none", fontWeight: 600 }}>Forgot password?</a>
                </div>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: selected?.color || "#1D9E75",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 4,
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: `0 4px 12px ${selected?.color || "#1D9E75"}30`,
                  }}
                >
                  Sign In <ArrowRight size={16}/>
                </button>
              </form>

              <p style={{ fontSize: 13, color: "#6B645A", textAlign: "center", marginTop: "auto", paddingTop: "1rem" }}>
                New partner? <a href="#" style={{ color: "#1D9E75", textDecoration: "none", fontWeight: 600 }}>Request access</a>
              </p>
            </div>

            {/* BACK - Employee Login */}
            <div style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#fff",
              borderRadius: 16,
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#3D2200", margin: "0 0 4px" }}>
                Employee Login
              </h2>
              <p style={{ fontSize: 13, color: "#6B645A", margin: "0 0 1.5rem" }}>
                Access internal administration tools
              </p>

              <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9a9a9a" }}/>
                  <input type="email" placeholder="Work email" style={inputStyle}/>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9a9a9a" }}/>
                  <input type="password" placeholder="Password" style={inputStyle}/>
                </div>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: "#3D2200",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 4,
                    boxShadow: "0 4px 12px rgba(61,34,0,0.2)",
                  }}
                >
                  Sign In <ArrowRight size={16}/>
                </button>
              </form>

              <p style={{ fontSize: 12, color: "#9a9a9a", textAlign: "center", marginTop: "auto", paddingTop: "1rem" }}>
                Internal access only
              </p>
            </div>
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              marginTop: 14,
              width: "100%",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 10,
              padding: "12px 20px",
              color: "#6B645A",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {isFlipped ? "Back to Partner Login" : "Lemontree Employee? Sign in here"}
            <ChevronRight size={14}/>
          </button>
        </div>
      </main>

      {/* FOOTER - Matching Lemontree yellow style */}
      <footer style={{
        background: "#FDE97A",
        padding: "1.5rem 2rem",
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          {/* Left - Logo and badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img
                src="https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg"
                alt="Lemontree logo"
                style={{ height: 28 }}
              />
              <img
                src="https://www.foodhelpline.org/_next/static/media/wordmark.483cff36.svg"
                alt="Lemontree"
                style={{ height: 16, marginLeft: -4 }}
              />
            </div>
            <div style={{ background: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 10 }}>
              <div style={{ fontWeight: 700, color: "#888", fontSize: 8, textTransform: "uppercase" }}>Gold Transparency</div>
              <div style={{ fontWeight: 700, color: "#3D2200", fontSize: 12 }}>Candid.</div>
            </div>
          </div>

          {/* Center - Get food */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#3D2200", textTransform: "uppercase" }}>GET FOOD</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3D2200" }}>Text 90847</div>
          </div>

          {/* Right - Newsletter */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#3D2200", marginBottom: 6 }}>Stay in touch! Sign up for our newsletter.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input 
                type="email" 
                placeholder="Email" 
                style={{ 
                  padding: "8px 12px", 
                  borderRadius: 6, 
                  border: "1px solid rgba(0,0,0,0.1)", 
                  fontSize: 13,
                  width: 160,
                  background: "#fff",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button style={{ 
                background: "#3D2200", 
                color: "#fff", 
                border: "none", 
                borderRadius: 6, 
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}>
                <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom links */}
        <div style={{ maxWidth: 1200, margin: "1rem auto 0", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <a href="#" style={{ fontSize: 12, color: "#3D2200", textDecoration: "underline", fontWeight: 500 }}>Terms of Service</a>
            <a href="#" style={{ fontSize: 12, color: "#3D2200", textDecoration: "underline", fontWeight: 500 }}>Privacy Policy</a>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#3D2200"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#3D2200"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#3D2200"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </div>
        </div>
      </footer>

      <style>{`
        input::placeholder { color: #9a9a9a; }
        input:focus { border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.1) !important; }
        button:hover { transform: translateY(-1px); }
        a:hover { opacity: 0.8; }
        
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-40px, 20px) rotate(-5deg); }
          66% { transform: translate(30px, -40px) rotate(5deg); }
        }
        
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, -30px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 0.8; }
        }
        
        .float-element {
          animation: floatUp 6s ease-in-out infinite;
        }
        
        .float-element-reverse {
          animation: floatDown 7s ease-in-out infinite;
        }
        
        .float-element-slow {
          animation: floatSlow 10s ease-in-out infinite;
        }
        
        @keyframes floatUp {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes floatDown {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(12px) rotate(-3deg); }
        }
        
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
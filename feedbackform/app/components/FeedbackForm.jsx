"use client";

import { useState, useRef } from "react";

const STEPS = ["attendance", "experience", "details", "contact", "confirm"];
const STEPS_WITH_LOCATION = ["location", ...STEPS];

const STEP_LABELS = {
  location: "Which location did you visit?",
  attendance: "Did you get help?",
  experience: "Rate your visit",
  details: "Share details",
  contact: "Stay in touch",
  confirm: "Review & submit",
};

const NON_ATTEND_REASONS = [
  { value: "closed", label: "Location was closed" },
  { value: "too_late", label: "Arrived too late" },
  { value: "too_far", label: "Too far to travel" },
  { value: "no_food", label: "No food available" },
  { value: "long_wait", label: "Wait was too long" },
  { value: "other", label: "Other reason" },
];

const INACCURACY_TYPES = [
  { value: "hours", label: "Hours" },
  { value: "address", label: "Address" },
  { value: "phone", label: "Phone" },
  { value: "website", label: "Website" },
  { value: "food_types", label: "Food types" },
  { value: "other", label: "Other" },
];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const getHoverValue = (event, star) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    return x < rect.width / 2 ? star - 0.5 : star;
  };

  const displayValue = hovered || value;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        margin: "1.5rem 0",
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={(e) => onChange(getHoverValue(e, star))}
          onMouseMove={(e) => setHovered(getHoverValue(e, star))}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            transition: "transform 0.15s",
            transform: Math.ceil(displayValue) === star ? "scale(1.2)" : "scale(1)",
          }}
          aria-label={`${star - 0.5} or ${star} stars`}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" role="img" aria-hidden="true">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#fff"
              stroke="#c0bdb4"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {(() => {
              const fillFraction = Math.max(0, Math.min(1, displayValue - (star - 1)));
              if (fillFraction <= 0) return null;
              return (
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="#E4A11B"
                  style={{
                    clipPath: `inset(0 ${100 - fillFraction * 100}% 0 0)`,
                  }}
                />
              );
            })()}
          </svg>
        </button>
      ))}
    </div>
  );
}

function ProgressBar({ steps, step }) {
  const idx = steps.indexOf(step);
  const pct = idx >= 0 && steps.length ? ((idx + 1) / steps.length) * 100 : 0;
  return (
    <div
      style={{
        height: 3,
        background: "#e8e6df",
        borderRadius: 99,
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #4CAF8F, #2E8B6E)",
          borderRadius: 99,
          transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 24,
        border: selected ? "2px solid #2E8B6E" : "1.5px solid #d0cdc4",
        background: selected ? "#E1F5EE" : "transparent",
        color: selected ? "#0F6E56" : "#5a5955",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: selected ? 500 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
        lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  );
}

function BigChoice({ icon, label, sublabel, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px",
        borderRadius: 16,
        border: selected ? "2px solid #2E8B6E" : "1.5px solid #d0cdc4",
        background: selected ? "#E1F5EE" : "transparent",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        textAlign: "left",
        marginBottom: 12,
        transition: "all 0.15s",
        boxSizing: "border-box",
      }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 500,
            color: selected ? "#085041" : "#2c2c2a",
            lineHeight: 1.3,
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              color: selected ? "#0F6E56" : "#888780",
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
      <div style={{ marginLeft: "auto", flexShrink: 0 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: selected ? "2px solid #2E8B6E" : "1.5px solid #c0bdb4",
            background: selected ? "#2E8B6E" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

function WaitTimePicker({ value, onChange }) {
  const buckets = [
    { label: "No wait", value: 0 },
    { label: "< 5 min", value: 4 },
    { label: "5–15 min", value: 10 },
    { label: "15–30 min", value: 22 },
    { label: "30–60 min", value: 45 },
    { label: "1hr+", value: 75 },
  ];
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}
    >
      {buckets.map((b) => (
        <Chip
          key={b.value}
          label={b.label}
          selected={value === b.value}
          onClick={() => onChange(b.value)}
        />
      ))}
    </div>
  );
}

const STAR_LABELS = {
  0.5: "Very poor",
  1: "Poor",
  1.5: "Poor+",
  2: "Fair",
  2.5: "Fair+",
  3: "Okay",
  3.5: "Okay+",
  4: "Good",
  4.5: "Great",
  5: "Great!",
};

const getStarLabel = (rating) => STAR_LABELS[rating] || "";

export default function FeedbackForm({
  resourceName = "Food Pantry",
  resourceId = "",
  onSubmit = null,
}) {
  const needLocation = !resourceId;
  const steps = needLocation ? STEPS_WITH_LOCATION : STEPS;
  const [step, setStep] = useState(needLocation ? "location" : "attendance");
  const [selectedResourceId, setSelectedResourceId] = useState(resourceId);
  const [selectedResourceName, setSelectedResourceName] = useState(resourceName);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | getting | ready | error
  const [locationError, setLocationError] = useState("");
  const [nearbyList, setNearbyList] = useState([]);
  const [zipInput, setZipInput] = useState("");
  const [form, setForm] = useState({
    attended: null,
    didNotAttendReason: "",
    rating: 0,
    waitTimeMinutes: null,
    informationAccurate: null,
    inaccuracyTypes: [],
    inaccuracyDetail: "",
    text: "",
    shareTextWithResource: false,
    displayName: "",
    photoUrl: null,
    photoPublic: false,
    contactEmail: "",
    contactFollowUp: false,
    enterRaffle: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const effectiveResourceId = selectedResourceId || resourceId;
  const effectiveResourceName = selectedResourceName || resourceName;

  const fetchNearby = (lat, lng) => {
    fetch(`/api/resources/nearby?lat=${lat}&lng=${lng}&take=20`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNearbyList(data);
          setLocationStatus("ready");
        } else {
          setLocationError(data?.error || "Could not load nearby locations.");
          setLocationStatus("error");
        }
      })
      .catch((err) => {
        setLocationError(err.message || "Failed to fetch nearby resources.");
        setLocationStatus("error");
      });
  };

  const getLocationAndFetch = () => {
    setLocationError("");
    setLocationStatus("getting");
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by your browser.");
      setLocationStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        fetchNearby(lat, lng);
      },
      () => {
        setLocationError("Location access denied or unavailable. Try entering a ZIP code instead.");
        setLocationStatus("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const geocodeZipAndFetch = () => {
    const zip = zipInput.trim().replace(/\D/g, "").slice(0, 5);
    if (!zip || zip.length < 5) {
      setLocationError("Please enter a valid 5-digit ZIP code.");
      setLocationStatus("error");
      return;
    }
    setLocationError("");
    setLocationStatus("getting");
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zip + ", USA")}&limit=1`,
      { headers: { Accept: "application/json" } }
    )
      .then((r) => r.json())
      .then((results) => {
        if (!results?.length || results[0].lat == null) {
          setLocationError("ZIP code could not be found. Try using your location.");
          setLocationStatus("error");
          return;
        }
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        fetchNearby(lat, lng);
      })
      .catch((err) => {
        setLocationError(err.message || "Failed to geocode ZIP.");
        setLocationStatus("error");
      });
  };

  const selectResource = (r) => {
    setSelectedResourceId(r.id);
    setSelectedResourceName(r.name || "Food Pantry");
    setStep("attendance");
  };

  const canAdvance = () => {
    if (step === "location") return !!selectedResourceId;
    if (step === "attendance") return form.attended !== null;
    if (step === "experience") {
      if (form.attended === false) return !!form.didNotAttendReason;
      return form.rating > 0;
    }
    if (step === "details") return form.informationAccurate !== null;
    return true;
  };

  const next = () => {
    const idx = steps.indexOf(step);
    if (idx >= 0 && idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const back = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Build a payload that exactly matches the ResourceReview JSON schema.
    // Fields that are conditional on attended/photo are nulled out when not applicable.
    // authorId uses a persistent session ID so multiple submissions from the same
    // browser can be grouped in admin analytics, without requiring sign-in.
    function getAnonymousId() {
      const key = "lemontree_anon_id";
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem(key, id);
      }
      return id;
    }

    const payload = {
      createdAt: new Date().toISOString(),
      deletedAt: null,

      authorId: getAnonymousId(),
      resourceId: effectiveResourceId || "unspecified",
      occurrenceId: null,    // TODO: pass as prop when linking to a specific visit
      userId: null,
      reviewedByUserId: null,

      attended: form.attended,
      didNotAttendReason:
        form.attended === false ? (form.didNotAttendReason || null) : null,

      rating: form.attended === true ? (form.rating > 0 ? form.rating : null) : null,
      waitTimeMinutes: form.attended === true ? form.waitTimeMinutes : null,

      informationAccurate: form.informationAccurate,
      inaccuracyTypes: form.informationAccurate === false ? form.inaccuracyTypes : [],
      inaccuracyDetail:
        form.informationAccurate === false && form.inaccuracyDetail.trim()
          ? form.inaccuracyDetail.trim()
          : null,

      text: form.text.trim() || null,
      shareTextWithResource: form.shareTextWithResource,
      displayName: form.shareTextWithResource && form.displayName.trim()
        ? form.displayName.trim()
        : null,

      photoUrl: form.photoUrl || null,
      photoPublic: form.photoUrl ? form.photoPublic : null,

      contactEmail: (form.enterRaffle || form.contactFollowUp) && form.contactEmail.trim()
        ? form.contactEmail.trim()
        : null,
      contactFollowUp: form.contactFollowUp,
      enterRaffle: form.enterRaffle,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
      }
      setSubmitted(true);
    } catch (e) {
      console.error("Submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    set("photoUrl", url);
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          background: "#f7f6f2",
          fontFamily: "'Georgia', serif",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#E1F5EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="#2E8B6E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 24,
            fontWeight: 400,
            color: "#085041",
            margin: "0 0 0.75rem",
            textAlign: "center",
          }}
        >
          Thank you!
        </h2>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 15,
            color: "#5a5955",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 280,
          }}
        >
          Your feedback helps {resourceName} and other community members. You've
          earned a raffle entry!
        </p>
        {form.attended === true && form.rating > 0 && (
          <div
            style={{
              marginTop: "2rem",
              padding: "16px 24px",
              background: "white",
              borderRadius: 14,
              border: "1px solid #d8d5ce",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#888780",
                marginBottom: 4,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Your rating
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={form.rating >= s ? "#E4A11B" : "#e0ddd6"}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          </div>
        )}
        {form.attended === false && form.didNotAttendReason && (
          <div
            style={{
              marginTop: "2rem",
              padding: "14px 20px",
              background: "white",
              borderRadius: 14,
              border: "1px solid #d8d5ce",
              textAlign: "center",
              fontSize: 13,
              color: "#888780",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Reported:{" "}
            <span style={{ color: "#2c2c2a", fontWeight: 500 }}>
              {NON_ATTEND_REASONS.find(
                (r) => r.value === form.didNotAttendReason
              )?.label || form.didNotAttendReason}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f6f2",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #eae8e2",
          padding: "16px 20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <img
            src="https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg"
            alt="Lemontree logo"
            width={28}
            height={28}
            style={{
              flexShrink: 0,
              borderRadius: "50%",
              background: "#f7f6f2",
              padding: 4,
            }}
          />
          {steps.indexOf(step) > 0 && (
            <button
              type="button"
              onClick={back}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#5a5955",
                display: "flex",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: "#888780",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 500,
              }}
            >
              {effectiveResourceName}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: "#2c2c2a",
                lineHeight: 1.3,
              }}
            >
              {STEP_LABELS[step]}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#888780" }}>
            {steps.indexOf(step) + 1}/{steps.length}
          </div>
        </div>
        <ProgressBar steps={steps} step={step} />
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: "1.5rem 1rem",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* STEP: Location (only when no resourceId from URL) */}
        {step === "location" && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.25rem",
                lineHeight: 1.6,
              }}
            >
              Find the food pantry or resource you visited so we can attach your feedback to the right place.
            </p>
            {locationStatus === "error" && locationError && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "#FEE2E2",
                  border: "1px solid #FECACA",
                  color: "#991B1B",
                  fontSize: 14,
                  marginBottom: 12,
                }}
              >
                {locationError}
              </div>
            )}
            {locationStatus !== "ready" && (
              <>
                <button
                  type="button"
                  onClick={getLocationAndFetch}
                  disabled={locationStatus === "getting"}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "1.5px solid #2E8B6E",
                    background: locationStatus === "getting" ? "#f0eeea" : "#E1F5EE",
                    color: locationStatus === "getting" ? "#888780" : "#085041",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: locationStatus === "getting" ? "not-allowed" : "pointer",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  {locationStatus === "getting" ? "Finding nearby locations…" : <><span>📍</span> Use my location</>}
                </button>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Or enter ZIP code"
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && geocodeZipAndFetch()}
                    disabled={locationStatus === "getting"}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1.5px solid #d0cdc4",
                      fontFamily: "inherit",
                      fontSize: 15,
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={geocodeZipAndFetch}
                    disabled={locationStatus === "getting"}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 12,
                      border: "none",
                      background: locationStatus === "getting" ? "#d0cdc4" : "#2E8B6E",
                      color: "white",
                      fontFamily: "inherit",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: locationStatus === "getting" ? "not-allowed" : "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    Search
                  </button>
                </div>
              </>
            )}
            {locationStatus === "ready" && nearbyList.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 14, color: "#888780", marginBottom: 12 }}>
                  Tap the location you visited:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLocationStatus("idle");
                    setNearbyList([]);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2E8B6E",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: 8,
                    fontFamily: "inherit",
                  }}
                >
                  ← Search again
                </button>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {nearbyList.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectResource(r)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: "1.5px solid #d0cdc4",
                        background: "white",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2a" }}>
                        {r.name}
                      </div>
                      {(r.addressStreet1 || r.city) && (
                        <div style={{ fontSize: 13, color: "#888780", marginTop: 4 }}>
                          {[r.addressStreet1, r.city, r.state, r.zipCode].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {locationStatus === "ready" && nearbyList.length === 0 && (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <p style={{ fontSize: 15, color: "#5a5955", marginBottom: 12 }}>
                  No resources found near this location.
                </p>
                <button
                  type="button"
                  onClick={() => { setLocationStatus("idle"); setNearbyList([]); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2E8B6E",
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 500,
                  }}
                >
                  ← Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP: Attendance */}
        {step === "attendance" && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Did you receive food or assistance during your visit?
            </p>
            <BigChoice
              icon="✅"
              label="Yes, I got help"
              sublabel="I received food or assistance"
              selected={form.attended === true}
              onClick={() => set("attended", true)}
            />
            <BigChoice
              icon="❌"
              label="No, I didn't get help"
              sublabel="Something prevented me from getting assistance"
              selected={form.attended === false}
              onClick={() => set("attended", false)}
            />
          </div>
        )}

        {/* STEP 2: Experience */}
        {step === "experience" && form.attended === true && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              How would you rate your overall experience?
            </p>
            <StarRating
              value={form.rating}
              onChange={(v) => set("rating", v)}
            />
            {form.rating > 0 && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 16,
                  color: "#2E8B6E",
                  fontWeight: 500,
                  margin: "-0.5rem 0 1rem",
                }}
              >
                {getStarLabel(form.rating)}
              </p>
            )}
          </div>
        )}

        {step === "experience" && form.attended === false && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.25rem",
                lineHeight: 1.6,
              }}
            >
              What prevented you from getting help?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {NON_ATTEND_REASONS.map((r) => (
                <Chip
                  key={r.value}
                  label={r.label}
                  selected={form.didNotAttendReason === r.value}
                  onClick={() => set("didNotAttendReason", r.value)}
                />
              ))}
            </div>
            {form.didNotAttendReason === "other" && (
              <textarea
                placeholder="Please describe what happened..."
                value={form.text}
                onChange={(e) => set("text", e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #d0cdc4",
                  fontFamily: "inherit",
                  fontSize: 15,
                  resize: "none",
                  minHeight: 100,
                  boxSizing: "border-box",
                  background: "white",
                  color: "#2c2c2a",
                }}
              />
            )}
          </div>
        )}

        {/* STEP 3: Details */}
        {step === "details" && (
          <div>
            {form.attended === true && (
              <>
                <div style={{ marginBottom: "1.75rem" }}>
                  <label
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#2c2c2a",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    How long did you wait?
                  </label>
                  <WaitTimePicker
                    value={form.waitTimeMinutes}
                    onChange={(v) => set("waitTimeMinutes", v)}
                  />
                </div>
                <div style={{ marginBottom: "1.75rem" }}>
                  <label
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#2c2c2a",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Share a photo?{" "}
                    <span style={{ fontWeight: 400, color: "#888780" }}>
                      (optional)
                    </span>
                  </label>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#888780",
                      marginBottom: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    Help others see what's available. You can choose whether
                    it's shown publicly.
                  </p>
                  {form.photoUrl ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={form.photoUrl}
                        alt="Review photo"
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          objectFit: "cover",
                          maxHeight: 180,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => set("photoUrl", null)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "rgba(0,0,0,0.5)",
                          border: "none",
                          color: "white",
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          cursor: "pointer",
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                      <div style={{ marginTop: 10 }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.photoPublic}
                            onChange={(e) =>
                              set("photoPublic", e.target.checked)
                            }
                            style={{
                              width: 18,
                              height: 18,
                              accentColor: "#2E8B6E",
                            }}
                          />
                          <span style={{ fontSize: 14, color: "#5a5955" }}>
                            Show this photo publicly on Lemontree
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRef}
                        onChange={handlePhoto}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                          width: "100%",
                          padding: "20px",
                          borderRadius: 12,
                          border: "1.5px dashed #c0bdb4",
                          background: "#faf9f7",
                          cursor: "pointer",
                          color: "#888780",
                          fontFamily: "inherit",
                          fontSize: 14,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          boxSizing: "border-box",
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#b0ada6"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Tap to add a photo
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            <div style={{ marginBottom: "1.75rem" }}>
              <label
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#2c2c2a",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Was the listing information accurate?
              </label>
              <p
                style={{
                  fontSize: 13,
                  color: "#888780",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                Hours, location, food types, and other details
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Chip
                  label="Yes, accurate"
                  selected={form.informationAccurate === true}
                  onClick={() => set("informationAccurate", true)}
                />
                <Chip
                  label="No, something was wrong"
                  selected={form.informationAccurate === false}
                  onClick={() => set("informationAccurate", false)}
                />
              </div>
            </div>

            {/* Inaccuracy type — shown when informationAccurate is false */}
            {form.informationAccurate === false && (
              <div style={{ marginBottom: "1.75rem" }}>
                <label
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#2c2c2a",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  What was wrong?{" "}
                  <span style={{ fontWeight: 400, color: "#888780" }}>
                    (select all that apply)
                  </span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {INACCURACY_TYPES.map((t) => (
                    <Chip
                      key={t.value}
                      label={t.label}
                      selected={form.inaccuracyTypes.includes(t.value)}
                      onClick={() => {
                        const current = form.inaccuracyTypes;
                        const updated = current.includes(t.value)
                          ? current.filter((v) => v !== t.value)
                          : [...current, t.value];
                        set("inaccuracyTypes", updated);
                      }}
                    />
                  ))}
                </div>
                <textarea
                  placeholder="Correct information (e.g. 'Hours are Mon–Fri 9am–1pm')  — optional"
                  value={form.inaccuracyDetail}
                  onChange={(e) => set("inaccuracyDetail", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1.5px solid #f0a896",
                    fontFamily: "inherit",
                    fontSize: 14,
                    resize: "none",
                    minHeight: 72,
                    boxSizing: "border-box",
                    background: "#fff8f7",
                    color: "#2c2c2a",
                    lineHeight: 1.5,
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "1.75rem" }}>
              <label
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#2c2c2a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Written comments{" "}
                <span style={{ fontWeight: 400, color: "#888780" }}>
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="Anything else you'd like to share about your visit..."
                value={form.text}
                onChange={(e) => set("text", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #d0cdc4",
                  fontFamily: "inherit",
                  fontSize: 15,
                  resize: "none",
                  minHeight: 100,
                  boxSizing: "border-box",
                  background: "white",
                  color: "#2c2c2a",
                  lineHeight: 1.6,
                }}
              />
              {form.text.length > 0 && (
                <>
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginTop: 12,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.shareTextWithResource}
                    onChange={(e) =>
                      set("shareTextWithResource", e.target.checked)
                    }
                    style={{
                      width: 18,
                      height: 18,
                      marginTop: 2,
                      accentColor: "#2E8B6E",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 13, color: "#5a5955", lineHeight: 1.5 }}
                  >
                    Share my written comments with {effectiveResourceName} so they can
                    improve their service
                  </span>
                </label>
                {/* Display name — only when sharing */}
                {form.shareTextWithResource && (
                <div style={{ marginTop: 12 }}>
                  <input
                    type="text"
                    placeholder="Display name (e.g. Maria L.) — optional"
                    value={form.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #d0cdc4",
                      fontFamily: "inherit",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                  <p style={{ fontSize: 12, color: "#888780", marginTop: 6, lineHeight: 1.5 }}>
                    Used if your review is shared publicly. Leave blank to stay anonymous.
                  </p>
                </div>
                )}
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP: Contact / Raffle */}
        {step === "contact" && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Everything you share is optional and confidential.
            </p>

            {/* Raffle opt-in */}
            <div
              style={{
                background: "#FFF9E6",
                border: "1.5px solid #FFE57A",
                borderRadius: 14,
                padding: "16px",
                marginBottom: "1.25rem",
                boxSizing: "border-box",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.enterRaffle}
                  onChange={(e) => set("enterRaffle", e.target.checked)}
                  style={{
                    width: 20,
                    height: 20,
                    marginTop: 2,
                    accentColor: "#D4A017",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#3D2200", display: "block" }}>
                    🎟 Enter the monthly raffle
                  </span>
                  <span style={{ fontSize: 13, color: "#7a6a50", lineHeight: 1.5, display: "block", marginTop: 3 }}>
                    Lemontree gives away prizes each month to clients who submit feedback. Enter your email below to participate.
                  </span>
                </div>
              </label>
            </div>

            {/* Follow-up opt-in */}
            <div
              style={{
                background: "#F0FDF4",
                border: "1.5px solid #9FE1CB",
                borderRadius: 14,
                padding: "16px",
                marginBottom: "1.25rem",
                boxSizing: "border-box",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.contactFollowUp}
                  onChange={(e) => set("contactFollowUp", e.target.checked)}
                  style={{
                    width: 20,
                    height: 20,
                    marginTop: 2,
                    accentColor: "#2E8B6E",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#0F4C38", display: "block" }}>
                    💬 Let Lemontree follow up with me
                  </span>
                  <span style={{ fontSize: 13, color: "#4a7a68", lineHeight: 1.5, display: "block", marginTop: 3 }}>
                    If you had a negative experience, our team may reach out to help or pass feedback to the right place.
                  </span>
                </div>
              </label>
            </div>

            {/* Email — shown when either opt-in is checked */}
            {(form.enterRaffle || form.contactFollowUp) && (
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#2c2c2a",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1.5px solid #d0cdc4",
                    fontFamily: "inherit",
                    fontSize: 15,
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ fontSize: 12, color: "#888780", marginTop: 6, lineHeight: 1.5 }}>
                  Your email is never shared publicly or sold.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === "confirm" && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Review your feedback before submitting.
            </p>

            {[
              {
                label: "Got help",
                value:
                  form.attended === true
                    ? "Yes"
                    : form.attended === false
                      ? "No"
                      : "—",
                accent: form.attended === true,
              },
              form.attended === false &&
                form.didNotAttendReason && {
                  label: "Reason",
                  value:
                    NON_ATTEND_REASONS.find(
                      (r) => r.value === form.didNotAttendReason,
                    )?.label || form.didNotAttendReason,
                },
              form.rating > 0 && {
                label: "Rating",
                value: `${form.rating}/5 — ${getStarLabel(form.rating)}`,
              },
              form.waitTimeMinutes !== null && {
                label: "Wait time",
                value:
                  form.waitTimeMinutes === 0
                    ? "No wait"
                    : form.waitTimeMinutes < 5
                      ? "Under 5 min"
                      : form.waitTimeMinutes < 15
                        ? "5–15 min"
                        : form.waitTimeMinutes < 30
                          ? "15–30 min"
                          : form.waitTimeMinutes < 60
                            ? "30–60 min"
                            : "Over 1 hour",
              },
              form.informationAccurate !== null && {
                label: "Info accurate",
                value: form.informationAccurate ? "Yes" : "No",
              },
              form.text && {
                label: "Comments",
                value:
                  form.text.length > 80
                    ? form.text.slice(0, 80) + "…"
                    : form.text,
              },
              form.shareTextWithResource && {
                label: "Shared with pantry",
                value: "Yes",
              },
              form.displayName && {
                label: "Display name",
                value: form.displayName,
              },
              form.informationAccurate === false && form.inaccuracyTypes.length > 0 && {
                label: "What was wrong",
                value: form.inaccuracyTypes.join(", "),
              },
              form.enterRaffle && { label: "Raffle entry", value: "Yes ✓" },
              form.contactFollowUp && { label: "Follow-up", value: "Yes — via email" },
            ]
              .filter(Boolean)
              .map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    padding: "12px 0",
                    borderBottom: "1px solid #eae8e2",
                  }}
                >
                  <span
                    style={{ fontSize: 14, color: "#888780", minWidth: 130 }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: row.accent ? "#0F6E56" : "#2c2c2a",
                      fontWeight: row.accent ? 500 : 400,
                      flex: 1,
                      minWidth: 0,
                      lineHeight: 1.5,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

            <div
              style={{
                marginTop: "1.5rem",
                padding: "14px 16px",
                background: "#E1F5EE",
                borderRadius: 12,
                border: "1px solid #9FE1CB",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#0F6E56",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Your feedback is anonymous. Written comments are only shared
                with the food pantry if you checked the sharing option above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          background: "white",
          borderTop: "1px solid #eae8e2",
          padding: "1rem",
          position: "sticky",
          bottom: 0,
        }}
      >
        <button
          type="button"
          disabled={!canAdvance() || submitting}
          onClick={step === "confirm" ? handleSubmit : next}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: canAdvance()
              ? "linear-gradient(135deg, #2E8B6E, #1D9E75)"
              : "#d0cdc4",
            color: canAdvance() ? "white" : "#888780",
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 500,
            cursor: canAdvance() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            letterSpacing: "0.01em",
          }}
        >
          {submitting
            ? "Submitting…"
            : step === "confirm"
              ? "Submit feedback"
              : "Continue →"}
        </button>
      </div>
    </div>
  );
}

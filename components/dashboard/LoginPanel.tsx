"use client";

import { FormEvent, useState } from "react";

export function LoginPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    if (response.ok) onAuthenticated();
    else {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error || "Access code was not accepted.");
    }
    setLoading(false);
  }

  return <form className="loginPanel" onSubmit={submit}>
    <div>
      <h2>Dashboard Access</h2>
      <p>Enter the access code to load live SkyPrep report data.</p>
    </div>
    <label className="control">Access code<input suppressHydrationWarning type="password" value={code} onChange={event => setCode(event.target.value)} /></label>
    <button suppressHydrationWarning className="button primary" disabled={loading}>{loading ? "Checking..." : "Unlock Report"}</button>
    {message && <span className="loginError" role="status">{message}</span>}
  </form>;
}

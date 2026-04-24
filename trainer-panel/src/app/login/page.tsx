"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notTrainer = params.get("error") === "not_trainer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    notTrainer ? "Этот аккаунт не имеет прав тренера. Обратитесь к администратору." : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError("Неверный email или пароль");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0C16",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "#18181B",
          borderRadius: 24,
          padding: 40,
          width: 380,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>💪</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
            Панель тренера
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>
            Войдите в систему
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="trainer@fitnes.app"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "#0C0C16",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                display: "block",
                marginBottom: 6,
              }}
            >
              Пароль
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "#0C0C16",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {error && (
            <div
              style={{
                background: "rgba(255,86,86,0.1)",
                border: "1px solid rgba(255,86,86,0.25)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "#FF5656",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 52,
              background: "linear-gradient(to right, #5434B3, #7C3AED)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

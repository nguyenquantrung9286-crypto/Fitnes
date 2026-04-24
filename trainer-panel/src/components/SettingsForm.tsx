"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

interface Props {
  userId: string;
  initialName: string;
  email: string;
  initialOnline: boolean;
}

export function SettingsForm({ userId, initialName, email, initialOnline }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleStatus = async (online: boolean) => {
    setIsOnline(online);
    const supabase = createClient();
    await supabase
      .from("trainer_status")
      .upsert(
        { trainer_id: userId, is_online: online, updated_at: new Date().toISOString() },
        { onConflict: "trainer_id" }
      );
  };

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const Card = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div
      style={{
        background: "#18181B",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 18 }}>
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 24 }}>
        Настройки
      </div>

      <Card title="Статус">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>
              Ваш статус для клиентов
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>
              {isOnline
                ? "Клиенты видят: «отвечу в течение часа»"
                : "Клиенты видят: «не в сети»"}
            </div>
          </div>
          {/* Toggle */}
          <div
            onClick={() => toggleStatus(!isOnline)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 99,
              cursor: "pointer",
              background: isOnline ? "#7C3AED" : "rgba(255,255,255,0.1)",
              position: "relative",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: isOnline ? 25 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: isOnline
              ? "rgba(61,216,122,0.08)"
              : "rgba(107,114,128,0.08)",
            borderRadius: 10,
            border: `1px solid ${isOnline ? "rgba(61,216,122,0.2)" : "rgba(107,114,128,0.2)"}`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isOnline ? "#3DD87A" : "#6B7280",
            }}
          />
          <span style={{ fontSize: 13, color: isOnline ? "#3DD87A" : "#9CA3AF" }}>
            {isOnline ? "Онлайн — клиенты могут написать" : "Оффлайн"}
          </span>
        </div>
      </Card>

      <Card title="Профиль">
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}
          >
            Имя
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              background: "#0C0C16",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 14,
              padding: "11px 14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}
          >
            Email
          </label>
          <input
            value={email}
            readOnly
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              color: "#6B7280",
              fontSize: 14,
              padding: "11px 14px",
              outline: "none",
              boxSizing: "border-box",
              cursor: "default",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: "linear-gradient(to right, #5434B3, #7C3AED)",
              color: "#fff",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? "✓ Сохранено" : saving ? "Сохраняю…" : "Сохранить"}
          </button>
          <button
            onClick={logout}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(255,86,86,0.08)",
              border: "1px solid rgba(255,86,86,0.2)",
              color: "#FF5656",
            }}
          >
            Выйти
          </button>
        </div>
      </Card>
    </div>
  );
}

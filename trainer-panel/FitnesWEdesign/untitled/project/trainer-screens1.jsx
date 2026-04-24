// Login + Dashboard + Clients List screens

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysSince(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "сегодня";
  if (d === 1) return "вчера";
  return `${d} дн. назад`;
}

function bmi(w, h) {
  if (!w || !h) return "—";
  return (w / ((h / 100) ** 2)).toFixed(1);
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (email === "trainer@fitnes.app" && password === "demo1234") {
        onLogin();
      } else {
        setError("Неверный email или пароль");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0C0C16", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        background: "#18181B", borderRadius: 24, padding: 40, width: 380,
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>💪</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>Панель тренера</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>Войдите в систему</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="trainer@fitnes.app"
              style={{
                width: "100%", padding: "12px 14px", background: "#0C0C16", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
              }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Пароль</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••"
              style={{
                width: "100%", padding: "12px 14px", background: "#0C0C16", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
              }} />
          </div>
          {error && (
            <div style={{
              background: "rgba(255,86,86,0.1)", border: "1px solid rgba(255,86,86,0.25)",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#FF5656", marginBottom: 16,
            }}>{error}</div>
          )}
          <button type="submit" disabled={loading} style={{
            width: "100%", height: 52, background: "linear-gradient(to right, #5434B3, #7C3AED)",
            border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
          }}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#6B7280" }}>
          Демо: trainer@fitnes.app / demo1234
        </div>
      </div>
    </div>
  );
}

// ── STAT TILE ─────────────────────────────────────────────────────────────────
function StatTile({ emoji, label, value, sub, accent }) {
  return (
    <div style={{
      background: "#18181B", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: "22px 24px", flex: 1,
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || "#fff", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{sub}</div>}
      <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8 }}>{label}</div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardScreen({ setScreen, setClientId }) {
  const proCount = MOCK_CLIENTS.length;
  const totalUnread = MOCK_CLIENTS.reduce((a, c) => a + c.unread_messages, 0);
  const todayWorkouts = 5;
  const activeWeek = 8;

  const recentConvos = MOCK_CLIENTS.filter(c => c.unread_messages > 0 || MOCK_MESSAGES[c.id]);
  const inactive = MOCK_CLIENTS.filter(c => {
    if (!c.last_workout_at) return true;
    return (Date.now() - new Date(c.last_workout_at).getTime()) > 7 * 86400000;
  });

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        <StatTile emoji="👥" label="Pro-клиентов" value={proCount} />
        <StatTile emoji="💬" label="Непрочитанных" value={totalUnread} accent={totalUnread > 0 ? "#A78BFA" : undefined} />
        <StatTile emoji="🏋️" label="Тренировок сегодня" value={todayWorkouts} sub="у клиентов" />
        <StatTile emoji="📊" label="Активных за неделю" value={activeWeek} sub={`из ${proCount}`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
        {/* Recent messages */}
        <div style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 18 }}>Последние сообщения</div>
          {recentConvos.slice(0, 5).map(c => {
            const msgs = MOCK_MESSAGES[c.id] || [];
            const last = msgs[msgs.length - 1];
            return (
              <div key={c.id} onClick={() => { setClientId(c.id); setScreen("client-chat"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Avatar name={c.full_name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{c.full_name}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>{last?.time}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {last?.text || "Нет сообщений"}
                  </div>
                </div>
                {c.unread_messages > 0 && (
                  <span style={{
                    background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700,
                    borderRadius: 99, padding: "2px 8px",
                  }}>{c.unread_messages}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Inactive clients */}
        <div style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Нет активности 7+ дн.</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>Стоит написать клиентам</div>
          {inactive.length === 0 && <div style={{ fontSize: 13, color: "#3DD87A" }}>✓ Все клиенты активны</div>}
          {inactive.map(c => (
            <div key={c.id} onClick={() => { setClientId(c.id); setScreen("client-chat"); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
              }}>
              <Avatar name={c.full_name} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{c.full_name}</div>
                <div style={{ fontSize: 12, color: "#FF5656" }}>
                  {c.last_workout_at ? `Последняя: ${daysSince(c.last_workout_at)}` : "Ни одной тренировки"}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setClientId(c.id); setScreen("client-chat"); }}
                style={{
                  background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#A78BFA", cursor: "pointer",
                }}>Написать</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CLIENT CARD ───────────────────────────────────────────────────────────────
function ClientCard({ client, onProfile, onChat }) {
  return (
    <div style={{
      background: "#18181B", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 0,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <Avatar name={client.full_name} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{client.full_name}</div>
            <span style={{
              background: "rgba(124,58,237,0.2)", color: "#A78BFA", fontSize: 11, fontWeight: 700,
              borderRadius: 99, padding: "3px 10px", border: "1px solid rgba(124,58,237,0.3)",
            }}>PRO</span>
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{client.email}</div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 0", fontSize: 13 }}>
          <div><span style={{ color: "#6B7280" }}>Цель: </span><span style={{ color: "#e5e7eb" }}>{client.goal}</span></div>
          <div><span style={{ color: "#6B7280" }}>Уровень: </span><span style={{ color: "#e5e7eb" }}>{client.fitness_level}</span></div>
          <div><span style={{ color: "#6B7280" }}>Вес: </span><span style={{ color: "#e5e7eb" }}>{client.weight_kg} кг</span></div>
          <div><span style={{ color: "#6B7280" }}>Рост: </span><span style={{ color: "#e5e7eb" }}>{client.height_cm} см</span></div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, marginBottom: 14, fontSize: 13 }}>
        <div style={{ color: "#9CA3AF" }}>
          Последняя тренировка: <span style={{ color: client.last_workout_at ? "#e5e7eb" : "#FF5656" }}>{daysSince(client.last_workout_at) || "—"}</span>
        </div>
        <div style={{ color: "#9CA3AF", marginTop: 4 }}>
          Тренировок всего: <span style={{ color: "#e5e7eb" }}>{client.total_workouts}</span>
          {client.unread_messages > 0 && (
            <span style={{
              marginLeft: 10, background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700,
              borderRadius: 99, padding: "1px 8px",
            }}>{client.unread_messages} непрочитанных</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onProfile} style={{
          flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#e5e7eb",
        }}>Профиль</button>
        <button onClick={onChat} style={{
          flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
          border: "none", background: "linear-gradient(to right, #5434B3, #7C3AED)", color: "#fff",
        }}>Написать</button>
      </div>
    </div>
  );
}

// ── CLIENTS LIST ──────────────────────────────────────────────────────────────
function ClientsScreen({ setScreen, setClientId }) {
  const [search, setSearch] = React.useState("");
  const filtered = MOCK_CLIENTS.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>Клиенты</div>
          <span style={{
            background: "rgba(124,58,237,0.2)", color: "#A78BFA", fontSize: 13, fontWeight: 700,
            borderRadius: 99, padding: "4px 12px", border: "1px solid rgba(124,58,237,0.3)",
          }}>{MOCK_CLIENTS.length} PRO</span>
        </div>
        <div style={{ position: "relative" }}>
          <SvgIcon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16}
            className="" />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", paddingLeft: 12, color: "#6B7280", pointerEvents: "none" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или email..."
            style={{
              background: "#18181B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
              color: "#fff", fontSize: 14, padding: "10px 14px 10px 36px", outline: "none", width: 260,
            }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.map(c => (
          <ClientCard key={c.id} client={c}
            onProfile={() => { setClientId(c.id); setScreen("client-profile"); }}
            onChat={() => { setClientId(c.id); setScreen("client-chat"); }}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#6B7280", fontSize: 14 }}>Клиенты не найдены</div>
      )}
    </div>
  );
}

Object.assign(window, { LoginScreen, DashboardScreen, ClientsScreen, daysSince, bmi });

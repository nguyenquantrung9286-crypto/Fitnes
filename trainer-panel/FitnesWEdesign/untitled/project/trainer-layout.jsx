// Sidebar + TopBar components

const NAV_ITEMS = [
  { id: "dashboard", label: "Дашборд", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "clients", label: "Клиенты", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "chat", label: "Чаты", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", badge: 6 },
  { id: "settings", label: "Настройки", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

function SvgIcon({ path, size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

function Avatar({ name, size = 36, color = "#7C3AED" }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, #5434B3, #7C3AED)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>{initials}</div>
  );
}

function Sidebar({ screen, setScreen, trainerStatus, isOnline }) {
  const totalUnread = MOCK_CLIENTS.reduce((a, c) => a + c.unread_messages, 0);
  return (
    <div style={{
      width: 240, minWidth: 240, background: "#18181B",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column", height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #5434B3, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>💪</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", lineHeight: 1.2 }}>Fitnes</div>
            <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.2 }}>Панель тренера</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map(item => {
          const active = screen === item.id || (item.id === "clients" && screen.startsWith("client"));
          const unread = item.id === "chat" ? totalUnread : 0;
          return (
            <button key={item.id} onClick={() => setScreen(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 20px", cursor: "pointer", border: "none", textAlign: "left",
                background: active ? "rgba(124,58,237,0.12)" : "transparent",
                borderLeft: active ? "3px solid #7C3AED" : "3px solid transparent",
                color: active ? "#A78BFA" : "#9CA3AF",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <SvgIcon path={item.icon} size={18} />
              <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, flex: 1 }}>{item.label}</span>
              {unread > 0 && (
                <span style={{
                  background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700,
                  borderRadius: 99, padding: "1px 7px", minWidth: 20, textAlign: "center",
                }}>{unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Trainer status bottom */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Avatar name="Максим Тренер" size={36} />
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 11, height: 11, borderRadius: "50%",
              background: isOnline ? "#3DD87A" : "#6B7280",
              border: "2px solid #18181B",
            }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Максим Тренер</div>
            <div style={{ fontSize: 11, color: isOnline ? "#3DD87A" : "#6B7280" }}>
              {isOnline ? "● Онлайн" : "● Оффлайн"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ screen, setScreen, clientId }) {
  const totalUnread = MOCK_CLIENTS.reduce((a, c) => a + c.unread_messages, 0);

  const crumb = () => {
    if (screen === "dashboard") return "Дашборд";
    if (screen === "clients") return "Клиенты";
    if (screen === "chat") return "Чаты";
    if (screen === "settings") return "Настройки";
    if (screen === "client-profile") {
      const c = MOCK_CLIENTS.find(x => x.id === clientId);
      return <><span style={{ color: "#6B7280", cursor: "pointer" }} onClick={() => setScreen("clients")}>Клиенты</span><span style={{ color: "#6B7280" }}> / </span>{c?.full_name}</>
    }
    if (screen === "client-chat") {
      const c = MOCK_CLIENTS.find(x => x.id === clientId);
      return <><span style={{ color: "#6B7280", cursor: "pointer" }} onClick={() => setScreen("chat")}>Чаты</span><span style={{ color: "#6B7280" }}> / </span>{c?.full_name}</>
    }
    if (screen === "assign") {
      const c = MOCK_CLIENTS.find(x => x.id === clientId);
      return <><span style={{ color: "#6B7280", cursor: "pointer" }} onClick={() => setScreen("client-profile")}>Клиенты</span><span style={{ color: "#6B7280" }}> / </span>Назначить тренировку</>
    }
    return "";
  };

  return (
    <div style={{
      height: 60, background: "#18181B", borderBottom: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", flexShrink: 0,
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{crumb()}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {totalUnread > 0 && (
          <button onClick={() => setScreen("chat")} style={{
            position: "relative", background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", display: "flex", alignItems: "center",
          }}>
            <SvgIcon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={20} />
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "#7C3AED", color: "#fff", fontSize: 10, fontWeight: 700,
              borderRadius: 99, padding: "1px 5px", minWidth: 16, textAlign: "center",
            }}>{totalUnread}</span>
          </button>
        )}
        <Avatar name="Максим Тренер" size={32} />
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, SvgIcon, Avatar });

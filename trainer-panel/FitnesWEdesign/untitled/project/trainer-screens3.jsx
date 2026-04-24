// Chat + Assign + Settings screens

// ── CHAT ──────────────────────────────────────────────────────────────────────
function ChatScreen({ clientId, setClientId, setScreen }) {
  const [activeId, setActiveId] = React.useState(clientId);
  const [input, setInput] = React.useState("");
  const [allMessages, setAllMessages] = React.useState(() => {
    const copy = {};
    Object.keys(MOCK_MESSAGES).forEach(k => { copy[k] = [...MOCK_MESSAGES[k]]; });
    return copy;
  });
  const bottomRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  const msgs = allMessages[activeId] || [];
  const activeClient = MOCK_CLIENTS.find(c => c.id === activeId);

  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.parentElement.scrollTop = bottomRef.current.offsetTop;
    }
  }, [activeId, msgs.length]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = {
      id: "new_" + Date.now(),
      from: "trainer",
      text,
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      date: "Сегодня",
    };
    setAllMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Conversation list — clients with messages
  const convos = MOCK_CLIENTS.filter(c => MOCK_MESSAGES[c.id]?.length > 0 || allMessages[c.id]?.length > 0);

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 60px - 48px)", minHeight: 500 }}>
      {/* Left: conversation list */}
      <div style={{
        width: 280, minWidth: 280, background: "#18181B",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px 0 0 16px", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Диалоги</div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {convos.map(c => {
            const cMsgs = allMessages[c.id] || [];
            const last = cMsgs[cMsgs.length - 1];
            const unread = c.unread_messages || 0;
            const isActive = c.id === activeId;
            return (
              <div key={c.id} onClick={() => setActiveId(c.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  cursor: "pointer", borderLeft: isActive ? "3px solid #7C3AED" : "3px solid transparent",
                  background: isActive ? "rgba(84,52,179,0.15)" : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar name={c.full_name} size={40} />
                  {unread > 0 && (
                    <span style={{
                      position: "absolute", top: -3, right: -3, background: "#7C3AED", color: "#fff",
                      fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 5px", minWidth: 16, textAlign: "center",
                    }}>{unread}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{c.full_name}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>{last?.time}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 }}>
                    {last?.from === "trainer" ? "Вы: " : ""}{last?.text || "Нет сообщений"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: chat window */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: "#111116", borderRadius: "0 16px 16px 0",
        border: "1px solid rgba(255,255,255,0.07)", borderLeft: "none", overflow: "hidden",
      }}>
        {/* Chat header */}
        {activeClient && (
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", gap: 12, background: "#18181B", flexShrink: 0,
          }}>
            <Avatar name={activeClient.full_name} size={38} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{activeClient.full_name}</div>
              <div style={{ fontSize: 12, color: "#A78BFA" }}>Клиент на тарифе PRO</div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => { setClientId(activeId); setScreen("client-profile"); }}
              style={{
                padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF",
              }}>Профиль</button>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
          {msgs.reduce((acc, msg, i) => {
            const prev = msgs[i - 1];
            const showDate = !prev || prev.date !== msg.date;
            if (showDate) {
              acc.push(
                <div key={"d" + i} style={{ textAlign: "center", margin: "12px 0 8px", fontSize: 12, color: "#6B7280" }}>
                  {msg.date}
                </div>
              );
            }
            const isTrainer = msg.from === "trainer";
            acc.push(
              <div key={msg.id} style={{
                display: "flex", justifyContent: isTrainer ? "flex-end" : "flex-start",
                marginBottom: 4,
              }}>
                <div style={{
                  maxWidth: "68%", padding: "10px 14px", borderRadius: isTrainer ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isTrainer ? "linear-gradient(135deg, #5434B3, #7C3AED)" : "#1E1E2E",
                  color: "#fff", fontSize: 14, lineHeight: 1.5,
                  border: isTrainer ? "none" : "1px solid rgba(255,255,255,0.07)",
                }}>
                  {msg.text}
                  <div style={{ fontSize: 11, color: isTrainer ? "rgba(255,255,255,0.55)" : "#6B7280", marginTop: 4, textAlign: "right" }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
            return acc;
          }, [])}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "#18181B", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0,
        }}>
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Напиши ответ... (Enter — отправить, Shift+Enter — новая строка)"
            rows={1} style={{
              flex: 1, background: "#0C0C16", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, color: "#fff", fontSize: 14, padding: "10px 14px", outline: "none",
              resize: "none", fontFamily: "Inter, sans-serif", lineHeight: 1.5,
              maxHeight: 120, overflowY: "auto",
            }} />
          <button onClick={sendMessage} style={{
            width: 42, height: 42, borderRadius: 12, border: "none", cursor: "pointer",
            background: input.trim() ? "linear-gradient(to right, #5434B3, #7C3AED)" : "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "background 0.2s",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#fff" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ASSIGN WORKOUT ────────────────────────────────────────────────────────────
function AssignScreen({ clientId, setScreen }) {
  const client = MOCK_CLIENTS.find(c => c.id === clientId);
  const [selected, setSelected] = React.useState(null);
  const [note, setNote] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const assign = () => {
    if (!selected) return;
    setSuccess(true);
    setTimeout(() => { setScreen("client-profile"); }, 1500);
  };

  if (success) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Тренировка назначена!</div>
        <div style={{ fontSize: 14, color: "#6B7280" }}>Переходим к профилю клиента…</div>
      </div>
    </div>
  );

  const typeColors = { "Силовая": "#A78BFA", "Кардио": "#3DD87A", "Гибкость": "#60A5FA", "Функциональная": "#FBBF24" };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
        Назначить тренировку
      </div>
      <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Клиент: <span style={{ color: "#A78BFA" }}>{client?.full_name}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {MOCK_WORKOUTS_LIBRARY.map(w => (
          <div key={w.id} onClick={() => setSelected(w.id)}
            style={{
              background: "#18181B", borderRadius: 14, padding: "16px 20px", cursor: "pointer",
              border: selected === w.id ? "1px solid #7C3AED" : "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", gap: 16, transition: "border-color 0.15s",
              boxShadow: selected === w.id ? "0 0 0 1px #7C3AED22 inset" : "none",
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: selected === w.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              border: selected === w.id ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.07)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected === w.id ? "#A78BFA" : "#6B7280"} strokeWidth="1.8">
                <path d="M6 4v16M18 4v16M6 12h12M3 8h3M18 8h3M3 16h3M18 16h3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{w.name}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{w.description}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                fontSize: 12, borderRadius: 99, padding: "3px 10px",
                background: `${typeColors[w.type] || "#6B7280"}20`,
                color: typeColors[w.type] || "#6B7280", border: `1px solid ${typeColors[w.type] || "#6B7280"}40`,
              }}>{w.type}</span>
              <span style={{ fontSize: 12, color: "#6B7280" }}>{w.duration_min} мин</span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{w.level}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 8 }}>
            Заметка для клиента (необязательно)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Например: выполни в среду, следи за техникой приседаний…"
            rows={3} style={{
              width: "100%", background: "#18181B", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, color: "#fff", fontSize: 14, padding: "12px 14px",
              outline: "none", resize: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box",
            }} />
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setScreen("client-profile")} style={{
          padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF",
        }}>Отмена</button>
        <button onClick={assign} disabled={!selected} style={{
          padding: "12px 32px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: selected ? "pointer" : "not-allowed",
          border: "none", background: selected ? "linear-gradient(to right, #5434B3, #7C3AED)" : "rgba(255,255,255,0.08)",
          color: selected ? "#fff" : "#6B7280", transition: "background 0.2s",
        }}>Назначить тренировку</button>
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsScreen({ isOnline, setIsOnline, onLogout }) {
  const [name, setName] = React.useState("Максим Тренер");
  const [saved, setSaved] = React.useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Card = ({ title, children }) => (
    <div style={{
      background: "#18181B", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: 24, marginBottom: 16,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 24 }}>Настройки</div>

      <Card title="Статус">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>Ваш статус для клиентов</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>
              {isOnline ? "Клиенты видят: «отвечу в течение часа»" : "Клиенты видят: «не в сети»"}
            </div>
          </div>
          {/* Toggle */}
          <div onClick={() => setIsOnline(v => !v)} style={{
            width: 48, height: 26, borderRadius: 99, cursor: "pointer", transition: "background 0.2s",
            background: isOnline ? "#7C3AED" : "rgba(255,255,255,0.1)",
            position: "relative", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 3, left: isOnline ? 25 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }} />
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
          background: isOnline ? "rgba(61,216,122,0.08)" : "rgba(107,114,128,0.08)",
          borderRadius: 10, border: `1px solid ${isOnline ? "rgba(61,216,122,0.2)" : "rgba(107,114,128,0.2)"}`,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#3DD87A" : "#6B7280" }} />
          <span style={{ fontSize: 13, color: isOnline ? "#3DD87A" : "#9CA3AF" }}>
            {isOnline ? "Онлайн — клиенты могут написать" : "Оффлайн"}
          </span>
        </div>
      </Card>

      <Card title="Профиль">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Имя</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{
            width: "100%", background: "#0C0C16", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, color: "#fff", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box",
          }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Email</label>
          <input value="trainer@fitnes.app" readOnly style={{
            width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, color: "#6B7280", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box",
            cursor: "default",
          }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={save} style={{
            padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
            border: "none", background: "linear-gradient(to right, #5434B3, #7C3AED)", color: "#fff",
          }}>{saved ? "✓ Сохранено" : "Сохранить"}</button>
          <button onClick={onLogout} style={{
            padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: "rgba(255,86,86,0.08)", border: "1px solid rgba(255,86,86,0.2)", color: "#FF5656",
          }}>Выйти</button>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { ChatScreen, AssignScreen, SettingsScreen });

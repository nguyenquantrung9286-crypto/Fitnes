// Client Profile + Charts + Photos screens

function WeightChart({ data }) {
  if (!data || data.length === 0) return (
    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: 13 }}>
      Нет данных о весе
    </div>
  );
  const vals = data.map(d => d.weight);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const W = 460, H = 160, padL = 40, padR = 10, padT = 10, padB = 30;
  const cw = W - padL - padR, ch = H - padT - padB;
  const px = (i) => padL + (i / (data.length - 1)) * cw;
  const py = (v) => padT + ch - ((v - min) / (max - min)) * ch;
  const points = data.map((d, i) => `${px(i)},${py(d.weight)}`).join(" ");
  const area = `M${px(0)},${py(data[0].weight)} ` +
    data.slice(1).map((d, i) => `L${px(i + 1)},${py(d.weight)}`).join(" ") +
    ` L${px(data.length - 1)},${padT + ch} L${px(0)},${padT + ch} Z`;

  const step = Math.ceil(data.length / 6);
  const ticks = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 180 }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={padL} x2={W - padR} y1={padT + ch * t} y2={padT + ch * t}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* area */}
      <path d={area} fill="url(#wg)" />
      {/* line */}
      <polyline points={points} fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round" />
      {/* dots */}
      {data.map((d, i) => (
        <circle key={i} cx={px(i)} cy={py(d.weight)} r="3.5" fill="#7C3AED" />
      ))}
      {/* x-axis labels */}
      {ticks.map((d, i) => (
        <text key={i} x={px(data.indexOf(d))} y={H - 4} textAnchor="middle" fontSize="10" fill="#6B7280">{d.date}</text>
      ))}
      {/* y-axis labels */}
      {[min, (min + max) / 2, max].map((v, i) => (
        <text key={i} x={padL - 4} y={py(v) + 4} textAnchor="end" fontSize="10" fill="#6B7280">{Math.round(v)}</text>
      ))}
    </svg>
  );
}

function ActivityChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const W = 260, H = 120, padB = 24, padT = 10, barW = 24, gap = 8;
  const chartW = data.length * (barW + gap) - gap;
  const startX = (W - chartW) / 2;
  const ch = H - padB - padT;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 120 }}>
      {data.map((d, i) => {
        const bh = maxVal > 0 ? (d.count / maxVal) * ch : 0;
        const x = startX + i * (barW + gap);
        const y = padT + ch - bh;
        return (
          <g key={i}>
            <rect x={x} y={padT} width={barW} height={ch} rx="4" fill="rgba(124,58,237,0.12)" />
            {bh > 0 && <rect x={x} y={y} width={barW} height={bh} rx="4" fill="#7C3AED" />}
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#6B7280">{d.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ProgressPhotoGallery({ clientId }) {
  const [open, setOpen] = React.useState(null);
  const photos = [
    { id: 1, label: "12 фев 2026", note: "Начало программы" },
    { id: 2, label: "12 мар 2026", note: "+1 месяц" },
    { id: 3, label: "12 апр 2026", note: "+2 месяца" },
  ];
  const colors = ["#1a1a2e", "#16213e", "#1b2838"];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {photos.map((p, i) => (
          <div key={p.id} onClick={() => setOpen(p)} style={{ cursor: "pointer" }}>
            <div style={{
              background: colors[i], borderRadius: 10, aspectRatio: "3/4",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
              position: "relative",
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                padding: "16px 8px 8px", fontSize: 11, color: "#fff", textAlign: "center",
              }}>{p.label}</div>
            </div>
            {p.note && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, textAlign: "center" }}>{p.note}</div>}
          </div>
        ))}
      </div>
      {open && (
        <div onClick={() => setOpen(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#18181B", borderRadius: 16, padding: 24, maxWidth: 400, width: "90%",
            border: "1px solid rgba(255,255,255,0.1)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              background: "#1a1a2e", borderRadius: 10, aspectRatio: "3/4", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div style={{ marginTop: 12, fontSize: 14, color: "#fff", fontWeight: 600 }}>{open.label}</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{open.note}</div>
            <button onClick={() => setOpen(null)} style={{
              marginTop: 16, width: "100%", padding: "10px", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 14, cursor: "pointer",
            }}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  );
}

function ClientProfileScreen({ clientId, setScreen, setClientId }) {
  const client = MOCK_CLIENTS.find(c => c.id === clientId);
  if (!client) return null;
  const weightData = MOCK_WEIGHT_DATA[clientId] || [];
  const actData = MOCK_WORKOUT_ACTIVITY[clientId] || [];
  const logs = MOCK_WORKOUTS_LOG[clientId] || [];
  const bmiVal = bmi(client.weight_kg, client.height_cm);

  const Section = ({ title, children, action }) => (
    <div style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <Avatar name={client.full_name} size={72} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{client.full_name}</div>
              <span style={{
                background: "rgba(124,58,237,0.2)", color: "#A78BFA", fontSize: 12, fontWeight: 700,
                borderRadius: 99, padding: "3px 12px", border: "1px solid rgba(124,58,237,0.3)",
              }}>PRO</span>
            </div>
            <div style={{ fontSize: 14, color: "#6B7280" }}>{client.email}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              Зарегистрирован: {new Date(client.registered_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setScreen("client-chat")} style={{
              padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "none", background: "linear-gradient(to right, #5434B3, #7C3AED)", color: "#fff",
            }}>Написать</button>
            <button onClick={() => setScreen("assign")} style={{
              padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#e5e7eb",
            }}>Назначить тренировку</button>
          </div>
        </div>
      </div>

      {/* Params */}
      <Section title="Параметры">
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Пол", value: client.gender },
            { label: "Возраст", value: client.age + " лет" },
            { label: "Рост", value: client.height_cm + " см" },
            { label: "Вес", value: client.weight_kg + " кг" },
            { label: "ИМТ", value: bmiVal },
          ].map(p => (
            <div key={p.label} style={{
              flex: 1, background: "#0C0C16", borderRadius: 12, padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{p.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 14 }}>
          {[
            ["Цель", client.goal],
            ["Уровень", client.fitness_level],
            ["Активность", client.activity],
            ["Оборудование", client.equipment],
            ["Диета", client.diet],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#6B7280" }}>{k}: </span>
              <span style={{ color: "#e5e7eb", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Динамика веса</div>
          <WeightChart data={weightData} />
        </div>
        <div style={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Активность (неделя)</div>
          <ActivityChart data={actData} />
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 12 }}>
            Всего тренировок: <span style={{ color: "#fff", fontWeight: 600 }}>{client.total_workouts}</span>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            Последняя: <span style={{ color: "#fff", fontWeight: 600 }}>{daysSince(client.last_workout_at)}</span>
          </div>
        </div>
      </div>

      {/* Workout log */}
      <Section title="Последние тренировки">
        {logs.length === 0 ? (
          <div style={{ color: "#6B7280", fontSize: 13 }}>Тренировок нет</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Дата", "Тренировка", "Сложность", "Баллы"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px 12px 0", fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px 12px 12px 0", fontSize: 13, color: "#9CA3AF" }}>{l.date}</td>
                  <td style={{ padding: "12px 12px 12px 0", fontSize: 14, color: "#fff", fontWeight: 500 }}>{l.name}</td>
                  <td style={{ padding: "12px 12px 12px 0" }}>
                    <span style={{
                      fontSize: 12, borderRadius: 6, padding: "3px 10px",
                      background: l.level === "Продвинутый" ? "rgba(124,58,237,0.15)" : l.level === "Средний" ? "rgba(61,216,122,0.1)" : "rgba(107,114,128,0.15)",
                      color: l.level === "Продвинутый" ? "#A78BFA" : l.level === "Средний" ? "#3DD87A" : "#9CA3AF",
                    }}>{l.level}</span>
                  </td>
                  <td style={{ padding: "12px 0", fontSize: 14, color: "#fff" }}>{l.points} ⭐</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Photos */}
      <Section title="Фото прогресса">
        <ProgressPhotoGallery clientId={clientId} />
      </Section>
    </div>
  );
}

Object.assign(window, { ClientProfileScreen, WeightChart, ActivityChart });

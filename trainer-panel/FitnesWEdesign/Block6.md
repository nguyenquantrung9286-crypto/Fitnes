# Блок 6 — Web-панель тренера

> **Для реализующей модели:** этот документ — полная спецификация. Следуй ему строго. Все решения уже приняты, архитектура согласована. Не придумывай альтернатив — реализуй описанное.

---

## Обзор

Отдельное Next.js 14 приложение (App Router). Работает на том же Supabase backend, что и мобильное приложение (`asihntqqeipaxsdilkyv`). Тренер заходит через email/пароль, видит всех Pro-клиентов, общается с ними в чате, смотрит прогресс, назначает тренировки.

**URL:** будет деплоиться на Vercel как отдельный проект, например `trainer.fitnes.app`  
**Supabase Project ID:** `asihntqqeipaxsdilkyv`  
**Supabase URL:** `https://asihntqqeipaxsdilkyv.supabase.co`

---

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 14 (App Router, TypeScript) |
| Стилизация | Tailwind CSS v3 |
| UI-компоненты | shadcn/ui (через `npx shadcn-ui@latest init`) |
| Backend | Supabase (тот же проект) |
| Supabase клиент | `@supabase/ssr` + `@supabase/supabase-js` |
| Графики | Recharts |
| Иконки | lucide-react |
| Даты | date-fns + date-fns/locale/ru |
| Авторизация | Supabase Auth (email/password) + middleware |

---

## Шаг 0 — Инициализация проекта

Папка создаётся **рядом** с `FitnesApp/`:
```
/Documents/Fitnes/
├── FitnesApp/          ← мобильное приложение (уже существует)
└── TrainerPanel/       ← новый проект (создаёшь здесь)
```

```bash
cd /Users/danilsarahman/Documents/Fitnes
npx create-next-app@latest TrainerPanel \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*" \
  --no-turbopack

cd TrainerPanel
npm install @supabase/supabase-js @supabase/ssr
npm install recharts lucide-react date-fns
npx shadcn-ui@latest init
# При инициализации shadcn: style=Default, base color=Slate, CSS variables=yes
npx shadcn-ui@latest add button input label card badge avatar separator scroll-area
```

### `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://asihntqqeipaxsdilkyv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key из Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service role key — только на сервере>
```

### `tailwind.config.ts` — расширить стандартный конфиг:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7C3AED",
          dark: "#5434B3",
          light: "#A78BFA",
        },
        surface: {
          DEFAULT: "#0C0C16",
          card: "#18181B",
          border: "rgba(255,255,255,0.08)",
        },
        success: "#3DD87A",
        danger: "#FF5656",
        muted: "#6B7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

---

## Шаг 1 — Supabase клиенты

### `src/lib/supabase/browser.ts`
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `src/lib/supabase/server.ts`
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

### `src/middleware.ts`
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith("/login")) {
    if (user) return NextResponse.redirect(new URL("/dashboard", request.url));
    return supabaseResponse;
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check trainer role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") {
    return NextResponse.redirect(new URL("/login?error=not_trainer", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

---

## Шаг 2 — Миграции Supabase (добавить через Supabase MCP или dashboard)

### Миграция A: роль тренера в profiles
```sql
-- Добавить роль в profiles
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'trainer', 'admin'));

-- Обновить RLS: тренер читает данные своих Pro-клиентов через view
-- Trainer status: тренер обновляет свою строку
create policy "Trainers update own status"
  on public.trainer_status for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

-- Trainer messages: тренер видит все сообщения своих клиентов и может вставлять ответы
create policy "Trainers read messages of their clients"
  on public.trainer_messages for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

create policy "Trainers insert replies"
  on public.trainer_messages for insert
  with check (
    auth.uid() = trainer_id
    and is_from_user = false
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Progress photos: тренер читает фото своих Pro-клиентов
create policy "Trainers read client progress photos"
  on public.progress_photos for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Workout logs: тренер читает логи клиентов
create policy "Trainers read client workout logs"
  on public.workout_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Weight log: тренер читает вес клиентов
create policy "Trainers read client weight"
  on public.weight_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- User settings: тренер читает параметры клиентов
create policy "Trainers read client settings"
  on public.user_settings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Subscriptions: тренер читает тарифы для фильтрации Pro-клиентов
create policy "Trainers read subscriptions"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Push tokens: тренер читает токены для отправки уведомлений (через service role в Edge Function)
-- Не нужен дополнительный policy, Edge Function использует service_role

-- Workouts: тренер вставляет тренировки для клиентов
create policy "Trainers insert workouts for clients"
  on public.workouts for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'trainer'
    )
  );

-- Назначить роль тренера вручную (выполнить в Dashboard SQL-редакторе):
-- update profiles set role = 'trainer' where email = 'trainer@fitnes.app';
```

### Миграция B: assigned_workouts (назначение тренировок)
```sql
-- Таблица для назначенных тренером тренировок
create table if not exists public.assigned_workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  workout_id  uuid not null references public.workouts(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  note        text,
  unique (user_id, workout_id)
);

alter table public.assigned_workouts enable row level security;

-- Пользователь видит свои назначения
create policy "Users see own assigned workouts"
  on public.assigned_workouts for select
  using (auth.uid() = user_id);

-- Тренер видит все назначения и создаёт новые
create policy "Trainers manage assignments"
  on public.assigned_workouts for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );
```

---

## Шаг 3 — Типы (`src/lib/types.ts`)

```ts
export type Role = "user" | "trainer" | "admin";
export type Plan = "free" | "standard" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface ClientSummary {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan: Plan;
  // из user_settings
  goal: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  fitness_level: string | null;
  // агрегаты
  last_workout_at: string | null;
  total_workouts: number;
  unread_messages: number;
}

export interface TrainerMessage {
  id: string;
  user_id: string;
  trainer_id: string | null;
  content: string;
  is_from_user: boolean;
  read_at: string | null;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  difficulty_level: string | null;
  completed_at: string;
  workout?: { name: string; duration_min: number | null };
}

export interface WeightEntry {
  id: string;
  user_id: string;
  value_kg: number;
  measured_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_path: string;
  taken_at: string;
  note: string | null;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_min: number | null;
  difficulty_level: string | null;
  scheduled_at: string | null;
}
```

---

## Шаг 4 — Структура файлов

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx                   # <html> + провайдеры
│   ├── page.tsx                     # redirect → /dashboard
│   ├── login/
│   │   └── page.tsx                 # Форма входа
│   └── dashboard/
│       ├── layout.tsx               # Sidebar + TopBar
│       ├── page.tsx                 # Дашборд (обзор)
│       ├── clients/
│       │   ├── page.tsx             # Список клиентов
│       │   └── [id]/
│       │       ├── page.tsx         # Профиль клиента
│       │       ├── chat/
│       │       │   └── page.tsx     # Чат с клиентом
│       │       └── assign/
│       │           └── page.tsx     # Назначить тренировку
│       └── settings/
│           └── page.tsx             # Настройки тренера (статус онлайн)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── clients/
│   │   ├── ClientCard.tsx
│   │   ├── ClientList.tsx
│   │   └── ClientStatsPanel.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx           # Список сообщений + ввод
│   │   ├── MessageBubble.tsx
│   │   └── ConversationList.tsx     # Левая панель со всеми диалогами
│   ├── charts/
│   │   ├── WeightChart.tsx          # LineChart (Recharts)
│   │   └── WorkoutActivityChart.tsx # BarChart (Recharts)
│   ├── photos/
│   │   └── ProgressPhotoGallery.tsx
│   └── ui/                          # shadcn компоненты (auto-generated)
├── hooks/
│   ├── useTrainer.ts                # Текущий тренер
│   ├── useClients.ts                # Список Pro-клиентов
│   ├── useClientDetail.ts           # Данные конкретного клиента
│   └── useChat.ts                   # Realtime чат
└── lib/
    ├── supabase/
    │   ├── browser.ts
    │   └── server.ts
    └── types.ts
```

---

## Шаг 5 — Страницы (детальное описание)

---

### 5.1 Логин (`/login`)

**Файл:** `src/app/login/page.tsx`

**Дизайн:**
- Тёмный фон `#0C0C16`, по центру карточка `bg-[#18181B]` с скруглением 24px
- Логотип/эмодзи 💪 размером 48px, под ним заголовок «Панель тренера» (24px bold)
- Подзаголовок серым: «Войдите в систему»
- Email input + Password input (стандартный shadcn `Input`)
- Кнопка «Войти» — градиент `from-[#5434B3] to-[#7C3AED]`, 100% ширина, 52px высота
- Ошибка (неверные данные / не тренер) — красный баннер под кнопкой

**Логика:**
```ts
// Вход через Supabase Auth
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) { setError("Неверный email или пароль"); return; }
// После входа middleware сам проверяет role === 'trainer'
// Если не тренер → /login?error=not_trainer
router.push("/dashboard");
```

**Обработка `?error=not_trainer`:**
- Показать баннер: «Этот аккаунт не имеет прав тренера. Обратитесь к администратору.»

---

### 5.2 Дашборд (`/dashboard`)

**Файл:** `src/app/dashboard/page.tsx` (Server Component)

**Дизайн — 4 плитки сверху:**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  👥 Pro-клиенты │  💬 Непрочитано │  🏋 Тренировок  │  📊 Активных   │
│       12        │        3        │   сегодня: 5    │   за неделю: 8  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```
Каждая плитка: `bg-[#18181B] border border-white/8 rounded-2xl p-6`

**Под плитками — 2 колонки:**
- **Левая (60%):** Последние сообщения клиентов (5 диалогов) → клик открывает `/dashboard/clients/[id]/chat`
- **Правая (40%):** Клиенты без активности 7+ дней — предупреждение

**Данные (Server Component):**
```ts
// Считать Pro-клиентов
const { data: proClients } = await supabase
  .from("subscriptions")
  .select("user_id, plan")
  .eq("plan", "pro")
  .eq("status", "active");

// Непрочитанные сообщения (is_from_user = true, read_at IS NULL)
const { count: unread } = await supabase
  .from("trainer_messages")
  .select("*", { count: "exact", head: true })
  .eq("is_from_user", true)
  .is("read_at", null);
```

---

### 5.3 Список клиентов (`/dashboard/clients`)

**Файл:** `src/app/dashboard/clients/page.tsx` (Client Component для поиска)

**Дизайн:**
- Заголовок «Клиенты» (28px bold) + кол-во Pro-клиентов справа в badge фиолетовом
- Поиск: Input с иконкой Search, фильтрует по имени/email прямо на клиенте
- Сетка карточек: 3 колонки на десктопе, 2 на планшете, 1 на мобильном

**Карточка клиента (`ClientCard.tsx`):**
```
┌────────────────────────────────────────┐
│  [Аватар 48px]  Имя клиента      PRO  │
│                 email@example.com      │
│  ──────────────────────────────────── │
│  Цель: Похудение   Уровень: Средний   │
│  Вес: 78 кг        Рост: 175 см       │
│  ──────────────────────────────────── │
│  Последняя тренировка: 3 дня назад    │
│  Тренировок всего: 12                 │
│  [3 непрочитанных]                    │
│                                       │
│  [Профиль]  [Написать]               │
└────────────────────────────────────────┘
```
- Фон `#18181B`, border `rgba(255,255,255,0.08)`, borderRadius 20px
- Badge «PRO» фиолетовый
- Кнопка «Профиль» — outline, «Написать» — фиолетовый градиент

**Данные:**
```ts
// Получить всех Pro-клиентов с их данными
const { data: subscriptions } = await supabase
  .from("subscriptions")
  .select("user_id")
  .eq("plan", "pro")
  .eq("status", "active");

const userIds = subscriptions?.map(s => s.user_id) ?? [];

// Параллельно загрузить profiles + user_settings + последние тренировки
const [profiles, settings, workoutCounts, unreadCounts] = await Promise.all([
  supabase.from("profiles").select("*").in("id", userIds),
  supabase.from("user_settings").select("user_id,goal,weight_kg,height_cm,fitness_level").in("user_id", userIds),
  // группировка логов по user_id — сделать через RPC или считать в JS
  supabase.from("workout_logs").select("user_id,completed_at").in("user_id", userIds).order("completed_at", { ascending: false }),
  supabase.from("trainer_messages").select("user_id").in("user_id", userIds).eq("is_from_user", true).is("read_at", null),
]);
// Собрать ClientSummary[] в JS
```

---

### 5.4 Профиль клиента (`/dashboard/clients/[id]`)

**Файл:** `src/app/dashboard/clients/[id]/page.tsx`

**Дизайн — 3 секции:**

#### Верхняя — шапка клиента
```
[Аватар 72px]  Имя Фамилия          PRO
               email@example.com
               Зарегистрирован: 12 апр 2026

[Написать]  [Назначить тренировку]
```

#### Секция «Параметры»
```
┌──────┬──────┬──────┬──────┬──────┐
│ Пол  │ Воз- │ Рост │  Вес │ ИМТ  │
│  М   │ раст │175см │ 78кг │ 25.5 │
│      │  28  │      │      │      │
└──────┴──────┴──────┴──────┴──────┘

Цель: Набор мышечной массы
Уровень: Продвинутый
Активность: 4–5 раз в неделю
Оборудование: Штанга, гантели, турник
Диета: Без ограничений
```

#### Секция «Активность» (2 колонки)
- **Левая:** `WeightChart` — LineChart за последние 90 дней (из `weight_log`)
- **Правая:** `WorkoutActivityChart` — BarChart тренировок по дням/неделям (из `workout_logs`)

#### Секция «Последние тренировки» — таблица
```
Дата          Тренировка        Сложность    Баллы
22 апр 2026   Силовая верх      Продвинутый  30 ⭐
19 апр 2026   Кардио            Средний      20 ⭐
```

#### Секция «Фото прогресса»
- Grid 3×N фотографий с датами (компонент `ProgressPhotoGallery`)
- Клик → открывает фото на весь экран (нативный `<dialog>` или div-оверлей)

---

### 5.5 Чат с клиентом (`/dashboard/clients/[id]/chat`)

**Файл:** `src/app/dashboard/clients/[id]/chat/page.tsx`

**Дизайн — 2 панели (flex-row):**

```
┌──────────────────┬───────────────────────────────────────┐
│  ДИАЛОГИ         │  ИМЯ КЛИЕНТА                          │
│  ──────────────  │  ────────────────────────────────────  │
│  Иван П.    3 🔴  │                                       │
│  Мария С.   1 🔴  │    [Сообщение клиента] 14:23          │
│  Артём К.        │                                        │
│  ...             │        [Ответ тренера] 14:25           │
│                  │                                        │
│                  │    [Сообщение клиента] 14:30           │
│                  │                                        │
│                  │  ──────────────────────────────────── │
│                  │  [ Напиши ответ...             ] [▶]   │
└──────────────────┴───────────────────────────────────────┘
```

**Левая панель (`ConversationList`):**
- Список всех Pro-клиентов у которых есть сообщения
- Для каждого: аватар, имя, последнее сообщение (2 строки), время, бейдж непрочитанных
- Активный диалог выделен фиолетовой левой полосой + `bg-[#5434B3]/20`
- Клик → переходим к `/dashboard/clients/[id]/chat`

**Правая панель (`ChatWindow`):**
- Заголовок: аватар + имя клиента + «Клиент на тарифе PRO»
- Сообщения: пузыри как в мобильном приложении (user = синий gradient справа, trainer = тёмный слева)
- При загрузке: `useEffect` → `scrollToBottom`
- Supabase Realtime: `subscribeToTrainerMessages(userId, onMessage)` — новые сообщения появляются без перезагрузки
- Ввод: `<textarea>` + кнопка отправки (иконка Send), Enter без Shift → отправить, Shift+Enter → новая строка
- При отправке: INSERT в `trainer_messages` с `is_from_user = false, trainer_id = currentTrainer.id`
- Отправка автоматически помечает прочитанные сообщения (`UPDATE trainer_messages SET read_at = now() WHERE user_id = X AND is_from_user = true AND read_at IS NULL`)

**Realtime (Client Component):**
```ts
// useChat.ts
import { createClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";
import type { TrainerMessage } from "@/lib/types";

export function useChat(userId: string) {
  const supabase = createClient();
  const [messages, setMessages] = useState<TrainerMessage[]>([]);

  useEffect(() => {
    // Загрузить историю
    supabase
      .from("trainer_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data ?? []));

    // Realtime подписка
    const channel = supabase
      .channel(`trainer_chat_${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "trainer_messages",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as TrainerMessage];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const sendMessage = async (content: string, trainerId: string) => {
    await supabase.from("trainer_messages").insert({
      user_id: userId,
      trainer_id: trainerId,
      content,
      is_from_user: false,
    });
    // Пометить входящие как прочитанные
    await supabase
      .from("trainer_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_from_user", true)
      .is("read_at", null);
  };

  return { messages, sendMessage };
}
```

---

### 5.6 Назначение тренировки (`/dashboard/clients/[id]/assign`)

**Файл:** `src/app/dashboard/clients/[id]/assign/page.tsx`

**Дизайн:**
- Заголовок: «Назначить тренировку — [Имя клиента]»
- Список всех тренировок из таблицы `workouts` (все, не только для этого клиента)
- Каждая тренировка — карточка: название, тип, длительность, сложность
- Кнопка «Назначить» → INSERT в `assigned_workouts` + INSERT в `workouts` с `user_id = client.id`
- Опциональное поле «Заметка для клиента» (появляется в push-уведомлении)
- Успех → toast + редирект на профиль клиента

**Примечание по логике назначения:**
Тренировка дублируется в `workouts` с `user_id = client.id` — это нужно чтобы клиент видел её в мобильном приложении. Оригинал остаётся как шаблон.

```ts
// При нажатии "Назначить"
const { data: newWorkout } = await supabase
  .from("workouts")
  .insert({
    user_id: clientId,
    name: template.name,
    description: template.description,
    workout_type: template.workout_type,
    duration_min: template.duration_min,
    difficulty_level: template.difficulty_level,
    scheduled_at: new Date().toISOString(), // сегодня
  })
  .select()
  .single();

await supabase.from("assigned_workouts").insert({
  user_id: clientId,
  trainer_id: trainerId,
  workout_id: newWorkout.id,
  note: noteText,
});
```

---

### 5.7 Настройки тренера (`/dashboard/settings`)

**Файл:** `src/app/dashboard/settings/page.tsx`

**Дизайн — 2 секции:**

#### Секция «Статус»
```
┌────────────────────────────────────────┐
│  Ваш статус для клиентов               │
│                                        │
│  ● Онлайн                [Toggle ON]   │
│  Клиенты видят: «отвечу в течение часа»│
└────────────────────────────────────────┘
```
- Toggle (shadcn Switch) — моментально обновляет `trainer_status` через Supabase
- При включении создаётся или обновляется запись: `UPSERT trainer_status SET is_online = true WHERE trainer_id = me`

```ts
const toggleStatus = async (isOnline: boolean) => {
  await supabase
    .from("trainer_status")
    .upsert({ trainer_id: user.id, is_online: isOnline, updated_at: new Date().toISOString() },
      { onConflict: "trainer_id" });
};
```

#### Секция «Профиль»
- Поле Full name (редактировать → UPDATE profiles)
- Email (только для чтения)
- Кнопка «Выйти» → `supabase.auth.signOut()` → redirect `/login`

---

## Шаг 6 — Layout с Sidebar

### `src/app/dashboard/layout.tsx`
```tsx
// Server Component
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0C0C16] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### `Sidebar.tsx` — дизайн:
```
┌──────────────────┐
│  💪 Fitnes       │
│  Панель тренера  │
│  ────────────── │
│  🏠 Дашборд      │
│  👥 Клиенты      │
│  💬 Чаты         │
│  ⚙️ Настройки    │
│                  │
│  (внизу)         │
│  ● Онлайн        │  ← статус тренера
│  Имя Тренера     │
└──────────────────┘
```
- Ширина 240px, фон `#18181B`, border-r `rgba(255,255,255,0.08)`
- Активный пункт: фиолетовый левый border (3px) + `bg-[#7C3AED]/15` + фиолетовый текст
- Неактивный: серый текст, hover `bg-white/5`
- Индикатор статуса внизу: зелёная (онлайн) / серая (оффлайн) точка + имя

### `TopBar.tsx` — дизайн:
```
Клиенты                              [🔔 3]  [Аватар]
(breadcrumb из URL)                   (непрочитанные)
```
- Фон `#18181B`, border-b `rgba(255,255,255,0.08)`, высота 60px
- Колокол с бейджем непрочитанных сообщений (Realtime счётчик)

---

## Шаг 7 — Графики

### `WeightChart.tsx`
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// data: WeightEntry[]
const chartData = data.map(e => ({
  date: format(new Date(e.measured_at), "d MMM", { locale: ru }),
  weight: Number(e.value_kg),
}));

return (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={chartData}>
      <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
      <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
      <Tooltip
        contentStyle={{ backgroundColor: "#18181B", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
        labelStyle={{ color: "#9CA3AF" }}
        itemStyle={{ color: "#FFFFFF" }}
      />
      <Line type="monotone" dataKey="weight" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#7C3AED", r: 4 }} />
    </LineChart>
  </ResponsiveContainer>
);
```

### `WorkoutActivityChart.tsx`
```tsx
// data: { date: string, count: number }[] — сгруппировать workout_logs по дням
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Bar fill: "#7C3AED", radius 4px, background "#18181B"
```

---

## Шаг 8 — `ProgressPhotoGallery.tsx`

```tsx
// photos: ProgressPhoto[]
// Получить signed URL для каждого фото (bucket progress-photos приватный)
const { data: signedUrl } = await supabase.storage
  .from("progress-photos")
  .createSignedUrl(photo.photo_path, 3600); // 1 час

// Грид 3 колонки
// Клик → <dialog> с полным размером
// Показать дату + заметку под фото
```

**Важно:** тренер должен иметь доступ к чужим файлам в Storage. Нужно обновить Storage policy:
```sql
-- В Supabase Storage policies для bucket 'progress-photos':
-- Добавить SELECT policy:
-- (auth.role() = 'authenticated' AND
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'))
-- OR (auth.uid() = owner)
```

---

## Шаг 9 — Деплой на Vercel

```bash
# Из папки TrainerPanel/
npm run build  # проверить что нет ошибок

# Деплой
npx vercel --prod

# Env variables на Vercel:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY (только серверные функции)
```

---

## Дизайн-система

### Цвета
| Токен | Hex | Применение |
|---|---|---|
| Brand | `#7C3AED` | Кнопки, иконки, акценты |
| Brand Dark | `#5434B3` | Gradient start, hover |
| Surface | `#0C0C16` | Фон страниц |
| Card | `#18181B` | Карточки, sidebar, topbar |
| Border | `rgba(255,255,255,0.08)` | Разделители, обводки |
| Success | `#3DD87A` | Онлайн, выполнено |
| Danger | `#FF5656` | Ошибки, пропущено |
| Muted | `#6B7280` | Вторичный текст |
| Text | `#FFFFFF` | Основной текст |

### Типографика
- Font: `Inter` (подключить через `next/font/google`)
- Заголовки: `font-bold`, страничные H1 = 28px, секционные H2 = 20px
- Тело: 14px `text-white/90`, вторичное 12px `text-[#6B7280]`

### Общие радиусы
- Карточки: `rounded-2xl` (16px)
- Кнопки: `rounded-xl` (12px)
- Inputs: `rounded-xl` (12px)
- Badges: `rounded-full`

### Кнопки
```tsx
// Primary (фиолетовый gradient)
<button className="bg-gradient-to-r from-[#5434B3] to-[#7C3AED] text-white px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">

// Secondary (outline)
<button className="border border-white/10 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-white/5 transition-colors">

// Danger
<button className="bg-[#FF5656]/10 text-[#FF5656] border border-[#FF5656]/20 px-4 py-2.5 rounded-xl font-semibold hover:bg-[#FF5656]/20 transition-colors">
```

### Карточка (базовая)
```tsx
<div className="bg-[#18181B] border border-white/8 rounded-2xl p-6">
  ...
</div>
```

---

## Порядок реализации

Выполнять строго по порядку:

1. **Инициализация проекта** (Шаг 0) — убедиться что `npm run dev` запускается
2. **Supabase клиенты + middleware** (Шаг 1) — проверить что `/dashboard` редиректит на `/login`
3. **Миграции в Supabase** (Шаг 2) — применить через MCP или SQL-редактор Dashboard
4. **Типы** (Шаг 3)
5. **Layout (Sidebar + TopBar)** (Шаг 6) — статичный, без данных
6. **Страница логина** (Шаг 5.1) — полностью рабочая, проверить вход/выход
7. **Список клиентов** (Шаг 5.3) — сначала с мок-данными, потом реальные запросы
8. **Профиль клиента** (Шаг 5.4) — параметры + таблица тренировок
9. **Графики** (Шаг 7) — подключить к реальным данным
10. **Фото прогресса** (Шаг 8)
11. **Чат** (Шаг 5.5) — самая сложная часть, тестировать Realtime
12. **Назначение тренировок** (Шаг 5.6)
13. **Настройки** (Шаг 5.7)
14. **Дашборд** (Шаг 5.2) — собрать агрегаты
15. **Деплой** (Шаг 9)

---

## Частые ошибки (предупреждения)

1. **RLS блокирует тренера** — если данные не приходят, проверь что policy для `role = 'trainer'` создан. Временно можно проверить через service_role ключ.

2. **Supabase Realtime и Next.js Server Components** — Realtime работает только в Client Components (`"use client"`). Страница чата должна быть Client Component.

3. **Приватный Storage (progress-photos)** — `createSignedUrl` работает только с service_role или если пользователь — владелец. Тренеру нужна дополнительная policy (см. Шаг 8).

4. **NEXT_PUBLIC_ переменные** — только `NEXT_PUBLIC_` видны в браузере. `SUPABASE_SERVICE_ROLE_KEY` — только серверная (Route Handlers, Server Actions, Server Components).

5. **Cookies и SSR** — использовать `@supabase/ssr`, не `@supabase/supabase-js` напрямую для server-side. Иначе сессия не будет передаваться.

6. **Infinite scroll в чате** — при загрузке истории сначала загружать, потом `scrollToBottom`. Иначе прыжок скролла будет виден.

7. **trainer_id при отправке** — при INSERT в `trainer_messages` обязательно передавать `trainer_id = currentUser.id`, иначе policy отклонит.

---

*Документ создан: 2026-04-22*  
*После реализации баги правит старший агент.*

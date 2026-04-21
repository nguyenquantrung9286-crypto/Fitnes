# Block 0 — Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить инфраструктуру подписок: таблица Supabase + хук `useSubscription()` + компонент `PaywallBanner` + экран `PaywallScreen`.

**Architecture:** Таблица `subscriptions` в Supabase с RLS (только чтение для пользователя, запись только через service_role). Хук `useSubscription()` читает тариф через TanStack Query, отсутствие записи = `free`. `PaywallBanner` — встраиваемая заглушка с контекстным текстом для каждой фичи. `PaywallScreen` — экран сравнения тарифов без реальной оплаты (MVP).

**Tech Stack:** Supabase (PostgreSQL + RLS), TanStack Query v5, NativeWind v4, expo-router v6, lucide-react-native, React Native

---

## Файловая карта

| Файл | Действие | Ответственность |
|---|---|---|
| `FitnesApp/supabase/migrations/00006_subscriptions.sql` | Создать | Таблица `subscriptions` + RLS политики |
| `FitnesApp/src/services/subscriptions.ts` | Создать | Функция запроса подписки из Supabase |
| `FitnesApp/src/hooks/useSubscription.ts` | Создать | Хук с TanStack Query, флаги, `canAccess()` |
| `FitnesApp/src/components/atoms/PaywallBanner.tsx` | Создать | Встраиваемая заглушка для закрытых фич |
| `FitnesApp/app/paywall.tsx` | Создать | Экран сравнения тарифов |
| `FitnesApp/src/components/atoms/index.ts` | Изменить | Добавить экспорт `PaywallBanner` |

---

## Task 1: Миграция — таблица `subscriptions`

**Files:**
- Create: `FitnesApp/supabase/migrations/00006_subscriptions.sql`

- [ ] **Step 1: Создать файл миграции**

```sql
-- FitnesApp/supabase/migrations/00006_subscriptions.sql

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan        text        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'standard', 'pro')),
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled')),
  expires_at  timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_subscriptions_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Пользователь читает только свою строку
CREATE POLICY "subscriptions: user can read own"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Запись только через service_role (ручное управление администратором)
-- INSERT/UPDATE/DELETE не открываются для authenticated/anon
```

- [ ] **Step 2: Применить миграцию через Supabase MCP**

Выполнить через `mcp__supabase__apply_migration` с именем `add_subscriptions_table` и содержимым файла выше.

- [ ] **Step 3: Проверить что таблица создана**

Выполнить через `mcp__supabase__execute_sql`:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subscriptions'
ORDER BY ordinal_position;
```
Ожидаемый результат: 7 колонок (id, user_id, plan, status, expires_at, created_at, updated_at).

- [ ] **Step 4: Проверить RLS политику**

```sql
SELECT polname, polcmd, polroles
FROM pg_policies
WHERE tablename = 'subscriptions';
```
Ожидаемый результат: политика `subscriptions: user can read own` для SELECT.

- [ ] **Step 5: Вставить тестовую запись для существующего пользователя (через Dashboard)**

Через Supabase Dashboard → Table Editor → subscriptions → Insert row:
- `user_id`: UUID любого существующего пользователя из таблицы `profiles`
- `plan`: `pro`
- `status`: `active`

- [ ] **Step 6: Commit**

```bash
git add FitnesApp/supabase/migrations/00006_subscriptions.sql
git commit -m "feat(db): add subscriptions table with RLS"
```

---

## Task 2: Сервис `subscriptions.ts`

**Files:**
- Create: `FitnesApp/src/services/subscriptions.ts`

- [ ] **Step 1: Создать файл сервиса**

```typescript
// FitnesApp/src/services/subscriptions.ts
import { supabase } from "@/lib/supabase";

export type Plan = "free" | "standard" | "pro";

export type Subscription = {
  id: string;
  user_id: string;
  plan: Plan;
  status: "active" | "cancelled";
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchSubscription(userId: string): Promise<Plan> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status === "cancelled") return "free";
  return data.plan as Plan;
}
```

- [ ] **Step 2: Убедиться что `supabase` клиент импортируется корректно**

Проверить: файл `FitnesApp/src/lib/supabase.ts` экспортирует `supabase` — это уже есть в проекте, импорт корректен.

- [ ] **Step 3: Commit**

```bash
git add FitnesApp/src/services/subscriptions.ts
git commit -m "feat(services): add fetchSubscription service"
```

---

## Task 3: Хук `useSubscription()`

**Files:**
- Create: `FitnesApp/src/hooks/useSubscription.ts`

- [ ] **Step 1: Создать хук**

```typescript
// FitnesApp/src/hooks/useSubscription.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchSubscription, Plan } from "@/services/subscriptions";

export type SubscriptionFeature =
  | "history_full"       // полная история (Standard+)
  | "ai_scanner"         // AI-сканер еды (Standard+)
  | "progress_photos"    // фото прогресса (Standard+)
  | "live_trainer"       // живой тренер (Pro only)
  | "personalized_menu"; // персональное меню (Pro only)

const FEATURE_MIN_PLAN: Record<SubscriptionFeature, "standard" | "pro"> = {
  history_full:      "standard",
  ai_scanner:        "standard",
  progress_photos:   "standard",
  live_trainer:      "pro",
  personalized_menu: "pro",
};

const PLAN_RANK: Record<Plan, number> = {
  free:     0,
  standard: 1,
  pro:      2,
};

export function useSubscription() {
  const { user } = useAuth();

  const { data: plan = "free", isLoading } = useQuery<Plan>({
    queryKey: ["subscription", user?.id],
    queryFn: () => fetchSubscription(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const canAccess = (feature: SubscriptionFeature): boolean => {
    const minPlan = FEATURE_MIN_PLAN[feature];
    return PLAN_RANK[plan] >= PLAN_RANK[minPlan];
  };

  return {
    plan,
    isLoading,
    isFree:     plan === "free",
    isStandard: plan === "standard",
    isPro:      plan === "pro",
    isPaid:     plan !== "free",
    canAccess,
  };
}
```

- [ ] **Step 2: Проверить что `useAuth` возвращает `user` с `id`**

Открыть `FitnesApp/src/hooks/useAuth.ts` — он возвращает `useAuthContext()`. Убедиться что контекст содержит `user.id`. (В проекте это уже есть — `auth-context` предоставляет Supabase user объект).

- [ ] **Step 3: Commit**

```bash
git add FitnesApp/src/hooks/useSubscription.ts
git commit -m "feat(hooks): add useSubscription hook with canAccess helper"
```

---

## Task 4: Компонент `PaywallBanner`

**Files:**
- Create: `FitnesApp/src/components/atoms/PaywallBanner.tsx`
- Modify: `FitnesApp/src/components/atoms/index.ts`

- [ ] **Step 1: Создать компонент**

```typescript
// FitnesApp/src/components/atoms/PaywallBanner.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Lock } from "lucide-react-native";
import { SubscriptionFeature } from "@/hooks/useSubscription";

type FeatureMeta = {
  minPlanLabel: string;
  title: string;
  description: string;
};

const FEATURE_META: Record<SubscriptionFeature, FeatureMeta> = {
  history_full: {
    minPlanLabel: "Стандарт",
    title: "Полная история",
    description: "Смотри статистику за любой период — не только за сегодня",
  },
  ai_scanner: {
    minPlanLabel: "Стандарт",
    title: "AI-сканер еды",
    description: "Сфотографируй блюдо — ИИ посчитает КБЖУ автоматически",
  },
  progress_photos: {
    minPlanLabel: "Стандарт",
    title: "Фото прогресса",
    description: "Фиксируй визуальный прогресс и сравнивай результаты",
  },
  live_trainer: {
    minPlanLabel: "Про",
    title: "Живой тренер",
    description: "Живой тренер отвечает лично на твои вопросы",
  },
  personalized_menu: {
    minPlanLabel: "Про",
    title: "Персональное меню",
    description: "AI составит план питания под твои параметры и цели",
  },
};

type PaywallBannerProps = {
  feature: SubscriptionFeature;
};

export default function PaywallBanner({ feature }: PaywallBannerProps) {
  const router = useRouter();
  const meta = FEATURE_META[feature];

  return (
    <View className="mx-4 my-2 rounded-[16px] bg-dark-800 border border-primary-600/30 p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <Lock size={16} color="#7C3AED" />
        <Text
          className="text-primary-400 text-sm"
          style={{ fontFamily: "Manrope-SemiBold" }}
        >
          Доступно на тарифе {meta.minPlanLabel}
        </Text>
      </View>
      <Text
        className="text-white text-base mb-1"
        style={{ fontFamily: "Manrope-Bold" }}
      >
        {meta.title}
      </Text>
      <Text
        className="text-white/60 text-sm mb-3"
        style={{ fontFamily: "Manrope-Regular" }}
      >
        {meta.description}
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/paywall")}
        activeOpacity={0.8}
        className="bg-primary-600 rounded-[10px] py-2 px-4 self-start"
      >
        <Text
          className="text-white text-sm"
          style={{ fontFamily: "Manrope-SemiBold" }}
        >
          Перейти на {meta.minPlanLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Добавить экспорт в `index.ts`**

Открыть `FitnesApp/src/components/atoms/index.ts` и добавить строку:

```typescript
export { default as PaywallBanner } from "./PaywallBanner";
```

Итоговый файл:
```typescript
export { default as CustomButton } from "./CustomButton";
export { default as CustomInput } from "./CustomInput";
export { default as Card } from "./Card";
export { default as MetricTile } from "./MetricTile";
export { default as DifficultyBadge } from "./DifficultyBadge";
export { FlameIcon, SneakerIcon, WaterDropIcon } from "./Icons";
export { default as PaywallBanner } from "./PaywallBanner";
```

- [ ] **Step 3: Commit**

```bash
git add FitnesApp/src/components/atoms/PaywallBanner.tsx FitnesApp/src/components/atoms/index.ts
git commit -m "feat(ui): add PaywallBanner component"
```

---

## Task 5: Экран `PaywallScreen`

**Files:**
- Create: `FitnesApp/app/paywall.tsx`

- [ ] **Step 1: Создать экран**

```typescript
// FitnesApp/app/paywall.tsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, X, ArrowLeft } from "lucide-react-native";

type PlanFeatureRow = {
  label: string;
  free: boolean;
  standard: boolean;
  pro: boolean;
};

const FEATURES: PlanFeatureRow[] = [
  { label: "Трекер воды",              free: true,  standard: true,  pro: true  },
  { label: "Трекер КБЖУ (вручную)",    free: true,  standard: true,  pro: true  },
  { label: "ИИ-тренер (чат)",          free: true,  standard: true,  pro: true  },
  { label: "Базовые тренировки",       free: true,  standard: true,  pro: true  },
  { label: "Данные только за сегодня", free: true,  standard: false, pro: false },
  { label: "Полная история",           free: false, standard: true,  pro: true  },
  { label: "AI-сканер еды",            free: false, standard: true,  pro: true  },
  { label: "Фото прогресса",           free: false, standard: true,  pro: true  },
  { label: "Живой тренер",             free: false, standard: false, pro: true  },
  { label: "Персональное меню",        free: false, standard: false, pro: true  },
];

function FeatureCheck({ value }: { value: boolean }) {
  return value
    ? <Check size={16} color="#3DD87A" />
    : <X size={16} color="#ffffff30" />;
}

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-dark-950">
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text
          className="text-white text-xl ml-3"
          style={{ fontFamily: "Manrope-Bold" }}
        >
          Тарифы
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Заголовки тарифов */}
        <View className="flex-row px-4 mb-4">
          <View className="flex-1" />
          {(["Free", "Стандарт", "Про"] as const).map((label, i) => (
            <View key={label} className={`w-20 items-center ${i === 2 ? "bg-primary-600/20 rounded-xl py-2" : "py-2"}`}>
              <Text
                className={`text-sm ${i === 2 ? "text-primary-400" : "text-white/60"}`}
                style={{ fontFamily: "Manrope-Bold" }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Строки фич */}
        {FEATURES.map((row, idx) => (
          <View
            key={row.label}
            className={`flex-row items-center px-4 py-3 ${idx % 2 === 0 ? "bg-white/3" : ""}`}
          >
            <Text
              className="flex-1 text-white/80 text-sm"
              style={{ fontFamily: "Manrope-Regular" }}
            >
              {row.label}
            </Text>
            <View className="w-20 items-center"><FeatureCheck value={row.free} /></View>
            <View className="w-20 items-center"><FeatureCheck value={row.standard} /></View>
            <View className="w-20 items-center bg-primary-600/10 rounded-lg py-1">
              <FeatureCheck value={row.pro} />
            </View>
          </View>
        ))}

        {/* CTA */}
        <View className="mx-4 mt-8 p-5 rounded-[20px] bg-dark-800 border border-white/10">
          <Text
            className="text-white text-base mb-1"
            style={{ fontFamily: "Manrope-Bold" }}
          >
            Хочешь активировать тариф?
          </Text>
          <Text
            className="text-white/50 text-sm mb-4"
            style={{ fontFamily: "Manrope-Regular" }}
          >
            Напиши нам — активируем вручную в течение часа.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-primary-600 rounded-[12px] py-3 items-center"
            onPress={() => {
              /* TODO: открыть Telegram/email администратора */
            }}
          >
            <Text
              className="text-white text-base"
              style={{ fontFamily: "Manrope-Bold" }}
            >
              Связаться с нами
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add FitnesApp/app/paywall.tsx
git commit -m "feat(ui): add PaywallScreen with plan comparison"
```

---

## Task 6: Ручная проверка в симуляторе

- [ ] **Step 1: Запустить dev-сервер**

```bash
cd FitnesApp && npx expo start -c
```

- [ ] **Step 2: Проверить хук — пользователь без записи в `subscriptions`**

Открыть любой экран где будет добавлен `useSubscription()`. Убедиться что:
- `plan` = `"free"`
- `isFree` = `true`
- `canAccess("ai_scanner")` = `false`

Для быстрой проверки — временно добавить в `app/(tabs)/profile.tsx`:
```tsx
const { plan, isPaid, canAccess } = useSubscription();
console.log("[sub]", { plan, isPaid, canAccess_ai: canAccess("ai_scanner") });
```

Ожидаемый вывод в консоли: `{ plan: "free", isPaid: false, canAccess_ai: false }`

- [ ] **Step 3: Проверить хук — пользователь с записью `pro` в Supabase**

Через Supabase Dashboard вставить запись для текущего тест-пользователя с `plan: 'pro'`. Перезапустить приложение. Ожидаемый вывод: `{ plan: "pro", isPaid: true, canAccess_ai: true }`.

- [ ] **Step 4: Проверить PaywallBanner**

Временно добавить в любой экран:
```tsx
import { PaywallBanner } from "@/components/atoms";
// ...
<PaywallBanner feature="live_trainer" />
<PaywallBanner feature="ai_scanner" />
```

Убедиться что:
- `live_trainer` показывает «Доступно на тарифе Про»
- `ai_scanner` показывает «Доступно на тарифе Стандарт»
- Кнопка «Перейти на...» открывает `/paywall` экран

- [ ] **Step 5: Проверить PaywallScreen**

Убедиться что экран отображается корректно: 3 колонки, галочки, секция «Связаться». Прокрутка работает.

- [ ] **Step 6: Убрать временный debug-код**

Удалить `console.log` и временные `<PaywallBanner>` добавленные для проверки.

- [ ] **Step 7: Финальный commit**

```bash
git add -A
git commit -m "feat(block0): subscriptions infrastructure complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ Таблица `subscriptions` с UNIQUE(user_id) — Task 1
- ✅ RLS: пользователь читает только свою строку — Task 1
- ✅ Дефолт отсутствие записи = free — Task 3 (`data ?? 'free'`)
- ✅ Хук `useSubscription()` с `isFree/isStandard/isPro/isPaid/canAccess` — Task 3
- ✅ `SubscriptionFeature` type union — Task 3
- ✅ `PaywallBanner` с контекстным текстом по минимальному тарифу — Task 4
- ✅ `PaywallScreen` с сравнением тарифов — Task 5
- ✅ Кнопка «Связаться» вместо реальной оплаты (MVP) — Task 5

**Что НЕ входит (по спеку):**
- Автоматическая оплата — намеренно исключено
- Автосоздание строки при регистрации — намеренно исключено

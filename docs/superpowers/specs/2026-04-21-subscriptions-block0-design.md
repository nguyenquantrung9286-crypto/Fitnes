# Блок 0 — Подписки: Дизайн

**Дата:** 2026-04-21  
**Статус:** Утверждён  
**Этап:** MVP с ручным управлением через Supabase Dashboard

---

## Тарифы

| Тариф | Ограничения |
|---|---|
| **Free** | Все фичи Standard, но данные только за сегодня. Фото прогресса недоступны. |
| **Standard** | Полный доступ: история, AI-сканер, фото прогресса, неограниченный AI-чат. |
| **Pro** | Всё из Standard + живой тренер в чате + персонализированное меню. |

---

## Секция 1 — База данных

### Таблица `subscriptions`

```sql
id          uuid        PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE
plan        text        NOT NULL DEFAULT 'free' CHECK (plan IN ('free','standard','pro'))
status      text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled'))
expires_at  timestamptz NULL        -- NULL = бессрочно (ручное управление)
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

**Индексы:**
- `UNIQUE(user_id)` — гарантирует одну запись на пользователя на уровне БД

**RLS политики:**
- `SELECT`: пользователь читает только свою строку (`auth.uid() = user_id`)
- `INSERT/UPDATE/DELETE`: только `service_role` (администратор через Supabase Dashboard)

**Дефолт для новых пользователей:** строка НЕ создаётся автоматически при регистрации. Отсутствие записи = `free`. Администратор создаёт запись вручную при активации платного тарифа.

---

## Секция 2 — Хук `useSubscription()`

**Файл:** `FitnesApp/src/hooks/useSubscription.ts`

### Возвращаемый тип

```ts
type SubscriptionFeature =
  | 'history_full'       // полная история (Standard+)
  | 'ai_scanner'         // AI-сканер еды (Standard+)
  | 'progress_photos'    // фото прогресса (Standard+)
  | 'live_trainer'       // живой тренер (Pro only)
  | 'personalized_menu'  // персональное меню (Pro only)

type UseSubscriptionResult = {
  plan: 'free' | 'standard' | 'pro'
  isLoading: boolean
  isFree: boolean      // plan === 'free'
  isStandard: boolean  // plan === 'standard'
  isPro: boolean       // plan === 'pro'
  isPaid: boolean      // plan !== 'free' — для Standard+ фич
  canAccess: (feature: SubscriptionFeature) => boolean
}
```

### Логика

- Один запрос через TanStack Query: `queryKey: ['subscription', userId]`, `staleTime: 5 минут`
- Если запись в `subscriptions` отсутствует → `plan: 'free'`
- `canAccess()` — маппинг фичи на минимальный тариф:

```ts
const FEATURE_MIN_PLAN: Record<SubscriptionFeature, 'standard' | 'pro'> = {
  history_full:      'standard',
  ai_scanner:        'standard',
  progress_photos:   'standard',
  live_trainer:      'pro',
  personalized_menu: 'pro',
}
```

### Паттерн использования

```tsx
const { canAccess } = useSubscription();
if (!canAccess('live_trainer')) return <PaywallBanner feature="live_trainer" />;
```

---

## Секция 3 — Paywall UI

### Компонент `PaywallBanner`

**Файл:** `FitnesApp/src/components/atoms/PaywallBanner.tsx`  
**Props:** `feature: SubscriptionFeature`

Внутри компонента — маппинг `feature → { minPlan, title, description }`. Компонент сам определяет правильный тариф и текст. Кнопка открывает экран `PaywallScreen`.

**Примеры рендера:**

```
// ai_scanner → Standard
🔒  Доступно на тарифе Стандарт
Сфотографируй блюдо — ИИ посчитает КБЖУ автоматически
[  Перейти на Стандарт  ]

// live_trainer → Pro
🔒  Доступно на тарифе Про
Живой тренер отвечает лично на твои вопросы
[  Перейти на Про  ]
```

**Стиль:** тёмная карточка, фиолетовый акцент (`primary-600`), соответствует дизайн-системе.

### Экран `PaywallScreen`

**Файл:** `FitnesApp/app/paywall.tsx`

Три колонки (Free / Стандарт / Про) с галочками по фичам. Кнопка «Связаться» — контакт администратора для ручной активации (MVP). Без реальной платёжной интеграции.

---

## Что НЕ входит в этот этап

- Автоматическая оплата (RevenueCat, StoreKit, Play Billing) — будущий этап
- Автосоздание `subscriptions` строки при регистрации — не нужно (отсутствие = free)
- Вебхуки и уведомления об истечении подписки

---

## Файлы к созданию/изменению

| Файл | Действие |
|---|---|
| `supabase/migrations/00006_subscriptions.sql` | Новая миграция — таблица `subscriptions` + RLS |
| `FitnesApp/src/hooks/useSubscription.ts` | Новый хук |
| `FitnesApp/src/components/atoms/PaywallBanner.tsx` | Новый компонент |
| `FitnesApp/app/paywall.tsx` | Новый экран |
| `FitnesApp/src/components/atoms/index.ts` | Экспорт `PaywallBanner` |

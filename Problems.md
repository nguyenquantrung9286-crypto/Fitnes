# Аудит проекта FitnesApp — Senior Tech Lead Review
*Дата проведения: 2026-04-17 · Рецензент: Senior Tech Lead / QA-архитектор*

> Предыдущий отчёт (предрелизный аудит от 2026-04-16) отражал состояние на момент первичной стабилизации сборки. После запуска Expo Go на физическом устройстве проведён повторный, глубокий аудит кодовой базы.
> Ниже — реальные, все ещё актуальные проблемы, которые влияют на корректность работы, безопасность, UX и поддерживаемость.

---

## 📊 Сводка

| Категория | Кол-во |
|---|---|
| 🔴 Критические (блокируют функциональность/безопасность) | 8 |
| 🟠 Важные (повлияют на UX / стабильность в продакшене) | 9 |
| 🟡 Рекомендации (улучшения качества и архитектуры) | 7 |
| **Итого** | **24** |

Дизайн и пользовательский флоу **не меняем** — только чиним то, что реально сломано или небезопасно.

---

## 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 🔴 #C1. Загрузка фото в Supabase Storage через `fetch(uri).blob()` не работает на iOS/Android

**Файл:** `FitnesApp/src/services/api.ts:150-160` (функция `useAnalyzeFood`)

**Что не так.**
В React Native (Hermes/JSC) `fetch(uri).blob()` для `file://` URI возвращает «пустой» Blob (0 байт) или бросает `Network request failed` на iOS. Supabase в итоге грузит 0-байтовое изображение, а Edge Function `analyze-food-vision` получает пустой URL и возвращает ошибку парсинга JSON. Это полностью ломает главный UX-флоу — сканер еды.

**Как чинить (шагово).**
1. Открыть `src/services/api.ts`, найти функцию `useAnalyzeFood`.
2. Заменить загрузку Blob на загрузку через `ArrayBuffer` из `expo-file-system` (или на FormData + multipart).
3. Перед использованием установить пакет: `npx expo install expo-file-system`.

**Пример исправления:**
```ts
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

// Внутри mutationFn:
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
});
const arrayBuffer = decode(base64);

const { data: uploadData, error: uploadError } = await supabase.storage
  .from("food-scans")
  .upload(filename, arrayBuffer, {
    contentType: "image/jpeg",
    upsert: false,
  });
```

---

### 🔴 #C2. В Storage-политиках все `food-scans` публичны для чтения

**Файл:** `FitnesApp/supabase/migrations/00002_add_storage_buckets.sql:11-22`

**Что не так.**
Создана политика `"Public Access"` с `FOR SELECT USING ( bucket_id = 'food-scans' )` — любой неавторизованный пользователь может прочитать **любое** фото еды, зная имя файла. Плюс ниже ещё одна политика `FOR ALL` — но она не отменяет первую, политики в Postgres складываются через `OR`. Получаем утечку приватных изображений.

**Как чинить.**
1. Создать новую миграцию `supabase/migrations/00004_fix_storage_rls.sql`:
   ```sql
   -- Удалить избыточную публичную политику
   DROP POLICY IF EXISTS "Public Access" ON storage.objects;

   -- Оставить только владельческий доступ
   DROP POLICY IF EXISTS "Users can manage their own scans" ON storage.objects;
   CREATE POLICY "Users can view own scans"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (
       bucket_id = 'food-scans' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );
   CREATE POLICY "Users can upload own scans"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (
       bucket_id = 'food-scans' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );
   CREATE POLICY "Users can delete own scans"
     ON storage.objects FOR DELETE
     TO authenticated
     USING (
       bucket_id = 'food-scans' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );
   ```
2. В Supabase Dashboard перевести bucket `food-scans` в **private** (снять флаг public).
3. Вместо `getPublicUrl` использовать `createSignedUrl(path, 3600)` в `api.ts:164`, иначе Edge Function не сможет загрузить фото.
4. Применить миграцию: `npx supabase db push --linked --yes`.

---

### 🔴 #C3. Отсутствует защита роутов — `(tabs)` доступны без авторизации

**Файл:** `FitnesApp/app/_layout.tsx` (+ `app/auth/login.tsx:91-97`)

**Что не так.**
В `_layout.tsx` нет guard-логики. В `CLAUDE.md` явно указано «Root layout, QueryClientProvider, auth redirect», но редиректа нет. На экране логина кнопка **«Пропустить»** отправляет пользователя в `/(tabs)` без сессии. После этого:
- `useAuth().user === null`,
- все `useQuery` обращения падают с ошибкой RLS («JWT is missing» или пустые массивы),
- мутации типа `useCreateProgressEntry` кидают `Not authenticated`.

**Как чинить.**
1. В `_layout.tsx` добавить guard (пример, без смены дизайна):
   ```tsx
   import { Slot, useRouter, useSegments } from "expo-router";
   import { useAuth } from "@/hooks/useAuth";

   function AuthGuard({ children }: { children: React.ReactNode }) {
     const { user, loading } = useAuth();
     const segments = useSegments();
     const router = useRouter();

     useEffect(() => {
       if (loading) return;
       const inAuthGroup = segments[0] === "auth";
       const inTabs = segments[0] === "(tabs)";
       if (!user && inTabs) router.replace("/auth/login");
     }, [user, loading, segments]);

     if (loading) return <ActivityIndicator />;
     return <>{children}</>;
   }
   ```
   И обернуть `<StackScreen />` в `<AuthGuard>`.
2. В `app/auth/login.tsx:91-97` удалить кнопку «Пропустить», либо перенаправлять её на `/welcome`, а не в `/(tabs)`. Без сессии приложение бесполезно.

---

### 🔴 #C4. `supabase.ts` падает молча, если `.env` не прокинут

**Файл:** `FitnesApp/src/lib/supabase.ts:5-6`

**Что не так.**
```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```
Non-null assertion `!` не даёт рантайм-гарантии. Если переменные отсутствуют (EAS Build без secrets), создаётся клиент с `undefined`, и все запросы падают с неинформативным `TypeError: URL is not valid`.

**Как чинить.**
```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[Supabase] Отсутствуют EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
    "Проверьте .env и eas.json (env блок)."
  );
}
```
Дополнительно в `eas.json` прописать `env` для сборок `preview`/`production`, иначе бандл получит `undefined`:
```json
"preview": {
  "distribution": "internal",
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "https://asihntqqeipaxsdilkyv.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
  },
  "android": { "buildType": "apk" }
}
```

---

### 🔴 #C5. `signUpWithEmail` пишет в профиль до того, как триггер создал запись

**Файл:** `FitnesApp/src/services/auth.ts:14-38`

**Что не так.**
1. `supabase.auth.signUp` при «email confirmation required» возвращает `data.user`, но **RLS запрещает UPDATE** у ещё не подтверждённого пользователя (JWT на этом этапе `null` до verify).
2. Триггер `handle_new_user` создаёт запись в `public.profiles` **AFTER INSERT** на `auth.users`, но вызов `.update({...}).eq("id", user.id)` может произойти до коммита транзакции триггера → `0 rows updated`.
3. Ошибка глотается через `console.error`, и данные онбординга **теряются** без уведомления пользователя.

**Как чинить.**
1. Выполнять `update('profiles')` только после успешного `signInWithEmail` (после подтверждения email или в колбэке `onAuthStateChange`). Либо отключить email confirmation в Supabase Dashboard и после `signUp` сделать `signInWithPassword`, затем делать `upsert`.
2. Использовать `upsert`, а не `update`, чтобы снять гонку с триггером:
   ```ts
   const { error: settingsError } = await supabase
     .from("profiles")
     .upsert({ id: data.user.id, onboarding_data: settings }, { onConflict: "id" });
   ```
3. Пробрасывать ошибку наверх (`throw settingsError`), иначе UI не узнает о проблеме.

---

### 🔴 #C6. В `register.tsx` — `Alert.alert` + `router.replace` одновременно

**Файл:** `FitnesApp/app/auth/register.tsx:40-41`

**Что не так.**
```ts
Alert.alert("Успех", "Аккаунт создан! Теперь войдите.");
router.replace("/(tabs)");
```
`router.replace` вызывается до того, как пользователь увидит/закроет Alert. А сам редирект идёт в `/(tabs)` без подтверждённой сессии (см. #C3, #C5). В итоге пользователь видит пустые вкладки и не понимает, что делать.

**Как чинить.**
```ts
Alert.alert(
  "Проверьте почту",
  "Мы отправили письмо для подтверждения. После подтверждения войдите в аккаунт.",
  [{ text: "Ок", onPress: () => router.replace("/auth/login") }]
);
```
И убрать `router.replace("/(tabs)")` вне колбэка.

---

### 🔴 #C7. `scheduleWorkoutReminder` передаёт `Date` в `trigger as any` — сломается в SDK 54

**Файл:** `FitnesApp/src/services/notifications.ts:53-60`

**Что не так.**
Expo SDK 54 требует объект триггера: `{ type: SchedulableTriggerInputTypes.DATE, date }`. Передача голого `Date` даже через `as any` в новой версии SDK игнорируется или бросает `Invalid trigger`. Уведомления о тренировках просто не будут создаваться.

**Как чинить.**
```ts
import { SchedulableTriggerInputTypes } from "expo-notifications";

await Notifications.scheduleNotificationAsync({
  content: { title: "Пора тренироваться! 🏋️", body: `…`, data: { screen: "/(tabs)/workouts" } },
  trigger: {
    type: SchedulableTriggerInputTypes.DATE,
    date: trigger,
  },
});
```

---

### 🔴 #C8. `useVideoPlayer` инициализируется с пустой строкой и потом вызывает `player.replace` в эффекте

**Файл:** `FitnesApp/app/workouts/[id].tsx:20-32`

**Что не так.**
1. `useVideoPlayer("", ...)` на iOS бросает варнинг `invalid URL`, на Android — создаёт плеер в `error` стейте.
2. `useEffect` зависит от `player` — но `player` это объект экземпляра, созданный `useVideoPlayer`. Он может быть пересоздан внутри хука каждый раз при перерендере → бесконечный цикл `replace → play → render`.

**Как чинить.**
```ts
const videoSource = exercise?.video_url || null;
const player = useVideoPlayer(videoSource, (p) => { p.loop = true; });

useEffect(() => {
  if (!videoSource) return;
  player.replace(videoSource);
  player.play();
}, [videoSource]); // не кладём сам player в deps
```
И в JSX рендерить `<VideoView>` только при `exercise?.video_url`.

---

## 🟠 ВАЖНЫЕ ПРОБЛЕМЫ

### 🟠 #I1. Дубль комментария и «мёртвый» подсчёт воды

**Файл:** `FitnesApp/app/(tabs)/index.tsx:47-49, 99-101`

- Дважды подряд `// Calculate nutrition totals` — опечатка при правке.
- Блок «Вода» всегда показывает `0 / {waterGoal} мл` и прогресс `0%`, хотя в UserSettings уже есть `water_intake_goal_ml`. Нет ни state, ни записи в БД → UX неконсистентен (в CLAUDE.md принцип *Zero-input*).

**Как чинить.**
1. Удалить лишний комментарий.
2. Добавить локальный state `waterMl` + кнопку «+250 мл», либо скрыть блок до реализации (поставить placeholder-заглушку), чтобы не вводить пользователя в заблуждение.

---

### 🟠 #I2. `router.push("/workouts")` ведёт в несуществующий маршрут

**Файл:** `FitnesApp/app/(tabs)/index.tsx:187`

**Что не так.**
В Expo Router группа `(tabs)` прозрачна для URL, но маршрут `/workouts` коллиcится с динамическим `app/workouts/[id].tsx`. Переход должен быть `/(tabs)/workouts`.

**Как чинить.**
```tsx
router.push("/(tabs)/workouts");
```

---

### 🟠 #I3. `selectedTheme` в профиле не синхронизируется с реальной темой при монтировании

**Файл:** `FitnesApp/app/(tabs)/profile.tsx:18-19`

```tsx
const { colorScheme, setColorScheme } = useNativeWindColorScheme();
const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
```
Пользователь мог ранее выбрать `dark`, но при открытии вкладки тумблер показывает «Система». При клике на другой пункт восстанавливается корректная тема, но визуал вводит в заблуждение.

**Как чинить.**
Либо хранить пользовательский выбор в `AsyncStorage` и подгружать в `useEffect` + задавать его в `selectedTheme`, либо рассчитывать начальное значение из `useNativeWindColorScheme().colorScheme`:
```tsx
const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(
  () => (colorScheme as 'light' | 'dark') ?? 'system'
);
```

---

### 🟠 #I4. `workouts/[id].tsx` — отсутствуют `dark:` классы

**Файл:** `FitnesApp/app/workouts/[id].tsx:36, 44, 69, 71, 79, 82, 110, 114, 166-168`

**Что не так.**
Экран полностью светлый: `bg-gray-50`, `bg-white`, `text-gray-900`, `text-gray-500`. В тёмной теме всё выглядит сломанно (белые блоки, чёрный текст на фоне тёмной системной навигации).

**Как чинить.**
Добавить парные `dark:` варианты аналогично остальным экранам:
- `bg-gray-50` → `bg-gray-50 dark:bg-dark-950`
- `bg-white` → `bg-white dark:bg-dark-900`
- `text-gray-900` → `text-gray-900 dark:text-gray-50`
- `text-gray-500` → `text-gray-500 dark:text-gray-400`
- `bg-gray-50 p-3` внутри `StatBox` → `bg-gray-50 dark:bg-dark-800 p-3`.

---

### 🟠 #I5. `login.tsx`/`register.tsx` — светлая тема зашита

**Файлы:** `FitnesApp/app/auth/login.tsx:35, 43-44`, `FitnesApp/app/auth/register.tsx:53, 61-64`

Аналогично #I4 — `bg-gray-50`, `text-gray-900`, `text-gray-500` без `dark:` вариантов. При включённой тёмной теме карточки выглядят разорвано.

**Как чинить.** Добавить `dark:bg-dark-950`, `dark:text-gray-50`, `dark:text-gray-400`.

---

### 🟠 #I6. Race condition `setTimeout(150)` в `app/index.tsx`

**Файл:** `FitnesApp/app/index.tsx:22-24`

**Что не так.**
Хак с `setTimeout(() => checkAndRedirect(), 150)` появился как workaround от «навигация до инициализации router». В Expo Router 6 правильный способ — дождаться `segments` или использовать `router.replace` после `useFocusEffect`. Таймер на 150мс ломается на слабых устройствах.

**Как чинить.**
```tsx
useEffect(() => {
  (async () => {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    router.replace(completed === "true" ? "/(tabs)" : "/welcome");
  })();
}, []);
```
Expo Router сам очередизует `replace`, если root ещё не смонтирован.

---

### 🟠 #I7. Неиспользованный импорт `useColorScheme` в `app/index.tsx`

**Файл:** `FitnesApp/app/index.tsx:5, 11`

`colorScheme` не используется ни в JSX, ни в логике. Мертвый код, плюс лишняя подписка на тему.

**Как чинить.** Удалить `import { useColorScheme }…` и строку с деструктуризацией.

---

### 🟠 #I8. `StepSummary` — пересчёт только на mount; возврат назад не обновляет КБЖУ

**Файл:** `FitnesApp/app/onboarding/index.tsx:502-506`

**Что не так.**
```ts
useEffect(() => {
  calculateBMI();
  calculateDailyCalories();
}, []);
```
Пустой массив deps + функции замыкают старые `settings`. Если пользователь вернулся и поменял вес/рост → значения КБЖУ на сводке старые (или NaN, если пользователь прыгнул вперёд, не заполнив ничего).

**Как чинить.**
Добавить реальные зависимости и обернуть `calculateBMI`/`calculateDailyCalories` в `useCallback` в контексте, либо вызывать расчёты по клику «Продолжить» на шаге 4, сохраняя результаты в контекст до рендера summary.

---

### 🟠 #I9. Хардкод возраста `age = 30` в расчёте калорий

**Файл:** `FitnesApp/src/lib/onboarding-context.tsx:66-67`

```ts
const age = 30; // Default, could be calculated from birth_date
```
Но поле `birth_date` в `UserSettings` уже есть. Формула Mifflin-St Jeor без реального возраста даёт ±200 ккал ошибку для молодых/пожилых пользователей. Это искажает главную цифру приложения.

**Как чинить.**
```ts
const birthDate = settings.birth_date ? new Date(settings.birth_date) : null;
const age = birthDate
  ? Math.max(13, Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400 * 1000)))
  : 30;
```
И добавить шаг онбординга для ввода года рождения (сейчас `birth_date` ни на одном шаге не заполняется).

---

## 🟡 РЕКОМЕНДАЦИИ (долговые и качественные улучшения)

### 🟡 #R1. `EAS build: production` — пустой конфиг

**Файл:** `FitnesApp/eas.json:16`

`"production": {}` — сборка упадёт без `distribution`, `env`, `channel`. Нужно наполнить заранее (см. #C4).

---

### 🟡 #R2. Orphan-файлы в Storage при ошибке анализа

**Файл:** `FitnesApp/src/services/api.ts:154-167`

Если Edge Function падает, файл уже в bucket остаётся навсегда. Рекомендую:
1. В `onError` у `useAnalyzeFood` вызывать `supabase.storage.from("food-scans").remove([uploadData.path])`.
2. Настроить cron-очистку (Edge Function `nightly-cleanup`).

---

### 🟡 #R3. `useAuth` — нет мемоизации и подписки на `profile`

**Файл:** `FitnesApp/src/hooks/useAuth.ts`

Каждый компонент, вызывающий `useAuth`, открывает отдельную подписку на `onAuthStateChange`. При 5–10 потребителях это 5–10 слушателей. Выгоднее сделать `AuthProvider` (Context) с одной подпиской и общими полями `user`, `session`, `profile`.

---

### 🟡 #R4. Нет offline-очереди для мутаций

`TanStack Query` персистит только cache, мутации не ставятся в очередь. При обрыве сети `useCreateProgressEntry` / `useCreateNutritionLog` просто упадут. Решение — `onlineManager` + `mutationDefaults` с `networkMode: 'offlineFirst'` и retry на exponentially-backoff, либо отдельная очередь в AsyncStorage.

---

### 🟡 #R5. Нет централизованного логгера / Sentry

Все ошибки либо в `console.error`, либо в `Alert.alert`. В продакшене ничего не увидим. Добавить `@sentry/react-native` с `sentryMiddleware` в Edge Functions.

---

### 🟡 #R6. `expo-video` плагин указан в `app.json`, но не требуется в SDK 54

**Файл:** `FitnesApp/app.json:40`

В Expo SDK 54 `expo-video` не требует конфиг-плагин (автогенерация через `expo-modules-autolinking`). Плагин просто no-op, но лишняя строка. Можно убрать для чистоты.

---

### 🟡 #R7. Дизайн-токены: `dark.500 = #3F3F46` дублируется с нейтральной палитрой

**Файл:** `FitnesApp/tailwind.config.js:38-51`

Шкала `dark` фактически повторяет серый; имя «dark» для светлых оттенков (`dark-50 = #E5E5EA`) сбивает. Рекомендую переименовать в `surface` или `neutral-dark` и оставить только 700–950 для реально тёмных.

---

## 📌 Чек-лист действий (приоритизированный)

```
[x] #C1 Починить загрузку фото (FileSystem.readAsStringAsync + base64 → ArrayBuffer)
[x] #C2 Удалить политику "Public Access", bucket → private, signed URL
[x] #C3 Добавить AuthGuard в _layout.tsx, убрать «Пропустить» в login.tsx
[x] #C4 Runtime-валидация ENV + env в eas.json
[x] #C5 upsert вместо update в signUpWithEmail, не игнорировать ошибку
[x] #C6 Alert → onPress → router.replace("/auth/login") в register
[x] #C7 trigger { type: DATE, date } в scheduleWorkoutReminder
[x] #C8 Заменить "" на null в useVideoPlayer, убрать player из deps

[x] #I1  Убрать дубль-комментарий + реализовать «Вода» (state waterMl + кнопка +250мл)
[x] #I2  router.push("/(tabs)/workouts")
[x] #I3  selectedTheme initial = colorScheme
[x] #I4  dark: классы в workouts/[id].tsx
[x] #I5  dark: классы в auth/login.tsx, auth/register.tsx
[x] #I6  Убрать setTimeout(150) в app/index.tsx
[x] #I7  Убрать неиспользованный useColorScheme
[x] #I8  useEffect с зависимостями в StepSummary
[x] #I9  Реальный возраст из birth_date в calculateDailyCalories

[x] #R1 EAS build: production — дополнен distribution, env
[x] #R2 Orphan-файлы в Storage — cleanup в onError Edge Function
[x] #R3 useAuth — создан AuthProvider (Context), одна глобальная подписка
[ ] #R4 Offline-очередь для мутаций — требует WatermelonDB, отложено
[ ] #R5 Централизованный логгер / Sentry — отложено
[x] #R6 expo-video плагин — удалён из app.json (SDK 54 не требует)
[x] #R7 Дизайн-токены — добавлена палитра surface в tailwind.config.js
```

---

## 💡 Идеи по развитию проекта

1. **AI-coach bi-directional chat.** Сейчас есть таблица `messages`, но UI не реализован. Добавить вкладку или модалку с real-time (Supabase Realtime) чатом «пользователь ↔ ИИ-тренер» — это ключевая фича описания «единая экосистема здоровья».
2. **Weekly plan auto-generation.** После онбординга автоматически генерировать 7-дневный план тренировок и питания через отдельную Edge Function (LLM-промпт на основе `onboarding_data`). Сейчас пользователь видит «План не составлен» без пути создать его.
3. **Health insights.** Раз в неделю анализировать шаги, вес, съеденное и присылать push «Ты на 7% ближе к цели». Реализуется через Cron в Supabase Edge Functions + `expo-notifications`.
4. **Social accountability.** Опционально — «бадди-система»: два пользователя становятся партнёрами, видят прогресс друг друга (отдельный RLS-слой на `progress_entries` с `friend_id`).
5. **HealthKit → Supabase sync.** Сейчас шаги читаются, но нигде не сохраняются. Добавить фоновую задачу (Background Fetch) раз в день, писать в новую таблицу `daily_metrics`, использовать в дашборде.
6. **Offline-first питание.** Использовать локальную БД (WatermelonDB или SQLite + Drizzle) для nutrition_log, синхронизация при появлении сети.
7. **Biometric lock.** `expo-local-authentication` на вход и на просмотр приватных разделов («прогресс», «фото до/после»).
8. **Admin-панель тренера (веб).** Упомянута в `PROJECT_STATE.md` как стадия 7. Правильно сделать отдельный Next.js проект в `/web/` с общей Supabase базой, чтобы тренер мог видеть клиентов и отвечать в чате.
9. **Analytics-события.** Подключить `posthog-react-native` или `@amplitude/analytics-react-native` — минимум 10 событий (onboarding_completed, workout_started, food_scanned, weight_logged) даст ориентир по ретеншену.
10. **i18n.** Сейчас строки вшиты по-русски. `i18n-js` + языковые файлы позволят подключать en/kk без переписывания.

---

## 🤖 Дополнительный аудит (AI Assistant Review)
*Дата проведения: 2026-04-18 · Рецензент: Gemini CLI Agent*

В ходе дополнительного анализа конфигурации и структуры проекта выявлены следующие потенциальные риски:

### 🟡 #A1. Аномальные версии зависимостей в `package.json`
**Файл:** `FitnesApp/package.json`
**Что не так:** Указаны версии `expo: ~54.0.33` и `react-native: 0.81.5`. На текущий момент (даже с учетом контекста 2026 года) эти версии выглядят как нестабильные или опережающие график релизов. Это может привести к:
- Несовместимости с нативными модулями, которые еще не поддерживают архитектуру RN 0.81.
- Ошибкам сборки в EAS, так как SDK 54 может быть в статусе бета или отсутствовать на серверах сборки.
**Рекомендация:** Проверить актуальность версий и, если это не обоснованное использование nightly-сборок, откатиться до стабильных версий (например, SDK 52/53).

### 🟡 #A2. Некорректные единицы измерения в `tailwind.config.js`
**Файл:** `FitnesApp/tailwind.config.js:90, 93`
**Что не так:** Значения `button: "52"` без указания единиц (px, rem) могут интерпретироваться NativeWind неоднозначно. 
**Рекомендация:** Использовать числовое значение `52` или строку с единицами `"52px"`, чтобы гарантировать корректную высоту кнопок согласно спецификации (от 52px).

### 🟡 #A3. Архитектурная несогласованность (Empty `src/screens`)
**Что не так:** Существует папка `src/screens/`, которая на данный момент пуста, в то время как вся логика экранов находится в `app/`. Это создает путаницу в структуре проекта.
**Рекомендация:** Либо перенести логику компонентов экранов в `src/screens` (оставив в `app/` только импорты для роутинга), либо удалить пустую папку `src/screens`, если принято решение использовать Flat-структуру в `app/`.

### 🟡 #A4. Фатальная ошибка в `supabase.ts` при отсутствии ENV
**Файл:** `FitnesApp/src/lib/supabase.ts:11`
**Что не так:** Использование `throw new Error` в глобальной области видимости при отсутствии ключей приведет к немедленному падению приложения при запуске ("Red Box") без возможности показать пользователю понятное сообщение об ошибке или заглушку.
**Рекомендация:** Вместо `throw` использовать `console.error` и возвращать `null` или прокси-объект, либо обрабатывать отсутствие ключей на уровне `_layout.tsx` с выводом системного уведомления о необходимости настройки окружения.

---

*Примечание: Данные пункты дополняют критические проблемы (C1-C8), описанные выше, и направлены на повышение стабильности сборки и чистоту архитектуры.*

---

## 🔎 Актуальная локальная проверка
*Дата проведения: 2026-04-18 · Рецензент: Codex*

Проверка запускалась локально из директории `FitnesApp/` командой:

```bash
npx tsc --noEmit
```

Команда завершилась с `exit code 2` и подтвердила следующие актуальные ошибки сборки.

### 🔴 #L1. Экран чата импортирует несуществующий `useAuth`
**Файлы:** `FitnesApp/app/(tabs)/chat.tsx:13,25`, `FitnesApp/src/context/auth-context.tsx:49`, `FitnesApp/src/hooks/useAuth.ts:1-4`

**Что не так.**
В `chat.tsx` используется импорт:
```ts
import { useAuth } from "@/context/auth-context";
```
Но `auth-context.tsx` экспортирует только `AuthProvider` и `useAuthContext`. Реальный хук-обёртка `useAuth` находится в `src/hooks/useAuth.ts`.

**Как проявляется.**
TypeScript падает с ошибкой:
```text
app/(tabs)/chat.tsx(13,10): error TS2305: Module '"@/context/auth-context"' has no exported member 'useAuth'.
```

**Рекомендация.**
Поменять импорт в `chat.tsx` на `@/hooks/useAuth` либо экспортировать `useAuth` из `auth-context.tsx` единообразно для всего приложения.

### 🔴 #L2. `FlashList` используется с пропом, которого нет в установленной версии
**Файл:** `FitnesApp/app/(tabs)/workouts.tsx:114-119`

**Что не так.**
Компонент `FlashList` получает `estimatedItemSize={120}`, но типы из установленного пакета `@shopify/flash-list@2.0.2` больше не содержат этого пропа в `FlashListProps`.

**Как проявляется.**
TypeScript падает с ошибкой:
```text
app/(tabs)/workouts.tsx(117,9): error TS2322: Property 'estimatedItemSize' does not exist on type 'FlashListProps<Workout>'.
```

**Рекомендация.**
Сверить экран с API текущей версии `FlashList`: либо убрать `estimatedItemSize`, либо заменить его на поддерживаемую схему настройки layout для v2.

### 🔴 #L3. `expo-file-system` подключён через API, несовместимый с текущими типами SDK
**Файлы:** `FitnesApp/src/services/api.ts:157-159`, `FitnesApp/node_modules/expo-file-system/build/index.d.ts`

**Что не так.**
Код использует:
```ts
import * as FileSystem from "expo-file-system";
```
и затем обращается к `FileSystem.readAsStringAsync` и `FileSystem.EncodingType.Base64`. В установленной версии пакета верхнеуровневый `expo-file-system` экспортирует новый API и `legacyWarnings`; перечисление `EncodingType` на этом уровне отсутствует.

**Как проявляется.**
TypeScript падает с ошибкой:
```text
src/services/api.ts(158,30): error TS2339: Property 'EncodingType' does not exist on type 'typeof import(".../expo-file-system/build/index")'.
```

**Рекомендация.**
Либо перейти на новый File API из Expo SDK 54, либо явно использовать legacy-импорт для старого API чтения файла в base64.

### 🔴 #L4. Edge Function попадает в общий `tsc` приложения, но не изолирована под Deno
**Файлы:** `FitnesApp/supabase/functions/analyze-food-vision/index.ts:1`, `FitnesApp/tsconfig.json`, `FitnesApp/supabase/functions/`

**Что не так.**
Корневой `tsconfig.json` включает `**/*.ts`, поэтому `npx tsc --noEmit` пытается типизировать Supabase Edge Function вместе с React Native приложением. При этом в `supabase/functions/` нет отдельного `deno.json`/`tsconfig.json`, а файл использует Deno-style URL import:
```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
```

**Как проявляется.**
TypeScript падает с ошибкой:
```text
supabase/functions/analyze-food-vision/index.ts(1,23): error TS2307: Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.
```

**Рекомендация.**
Либо исключить `supabase/functions/**` из корневого `tsc`, либо оформить для функций отдельную Deno-конфигурацию и проверять их отдельной командой.

### 🔴 #L5. В `catch` у Edge Function используется `error.message` без сужения типа
**Файл:** `FitnesApp/supabase/functions/analyze-food-vision/index.ts:79-80`

**Что не так.**
В блоке `catch (error)` значение `error` в строгом TypeScript имеет тип `unknown`, но далее читается `error.message` без проверки `instanceof Error`.

**Как проявляется.**
TypeScript падает с ошибкой:
```text
supabase/functions/analyze-food-vision/index.ts(80,49): error TS18046: 'error' is of type 'unknown'.
```

**Рекомендация.**
Сузить тип через `error instanceof Error ? error.message : "Unknown error"` или явно типизировать обработку ошибки безопасным способом.

## Итог по свежей проверке

- Подтверждено 5 актуальных ошибок сборки/типизации.
- Все 5 проблем воспроизводятся локально одной командой: `npx tsc --noEmit`.
- `npx expo-doctor` за 20 секунд не выдал результата и был остановлен по таймауту, поэтому в этот отчёт не включён как источник подтверждённых ошибок.

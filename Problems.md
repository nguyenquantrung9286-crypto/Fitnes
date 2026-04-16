# Предрелизный аудит: FitnesApp — Финальный статус
*Дата аудита: 2026-04-16 | Проверка исправлений: 2026-04-16*

---

## Итоговая сводка после исправлений

| Категория | Было | Осталось |
|---|---|---|
| 🔴 Критические | 7 | 1 |
| 🟠 Важные | 8 | 0 |
| 🟡 Рекомендации | 4 | 0 |
| **ИТОГО** | **19** | **1** |

**Статус готовности:**
- `npx expo start` — ✅ **ГОТОВО** (все блокирующие баги устранены)
- `eas build` — ✅ **ГОТОВО** (`eas.json`, `expo-camera` плагин добавлены)

**Единственное обязательное действие пользователя:**
- Вписать реальный Supabase Anon Key в `.env` (без него все запросы к БД падают с 401)

---

## ✅ ИСПРАВЛЕНО (18 из 19)

| # | Проблема | Статус |
|---|---|---|
| 1 | `index.ts` → неверная точка входа | ✅ Заменено на `import 'expo-router/entry'` |
| 2 | `app/_layout.tsx` → дублирующие JSX-теги + нет `OnboardingProvider` | ✅ Структура исправлена, провайдер добавлен в root |
| 3 | `welcome.tsx` → `TouchableOpacity` не импортирован | ✅ Добавлен в импорт |
| 5 | `tailwind.config.js` → `src/` не в `content` | ✅ Добавлено `"./src/**/*.{js,jsx,ts,tsx}"` |
| 6 | Edge Function → API-ключ захардкожен | ✅ Заменено на `Deno.env.get("POLZA_AI_KEY")` |
| 7 | `register.tsx` → `useOnboarding` без провайдера | ✅ `OnboardingProvider` теперь в root layout |
| 8 | Колонка `onboarding_data` отсутствует в схеме | ✅ Миграция `00003_add_onboarding_data.sql` создана |
| 9 | `StepSummary` → `calculateBMI/Calories` вне `useEffect` | ✅ Обёрнуто в `useEffect(fn, [])` |
| 10 | `login.tsx` → prop `loading` вместо `isLoading` | ✅ Исправлено на `isLoading={loading}` |
| 11 | CSS-градиенты не работают в React Native | ✅ `LinearGradient` из `expo-linear-gradient` |
| 12 | Отсутствует `eas.json` | ✅ Файл создан с профилями dev/preview/production |
| 13 | `expo-camera` не в `plugins` | ✅ Добавлен в `app.json` с описанием разрешения |
| 14 | Цвет `dark-950` не определён | ✅ Добавлен в `tailwind.config.js` |
| 15 | `styled()` HOC из NativeWind v2 | ✅ Удалён из `CustomButton.tsx` и `Card.tsx` |
| 16 | Системная тема не определяется корректно | ✅ Добавлен `selectedTheme` state в `profile.tsx` |
| 17 | Тип триггера уведомлений устарел | ✅ Заменено на `SchedulableTriggerInputTypes.DAILY` |
| 18 | Конфликтующие RLS-политики Storage | ✅ Избыточная политика удалена |
| 19 | `analysisResult: any` в `scanner.tsx` | ✅ Типизировано через `FoodAnalysisResult` |

---

## 🔴 ТРЕБУЕТ ДЕЙСТВИЯ ПОЛЬЗОВАТЕЛЯ

### #4 — Вписать реальный Supabase Anon Key в `.env`

**Файл:** `FitnesApp/.env`

**Текущее состояние:**
```
EXPO_PUBLIC_SUPABASE_URL=https://asihntqqeipaxsdilkyv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here   ← ЗАМЕНИТЬ!
```

**Влияние:** Без реального ключа все обращения к Supabase возвращают `401 Unauthorized`. Авторизация, загрузка данных, сканер еды — ничего не работает.

**Действие:**
1. Открыть [Supabase Dashboard](https://app.supabase.com/project/asihntqqeipaxsdilkyv/settings/api)
2. Скопировать `anon` / `public` ключ из секции "Project API keys"
3. Вставить в `.env`:
```
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...  (реальный ключ)
```
4. Перезапустить `npx expo start -c`

---

## ⚠️ ДОПОЛНИТЕЛЬНЫЕ ШАГИ ПОСЛЕ ЗАПУСКА

### Применить новую миграцию к БД

**Проблема #8** была устранена созданием файла `supabase/migrations/00003_add_onboarding_data.sql`, но миграция ещё не применена к удалённой базе данных.

**Действие:**
```bash
cd FitnesApp
npx supabase db push --linked --yes
```

### Добавить секрет Polza.ai в Supabase

**Проблема #6** — API-ключ убран из кода, но теперь нужно добавить его в Supabase Secrets.

**Действие:**
```bash
npx supabase secrets set POLZA_AI_KEY=ваш_настоящий_polza_ключ
```
Или через Dashboard: Edge Functions → Secrets → New secret.

---

## 🐛 БАГ, НАЙДЕННЫЙ И ИСПРАВЛЕН В ХОДЕ ПРОВЕРКИ

### `Card.tsx` — `</StyledView>` вместо `</View>`

При исправлении проблемы #15 (удаление `styled()` HOC) в `Card.tsx` открывающий тег был изменён с `<StyledView>` на `<View>`, но закрывающий тег `</StyledView>` остался. Это привело бы к ошибке компиляции JSX (`Can't find variable: StyledView`).

**Файл:** `FitnesApp/src/components/atoms/Card.tsx:46`

**Исправлено в ходе этой проверки:** `</StyledView>` → `</View>` ✅

---

## Финальный чеклист перед первым запуском

```
[✅] index.ts → 'expo-router/entry'
[✅] _layout.tsx → JSX валидный, OnboardingProvider в root
[✅] welcome.tsx → TouchableOpacity импортирован
[⚠️] .env → ВСТАВИТЬ РЕАЛЬНЫЙ ANON KEY
[✅] tailwind.config.js → src/ в content, dark-950 добавлен
[✅] Edge Function → ключ из Deno.env
[✅] Card.tsx → </View> закрывающий тег исправлен
[✅] StepSummary → calculateBMI в useEffect
[✅] login.tsx → isLoading
[✅] LinearGradient → expo-linear-gradient
[✅] eas.json → создан
[✅] expo-camera → в plugins app.json
[✅] Уведомления → SchedulableTriggerInputTypes.DAILY
[✅] Storage RLS → конфликт устранён
[✅] FoodAnalysisResult → типизирован
[✅] selectedTheme → системная тема корректна

После запуска:
[⚠️] npx supabase db push --linked --yes  (применить миграцию 00003)
[⚠️] npx supabase secrets set POLZA_AI_KEY=...  (ключ AI-сканера)
```

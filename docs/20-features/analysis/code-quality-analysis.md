---
title: Анализ качества кода
status: accepted
mvp: false
source: .dep/.blueprint/20-features/code-quality-analysis---F
tags: [F]
---

# Анализ качества кода (−F, S06)

## Цель

По целевому JS-файлу выдать **метрики и сигналы качества** (комментарии, пустые строки, unused locals, duplication, suspicious constructs) и **примерные оценки** quality/style — без сети и без AI.

## Границы

### Входит (S06)

- Метрики по целевому файлу (best-effort, детерминированные):
  - доля комментариев (`commentRatio`)
  - число / доля неиспользуемых локальных переменных и параметров (AST)
  - число пустых строк и «лишних» пустых (подряд > 1)
  - приблизительное дублирование кода внутри файла
  - примерные оценки `scores.quality` / `scores.style` (0…100)
- Findings (smells), единый список `findings` + `summary` по severity
- Подозрительные конструкции (эвристики, см. коды)
- JSON-ключ инспектора `code-quality-analysis`; text-секция `quality`
- Работа **offline**; AI explain — отдельная спека ([ai-explain.md](ai-explain.md))

### Не входит

- Подробные текстовые объяснения / рекомендации LLM (→ [ai-explain.md](ai-explain.md))
- Автофикс / правки файла (S07)
- Дублирование diagnostics S03 (`CYCLE`, `UNUSED_IMPORT` / `UNUSED_EXPORT`, `BROKEN_IMPORT`, …) — quality **не** повторяет validation
- Межфайловое дублирование по всему monorepo (только **внутри целевого** файла)
- TypeScript / JSX как обязательный язык (S09)
- ESLint-совместимый rule-engine / плагины сторонних линтеров
- Обязательная зависимость ядра от AI / сети

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--quality` | `-q` | `q` свободна |

Не входит в default-all.  
Спека флагов: [s06-flags.md](../../50-cli/s06-flags.md).  
Short-алгоритм: [interface.md](../../50-cli/interface.md#короткие-флаги).

`--explain` / конфиг `ai.explain` **OR-включают** `quality` (см. [ai-explain.md](ai-explain.md), [s06-flags.md](../../50-cli/s06-flags.md)).

## Инспектор

- **Один** инспектор: id `code-quality-analysis`.
- В `results` ключ `code-quality-analysis` только при `options.quality === true`.
- Prerequisites: целевой файл читается и парсится **внутри** инспектора; import-export / validation **не** обязательны.
- Теги meta: `["F"]`.

## Вход

- Целевой JS-файл (`.js` / `.mjs` / `.cjs`, как MVP)
- `options.pathMode`: `"name"` \| `"relative"` \| `"absolute"` (default: `"relative"`) — для `display` в findings при путях (обычно не нужны)
- `AnalysisContext` (+ опционально уже разобранный AST в модели — можно переиспользовать, не обязательно)

## Выход (`data`)

```json
{
  "pathMode": "relative",
  "metrics": {
    "linesTotal": 120,
    "linesCode": 95,
    "linesComment": 15,
    "linesBlank": 10,
    "linesExcessBlank": 3,
    "commentRatio": 0.136,
    "localsDeclared": 20,
    "localsUnused": 2,
    "unusedLocalRatio": 0.1,
    "duplicateBlocks": 1,
    "duplicateLinesApprox": 8
  },
  "scores": {
    "quality": 72,
    "style": 80,
    "scale": "0-100",
    "method": "heuristic-s06"
  },
  "findings": [
    {
      "code": "UNUSED_LOCAL",
      "severity": "warning",
      "message": "Локальная переменная не используется",
      "name": "tmp",
      "display": "tmp",
      "loc": { "line": 12, "column": 8 }
    },
    {
      "code": "DUPLICATE_BLOCK",
      "severity": "info",
      "message": "Похожий блок кода повторяется",
      "linesApprox": 8,
      "locs": [
        { "line": 20, "column": 0 },
        { "line": 48, "column": 0 }
      ],
      "loc": { "line": 20, "column": 0 }
    },
    {
      "code": "SUSPICIOUS_EVAL",
      "severity": "warning",
      "message": "Вызов eval",
      "loc": { "line": 55, "column": 2 }
    },
    {
      "code": "EXCESS_BLANK",
      "severity": "info",
      "message": "Подряд идущие пустые строки",
      "count": 3,
      "loc": { "line": 30, "column": 0 }
    }
  ],
  "summary": {
    "error": 0,
    "warning": 2,
    "info": 2
  }
}
```

### Поля

| Поле | Тип | Назначение |
|------|-----|------------|
| `metrics.*` | number | Счётчики / доли; доли в `[0, 1]`, округление стабильное (≤ 3 знака после запятой) |
| `scores.quality` / `scores.style` | int 0…100 | Эвристика; **не** внешний бенчмарк |
| `scores.method` | string | Идентификатор формулы (`heuristic-s06`) |
| `findings[]` | array | Smells; пустой массив — норма |
| `summary.*` | int | Число findings по severity |

### Поля finding (общие)

| Поле | Тип | Назначение |
|------|-----|------------|
| `code` | string | Машинный код (таблица ниже) |
| `severity` | `"error"` \| `"warning"` \| `"info"` | Уровень |
| `message` | string | Краткий текст **без** LLM-объяснения |
| `loc` | `{line, column}` \| `null` | Основная локация |
| `locs` | `{line, column}[]`? | Для duplication — все вхождения |
| `name` / `display` / `count` / `linesApprox` | опц. | Контекст |

Findings **не** являются ошибкой инспектора (`status: "ok"` при завершённом анализе).

## Коды findings

| code | severity (default) | Когда |
|------|--------------------|--------|
| `UNUSED_LOCAL` | warning | Binding локальной `let`/`const`/`var` или параметр функции не используется в области (best-effort; без полного dataflow) |
| `DUPLICATE_BLOCK` | info | ≥ N нормализованных подряд строк (N ≥ 5) повторяется ≥ 2 раз в файле |
| `SUSPICIOUS_EVAL` | warning | Вызов `eval(...)` |
| `SUSPICIOUS_WITH` | warning | Оператор `with` |
| `SUSPICIOUS_EQ` | info | Использование `==` / `!=` (не `===` / `!==`), кроме сравнения с `null` |
| `SUSPICIOUS_EMPTY_CATCH` | warning | `catch` без тела / только пустых statements |
| `EXCESS_BLANK` | info | ≥ 2 пустых строк подряд (одно finding на серию; `count` = длина серии) |
| `LOW_COMMENT_RATIO` | info | `commentRatio` < 0.02 **и** `linesCode` ≥ 40 (один finding на файл, `loc: null`) |

Синтаксические ошибки целевого → **не** finding, а ошибка инспектора `PARSE_FAILED` (как validation).

## Метрики — правила подсчёта

1. **Строки:** после чтения файла; `\r\n` / `\n` нормализуются. Пустая = trim → `""`. Comment-line — строка, где после trim остаётся только `//…` или содержимое block-comment (best-effort по AST comments + line scan).
2. **`commentRatio`** = `linesComment / max(linesTotal, 1)`.
3. **`linesExcessBlank`** = сумма `(runLength - 1)` по сериям пустых строк с `runLength ≥ 2`.
4. **Locals:** объявления в функциях/блоках целевого AST; unused = идентификатор не встречается как reference вне своего declarator (shadowing — по области; `export` bindings не считаются local unused).
5. **Параметры** с именем, начинающимся с `_`, **не** флагить как `UNUSED_LOCAL`.
6. **Duplication:** нормализация — trim, схлопывание пробелов, игнор чисто пустых; хэш окон длины ≥ 5; минимум одно finding на уникальный дубликат (не взрыв комбинаций).
7. **Scores (эвристика `heuristic-s06`):**
   - старт `quality = 100`, `style = 100`;
   - −5 за каждый `warning`, −2 за каждый `info` (clamp 0…100) → вклад в `quality`;
   - `style`: −3 за `EXCESS_BLANK`/`LOW_COMMENT_RATIO`, −4 за `SUSPICIOUS_EQ`, −10 за `SUSPICIOUS_EVAL`/`WITH`/`EMPTY_CATCH` (clamp);
   - формула фиксируется тестами на фикстурах; точные веса можно подправить в реализации **без** смены `method`, если AC-фикстуры обновлены в том же PR.

## Правила

1. Один проход собирает metrics + findings; порядок findings: error → warning → info; внутри — по `loc.line` (null в конце), стабильно.
2. Quality **не** эмитит коды S03 validation.
3. Side-effect и «используется только в typeof/void» — best-effort; сложный dataflow/eval **не** обязан ловить все cases (как unused import в S03).
4. Пустой/крошечный файл: metrics нули/доли 0; scores могут быть 100; findings пусто — `status: "ok"`.
5. Ошибка парсинга целевого → `PARSE_FAILED`, без частичного success.
6. Инспектор не ходит в сеть и не вызывает AI provider.

## Ошибки инспектора

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет целевого файла |
| `UNSUPPORTED_LANGUAGE` | validation | Не JS MVP |
| `PARSE_FAILED` | execution | Не разобран целевой |
| `READ_FAILED` | execution | Не прочитан целевой |

## Зависимости

- [inspector-contract.md](../../20-architecture/inspector-contract.md)
- [validation.md](validation.md) — граница с diagnostics D
- [ai-explain.md](ai-explain.md) — опциональные объяснения поверх findings
- [s06-flags.md](../../50-cli/s06-flags.md)
- [analysis-levels.md](../../40-development/analysis-levels.md)

## Acceptance criteria

- [ ] `--quality` / `-q` даёт ключ `code-quality-analysis` с `metrics`, `scores`, `findings`, `summary`
- [ ] Фикстура с неиспользуемым `const x` → `UNUSED_LOCAL`
- [ ] Фикстура с `eval(...)` → `SUSPICIOUS_EVAL`
- [ ] Фикстура с тройным пустым разрывом → `EXCESS_BLANK` + рост `linesExcessBlank`
- [ ] Фикстура с повторяющимся блоком ≥ 5 строк → `DUPLICATE_BLOCK`
- [ ] Параметр `_unused` не даёт `UNUSED_LOCAL`
- [ ] Нет сети / AI при `-q`
- [ ] Без флага quality секции нет; не в default-all
- [ ] Text schematic: секция `quality` только при флаге (или explain→OR quality)
- [ ] Коды S03 не появляются в `findings`

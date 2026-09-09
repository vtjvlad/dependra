---
title: AI explain
status: accepted
mvp: false
source: .dep/.blueprint/10-technology/60-artificial-intelligence
tags: [I]
---

# AI explain (−I, S06)

## Цель

Опционально обогатить результаты анализа **объяснениями и рекомендациями** через AI provider adapter. Ядро Dependra остаётся полностью работоспособным **без** AI, сети и API-ключей.

## Границы

### Входит (S06)

- Provider adapter (контракт + минимум один встроенный адаптер, напр. `openai`-compatible HTTP)
- Флаг / конфиг включения explain
- Вход адаптера: findings quality (+ опционально diagnostics validation, если есть в `results`)
- Выход: структурированные `explanations[]` в отдельном ключе `results`
- Таймаут, отключение, деградация без падения pipeline
- Ключ API **только** из env (`ai.apiKeyEnv`), не из argv и не из `.conf` plaintext

### Не входит

- AI-модификации / запись в файлы (S07)
- Обязательная зависимость npm-ядра от конкретного SDK провайдера (допустим тонкий HTTP; тяжёлый SDK — за адаптером, optional)
- Автоматическое включение AI в `--level` / default-all
- «Агент» с произвольным tool-calling по FS проекта
- Offline LLM / локальные модели как обязательный провайдер S06 (контракт допускает id; реализация — best-effort / later)

## Принцип

> Все основные возможности работают автономно. AI — **дополнительное** расширение ([blueprint](../../../.dep/.blueprint/10-technology/60-artificial-intelligence/README.md)).

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--explain` | `-ex` | `-e` = `--exports` → `-ex` |

Не в default-all.  
Спека: [s06-flags.md](../../50-cli/s06-flags.md).

Эквивалент из конфига: `ai.explain = true` **и** `ai.enabled = true` (см. ниже).

### Включение quality

`--explain` / итоговый `options.explain` **OR-включает** `options.quality` (quality появляется в `results`, если explain запрошен).

## Когда explain реально вызывается

Все условия:

1. `options.explain === true` (CLI `-ex` / `--explain` или merge из `ai.explain`)
2. `ai.enabled === true` (конфиг; CLI **не** обязан дублировать — без `enabled` explain **пропускается**)
3. Есть ключ в env, имя из `ai.apiKeyEnv` (непустая строка)
4. Есть что объяснять: `findings` quality и/или `diagnostics` validation в `results`

Иначе: ключ `ai-explain` в `results` **либо отсутствует**, **либо** `status: "ok"` с `data.skipped` / пустым `explanations` (см. выход) — pipeline **не** падает, exit code от explain не становится 1.

Рекомендуемое поведение S06: **всегда** класть `ai-explain` в `results` при `options.explain`, даже если skipped — чтобы reporter показал причину.

## Инспектор / модуль

- Логический id результата: `ai-explain` (не путать с quality).
- Реализация: модуль `ai/` (provider registry + `explain`-pass в pipeline **после** quality / validation), **не** обязан быть «инспектором» в смысле AST-анализа; контракт результата — как у инспектора (`InspectorResult`).
- Quality inspector **не** импортирует AI.

## Конфиг `[ai]` (активация слота S05)

Уже зарезервировано в [s05-config.md](../../35-configuration/s05-config.md). В S06 поля **используются**:

| Ключ | Смысл в S06 |
|------|-------------|
| `ai.enabled` | мастер-выключатель вызовов |
| `ai.provider` | id адаптера (`openai`, …) |
| `ai.baseUrl` | override endpoint; `null` = default провайдера |
| `ai.apiKeyEnv` | имя переменной окружения с секретом |
| `ai.model` | модель; `null` = default адаптера |
| `ai.timeoutMs` | таймаут одного запроса |
| `ai.explain` | OR в `options.explain` (как op-флаг) |

Секреты в `.conf` / CLI **запрещены**.

## Контракт provider adapter

```js
/**
 * @typedef {object} AiExplainRequest
 * @property {string} targetPath
 * @property {string} [sourceSnippet] усечённый текст файла (лимит адаптера)
 * @property {object[]} findings из code-quality-analysis (может быть [])
 * @property {object[]} [diagnostics] из validation, если есть
 * @property {object} options ai.* + locale?
 */

/**
 * @typedef {object} AiExplanation
 * @property {string} [refCode] code finding/diagnostic
 * @property {{line:number, column:number}|null} [loc]
 * @property {string} summary коротко
 * @property {string} detail пояснение / рекомендация
 * @property {"quality"|"validation"|"general"} scope
 */

/**
 * @typedef {object} AiProvider
 * @property {string} id
 * @property {(req: AiExplainRequest) => Promise<{ explanations: AiExplanation[], raw?: unknown }>} explain
 */
```

Правила адаптера:

1. Не пишет на диск проекта.
2. Уважает `timeoutMs`; при таймауте — throw/reject → pipeline ловит и деградирует.
3. Не получает весь репозиторий — только целевой snippet + структурированные findings.
4. Ответ парсится в `explanations[]`; мусор / невалидный JSON → skip с reason, не fatal.

## Вход pipeline-pass

- `results["code-quality-analysis"].data` (обязателен при explain; создаётся OR quality)
- опционально `results.validation.data.diagnostics`
- `mergedConfig.ai`

## Выход (`data`)

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "skipped": false,
  "skipReason": null,
  "explanations": [
    {
      "refCode": "SUSPICIOUS_EVAL",
      "loc": { "line": 55, "column": 2 },
      "scope": "quality",
      "summary": "Избегайте eval",
      "detail": "eval выполняет строку как код и усложняет анализ…"
    }
  ]
}
```

### Skip

```json
{
  "provider": "openai",
  "model": null,
  "skipped": true,
  "skipReason": "ai-disabled",
  "explanations": []
}
```

| `skipReason` | Когда |
|--------------|--------|
| `ai-disabled` | `ai.enabled !== true` |
| `missing-api-key` | env пуст / не задан |
| `provider-unavailable` | неизвестный `ai.provider` |
| `timeout` | превышен `timeoutMs` |
| `provider-error` | HTTP/API ошибка |
| `nothing-to-explain` | нет findings и diagnostics |
| `parse-response` | ответ провайдера не разобран |

При skip: `status: "ok"` у `ai-explain` (деградация), **не** `status: "error"`, чтобы не валить весь CLI из‑за опционального AI.  
Исключение (опционально later): strict-режим AI — **не** в S06.

## Правила

1. Ядро / quality / validation **не** требуют AI.
2. Explain не меняет `findings` / `diagnostics` на месте — только добавляет `ai-explain`.
3. Повторные запуски с тем же входом могут отличаться текстом LLM — AC проверяют структуру и skip-пути, не дословный `detail`.
4. В JSON-отчёте не сериализовать API key.
5. Text-секция `ai-explain` (или `explain`) только при `options.explain`.

## Ошибки

Сбои провайдера → `skipReason`, не fatal inspector error.  
Ошибки конфигурации CLI (неизвестный флаг и т.д.) — как обычно в parse-args.

## Зависимости

- [code-quality-analysis.md](code-quality-analysis.md)
- [validation.md](validation.md) (опциональный вход)
- [s05-config.md](../../35-configuration/s05-config.md) (`[ai]`)
- [s06-flags.md](../../50-cli/s06-flags.md)
- [inspector-contract.md](../../20-architecture/inspector-contract.md) (форма результата)

## Acceptance criteria

- [ ] `-q` без AI / сети — полный quality-отчёт
- [ ] `-ex` при `ai.enabled=false` → `ai-explain` skipped (`ai-disabled`), exit 0 если остальное ok
- [ ] `-ex` без ключа → `missing-api-key`, pipeline жив
- [ ] `-ex` OR-включает quality в `results`
- [ ] При mock-провайдере: непустые `explanations` с `refCode` / `summary` / `detail`
- [ ] Таймаут → `timeout`, не падение процесса
- [ ] Default-all и `--level` **не** включают explain
- [ ] В `.conf` нет поля для сырого API key

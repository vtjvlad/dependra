---
title: AI modifications
status: accepted
mvp: false
source: .dep/.blueprint/20-features/modifications/ai-integration.md
tags: [I]
---

# AI modifications (S07)

## Цель

Опционально предложить / применить правки текста файла через AI provider. **Не** обязательны для ядра; все code/import/env/comments ops работают без AI.

## Границы

### Входит

| Op id | CLI | Суть |
|-------|-----|------|
| `ai-modify` | `--ai-modify` / `-am` | Запросить у провайдера патч/новый текст по findings (quality/validation) или короткому `--aim-instruction` |

- Тот же `[ai]` конфиг и секреты, что [ai-explain.md](../analysis/ai-explain.md)
- Mock provider для тестов
- Результат → обычные `Change` (`risk: "dangerous"`), дальше только через safety apply

### Не входит

- Автономный агент с произвольным tool-calling по FS
- Обязательный cloud SDK в dependencies ядра
- Включение из `--level` / default-all
- Скрытый apply без `--apply`

## CLI

| Long | Short | Почему short |
|------|-------|--------------|
| `--ai-modify` | `-am` | `-a` = additional → `-am` |

Опционально:

| Long | Arg | Смысл |
|------|-----|--------|
| `--aim-instruction` | string | краткий brief (не секрет) |

## Когда вызывается

Все условия:

1. `options.aiModify === true`
2. `ai.enabled === true`
3. API key в env (`ai.apiKeyEnv`)
4. Провайдер доступен

Иначе: Change не строится; в `modification.summary` / отдельном skip note — reason (как explain). Pipeline не падает, если нет `--apply` и пользователь только смотрит plan (пустой вклад ai).

## Контракт провайдера (дополнение к explain)

```js
/**
 * @typedef {object} AiModifyRequest
 * @property {string} targetPath
 * @property {string} source
 * @property {string} [instruction]
 * @property {object[]} [findings]
 * @property {object[]} [diagnostics]
 * @property {object} options
 *
 * @typedef {object} AiModifyResult
 * @property {string} [after] полный новый текст
 * @property {string} [unifiedDiff] альтернатива
 * @property {string} [summary]
 */
```

Правила:

1. Провайдер **не** пишет на диск.
2. Ответ валидировать: если `after` не парсится как JS — skip / fail change с `PARSE_FAILED`, не применять.
3. Таймаут → skipReason, не fatal для всего CLI если другие ops ok (при apply без успешных ai changes — не ошибка само по себе).

## Правила

1. Ядро без сети / без ключа полностью работоспособно.
2. `-am` не заменяет `-f`/`-fi`; это отдельный слой.
3. Секреты не в argv report.
4. Explain (`-ex`) **не** включает ai-modify и наоборот.

## Зависимости

- [ai-explain.md](../analysis/ai-explain.md) (стек провайдеров)
- [safety.md](safety.md)
- [s07-flags.md](../../50-cli/s07-flags.md)
- [s05-config.md](../../35-configuration/s05-config.md)

## Acceptance criteria

- [ ] `-am` при `ai.enabled=false` → skip, exit 0 (если нет других fail)
- [ ] Mock provider + `--apply` пишет `after` на фикстуре через backup
- [ ] Невалидный `after` от AI не записывается
- [ ] Default-all / level не включают `-am`

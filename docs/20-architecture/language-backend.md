---
title: Language Backend (адаптер языка)
status: accepted
mvp: false
source: .dep/.blueprint/99-terminology/language-backend.md, handbook/roadmap/stages/09-multilang.md
---

# Language Backend (адаптер языка)

## Цель

Подключать языки анализа через **адаптеры**, не меняя публичный контракт инспектора и не вшивая API конкретного парсера в `core` / inspectors / CLI / TUI.

S09: минимум **JavaScript** (существующий путь) + **TypeScript** ([ADR-0002](../../handbook/adr/ADR-0002-first-language-typescript.md)).

## Границы

### Входит

- Контракт `LanguageBackend`
- Реестр backends: extension / language id → backend
- Загрузка `SourceFile` + parse через выбранный backend
- Опциональные **providers**: Tree-sitter, LSP (за тем же backend или рядом; не обязательны для работы)
- Регистрация без правки публичного `Inspector` / `analyze` API

### Не входит

- Обязательный LSP для всех языков
- Monorepo packaging (`inspectors/typescript/` как отдельный пакет) — S10
- Build System — S11
- Новые языки beyond TS в S09

## Термины

| Термин | Смысл |
|--------|--------|
| **LanguageBackend** | Адаптер языка: extensions, load/parse, опциональные providers |
| **Provider** | Доп. источник данных (Tree-sitter tree, LSP symbols/diagnostics); optional |
| **Inspector** | Без изменений контракта ([inspector-contract.md](inspector-contract.md)) |
| **Adapter** | Общий термин: единый внутренний интерфейс к внешнему инструменту |

## Контракт

```js
/**
 * @typedef {"javascript"|"typescript"|string} LanguageId
 */

/**
 * @typedef {object} LanguageBackendMeta
 * @property {LanguageId} id
 * @property {string} version
 * @property {string[]} extensions  // например [".ts", ".tsx"] — lower-case с точкой
 * @property {string[]} [aliases]   // запасные id
 */

/**
 * @typedef {object} LoadParseOptions
 * @property {string} cwd
 * @property {boolean} [wantAst=true]
 * @property {boolean} [wantSourceText=true]
 */

/**
 * @typedef {object} LanguageBackend
 * @property {LanguageBackendMeta} meta
 * @property {(absPath: string) => boolean} supportsPath
 * @property {(absPath: string, opts: LoadParseOptions) => Promise<import("./project-model.md").SourceFile>} loadSourceFile
 * @property {object} [providers]
 * @property {TreeSitterProvider} [providers.treeSitter]
 * @property {LspProvider} [providers.lsp]
 */

/**
 * @typedef {object} TreeSitterProvider
 * @property {() => boolean} isAvailable
 * @property {(sourceText: string, languageId: LanguageId) => Promise<object|null>} parse
 */

/**
 * @typedef {object} LspProvider
 * @property {() => boolean} isAvailable
 * @property {(absPath: string, sourceText: string) => Promise<object|null>} query
 */
```

### Инварианты

1. Инспекторы и `core` вызывают **реестр** (`getBackendForPath` / `loadSourceFile`), не Acorn/TS-estree напрямую.
2. JS-backend остаётся тонкой обёрткой текущего `parseJavaScript` + `loadSourceFile` (поведение S01+ не деградирует).
3. `SourceFile.language` — id backend (`"javascript"` | `"typescript"`).
4. `SourceFile.ast` — представление выбранного backend; для JS/TS S09 — ESTree-совместимое. Инспекторы, обходящие AST, обязаны учитывать language id (или работать только на заявленном подмножестве узлов).
5. Неподдерживаемый путь → `ParserError("UNSUPPORTED_LANGUAGE", …)` category `validation`.
6. Providers **не** блокируют analyze: `isAvailable() === false` → пропуск / `null`, без падения pipeline.
7. Публичный API (`src/api`) не экспортирует internals парсеров; при необходимости позже — `listLanguages()` (не обязательно в S09-B).

## Реестр и размещение кода

Целевая раскладка **внутри** текущего пакета (без monorepo S10):

```
src/parsers/
  index.js                 # реэкспорт реестра + ошибки
  registry.js              # registerBackend / getBackendForPath / loadSourceFile
  javascript/              # или плоские *-adapter.js — на усмотрение реализации
    acorn-adapter.js       # существующий
  typescript/
    typescript-estree-adapter.js
  providers/               # optional S09-C
    tree-sitter.js
    lsp.js
```

`registerBuiltInBackends()` вызывается вместе с `registerBuiltins()` (API/CLI), идемпотентно.

Дублирование `JS_EXTENSIONS` / `listJavaScriptFiles` / `TRY_EXTS` **сводится** к запросам реестра (`listExtensions()`, `supportsPath`). Имена хелперов могут остаться как обёртки для совместимости.

## Модель проекта (S09)

Расширения относительно [project-model.md](project-model.md):

```js
/**
 * @typedef {object} SourceFile  // S09
 * @property {string} path
 * @property {string} [relativePath]
 * @property {LanguageId} language
 * @property {"esm"|"cjs"|"unknown"} moduleKind
 * @property {string} [sourceText]
 * @property {object} [ast]
 * @property {BasicFileInfo} [basic]
 */

/**
 * BasicFileInfo.language: LanguageId | "unknown"
 * BasicFileInfo.engine: "node" | null  // TS в Node-проекте → "node"
 */
```

`ImportRecord` / `ExportRecord` без смены имён полей. Дополнения для TS — в [s09-typescript.md](../10-technology/s09-typescript.md) (`importKind: "type"|"value"|…` опционально).

## Инспекторы

| Правило | Деталь |
|---------|--------|
| Контракт | Без изменений `meta` + `analyze` |
| Регистрация | Те же id (`import-export-analysis`, …); реализация расширяется поддержкой `language === "typescript"` **или** делегирует shared AST-walker |
| Неподдерживаемый язык | Как сейчас: `UNSUPPORTED_LANGUAGE` / корректный skip по контракту фичи |
| Core pipeline | Не хардкодит список расширений; может по-прежнему хардкодить **inspector ids** |

Минимум S09-B для TS: `basic-file-information`, `import-export-analysis`, `dependency-analysis` (graph resolve с `.ts`/`.tsx` в TRY_EXTS). Остальные инспекторы — best-effort или явный skip с понятным сообщением (зафиксировать в тестах).

## Providers (S09-C)

| Provider | Обязателен | Назначение |
|----------|------------|------------|
| Tree-sitter | нет | Альтернативное CST; эксперименты / будущие языки |
| LSP | нет | Symbols / diagnostics / hover-данные для обогащения модели |

Оба живут за `LanguageBackend.providers` или за null-object. Нет бинарника / сервера → `isAvailable() === false`.

## Ошибки

Те же коды `ParserError`: `FILE_NOT_FOUND` | `UNSUPPORTED_LANGUAGE` | `PARSE_FAILED` | `READ_FAILED`.

## Зависимости

- [inspector-contract.md](inspector-contract.md) — стабилен
- [project-model.md](project-model.md) — расширяется language union
- [external-tools.md](../10-technology/external-tools.md) — парсеры / providers
- [ADR-0002](../../handbook/adr/ADR-0002-first-language-typescript.md), [ADR-0003](../../handbook/adr/ADR-0003-typescript-parser.md)
- [s09-typescript.md](../10-technology/s09-typescript.md) — продуктовый scope TS

## Acceptance criteria

- [x] Контракт `LanguageBackend` + реестр описаны и согласованы с S09 exit criteria
- [x] JS-путь остаётся backend’ом; поведение S01–S08 не требует смены public API
- [x] TS подключается вторым backend без правок контракта инспектора
- [x] Providers optional и не ломают analyze при отсутствии
- [x] Инспекторы / core не импортируют API Acorn / typescript-estree напрямую

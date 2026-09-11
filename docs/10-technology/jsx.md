---
title: JSX (.jsx) как анализируемое расширение JavaScript
status: accepted
mvp: false
source: handbook/adr/ADR-0004-jsx-javascript-backend.md, docs/10-technology/additional-languages.md
---

# JSX (.jsx) как анализируемое расширение JavaScript

## Цель

Подключить анализ файлов `.jsx` на уровне **L1–L2** через существующий JavaScript language-backend (не отдельный LanguageId).

## Границы

### Входит

- Расширение: `.jsx`
- Parse через Acorn + `acorn-jsx` ([ADR-0004](../../handbook/adr/ADR-0004-jsx-javascript-backend.md))
- `SourceFile.language`: `"javascript"`
- `basic-file-information`: `format: "jsx"`, `language: "javascript"`, `engine: "node"`
- Imports / exports (ESM / CJS / dynamic) — те же правила, что для `.js`
- Resolve / project scan: `.jsx` и `index.jsx` через registry `listExtensions()`
- Capability: **L2**

### Не входит

- Отдельный LanguageId `"jsx"`
- React/Preact runtime-семантика, CSS-in-JS
- Обязательный Babel transform / emotion / etc.
- TypeScript в `.jsx` (это `.tsx` → TS-backend)
- L3+ (validation/entities) сверх best-effort существующих инспекторов
- Python / Lua (следующие LANG-задачи)

## Инспекторы

| Инспектор | Ожидание |
|-----------|----------|
| `basic-file-information` | `.jsx` → format `jsx`, language `javascript`, engine `node` |
| `import-export-analysis` | AST-анализ; не `UNSUPPORTED_LANGUAGE` |
| `dependency-analysis` | Graph включает `.jsx` в scan/resolve |
| Прочие | Best-effort / без регрессии JS/TS |

## Парсер

- Только `src/parsers/acorn-adapter.js` импортирует `acorn` / `acorn-jsx`.
- `.jsx` → `jsx: true`; `.js/.mjs/.cjs` → без JSX-плагина.

## Фикстуры и тесты

Каталог: `tests/fixtures/jsx/` (минимум):

- `widget.jsx` — JSX + import/export
- `dep.js` — зависимость для resolve
- опционально `graph/` — `.jsx` ↔ `.js`

Тесты: `tests/jsx-*.test.js` — parse, imports, registry `.jsx`, JS/TS regression smoke не обязателен отдельно (покрыт `npm test`).

## Конфиг

Новых ключей нет. `.jsx` — built-in extension JS-backend.

## Acceptance criteria

- [x] `.jsx` не даёт `UNSUPPORTED_LANGUAGE` на basic/imports/exports/graph
- [x] `language === "javascript"`, format basic = `jsx`
- [x] Обычные `.js` без регрессии (парсер без JSX по умолчанию)
- [x] `.tsx` по-прежнему на TypeScript backend
- [x] Фикстуры + тесты зелёные в `npm test`

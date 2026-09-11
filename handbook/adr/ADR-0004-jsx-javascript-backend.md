---
id: ADR-0004
title: JSX (.jsx) — расширение JavaScript backend
status: Принято
date: 2026-09-11
replaces:
replaced_by:
---

# ADR-0004: JSX (.jsx) — расширение JavaScript backend

## Контекст

Рамка [additional-languages.md](../../docs/10-technology/additional-languages.md) ставит **JSX** первым шагом после S09. S09 уже покрывает `.tsx` через TypeScript backend; отдельный «язык JSX-only» для `.jsx` был deferred. Нужно решить: новый LanguageId или расширение `javascript`, и чем парсить.

## Варианты

1. **Расширить JS-backend** — добавить `.jsx` к extensions; `SourceFile.language` остаётся `"javascript"`; парсинг через Acorn + `acorn-jsx`. Плюс: один ecosystem, переиспользование import/export walkers. Минус: JSX-узлы в AST (walkers уже их игнорируют при обходе children).
2. **Отдельный LanguageId `jsx`** — отдельный backend. Плюс: явная классификация. Минус: дублирование JS-пути без выигрыша в ModuleIR.
3. **Парсить `.jsx` через typescript-estree** — единый TSX/JSX парсер. Минус: тянет TS-стек для чистого JSX; смешивает backends.

## Решение

Выбран **вариант 1**: `.jsx` обслуживает **существующий** `javascript` backend.

Правила:

- `LanguageId` = `"javascript"` (не новый id).
- `basic-file-information`: `format: "jsx"`, `language: "javascript"`, `engine: "node"`.
- Парсер: **Acorn + `acorn-jsx`** только внутри `parsers/acorn-adapter.js` (ADR-0001 сохраняется: единственная точка импорта Acorn-экосистемы для JS).
- Для `.js/.mjs/.cjs` — JSX **выключен** (как сейчас), чтобы не менять семантику обычного JS.
- Capability: **L1–L2** (parse + imports/exports + graph resolve/scan).
- Non-goals: React-специфика, runtime JSX transform, `.jsx` через tsc.

## Последствия

- Положительные: минимальный риск; закрывает deferred JSX; graph видит `.jsx` через `listExtensions()`.
- Отрицательные / риски: зависимость `acorn-jsx`; экзотический JSX может отставать от Babel.
- Влияние: `package.json`; `javascript-backend.js` extensions; `basic-file-information`; узкая спека [`jsx.md`](../../docs/10-technology/jsx.md); задачи LANG-002/003.

## Ссылки

- [additional-languages.md](../../docs/10-technology/additional-languages.md)
- [ADR-0001](ADR-0001-js-ast-parser.md), [s09-typescript.md](../../docs/10-technology/s09-typescript.md) (`.tsx` остаётся на TS-backend)
- Checklist: LANG-002, LANG-003

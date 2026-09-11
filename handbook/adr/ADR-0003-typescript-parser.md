---
id: ADR-0003
title: Парсер TypeScript для S09
status: Принято
date: 2026-09-11
replaces:
replaced_by:
---

# ADR-0003: Парсер TypeScript для S09

## Контекст

После [ADR-0002](ADR-0002-first-language-typescript.md) нужен AST-парсер для `.ts` / `.tsx`. JS остаётся на Acorn ([ADR-0001](ADR-0001-js-ast-parser.md)). Парсер доступен **только** из language-backend / `parsers`; инспекторы не импортируют его API напрямую.

## Варианты

1. **`@typescript-eslint/typescript-estree`** — ESTree (+ TS-узлы), хорошо стыкуется с существующими обходами ESTree. Минус: зависимость от экосистемы typescript-eslint; тянет `typescript` как peer/dep.
2. **`@babel/parser`** (plugins `typescript`, `jsx`) — один пакет, знакомый ESTREE-like AST. Минус: Babel-специфичные отличия от TS-ESTree; footprint больше «тонкого» Acorn.
3. **`typescript` (compiler API)** — эталонная семантика. Минус: тяжёлый; провоцирует typecheck-scope; хуже изоляция «только parse».
4. **Tree-sitter-typescript** — хорош как optional provider (S09-C), не как единственный MVP-путь S09-B: другой shape AST, сложнее переиспользовать текущие walkers.

## Решение

Выбран **`@typescript-eslint/typescript-estree`** как единственный обязательный TS-парсер S09.

Правила:

- Опции: JSX включён для `.tsx`; для `.ts` — без JSX (или safe default парсера).
- `loc` / locations обязательны (как у Acorn path).
- Ошибки парсинга → `ParserError("PARSE_FAILED", …)` через adapter.
- Пакет `typescript` допускается **только** как dependency парсера за адаптером, не как стек сборки Dependra.
- Tree-sitter / LSP — optional providers ([language-backend.md](../../docs/20-architecture/language-backend.md)), не замена этого парсера в S09-B.

## Последствия

- Положительные: максимальное переиспользование ESTree-обходов; чёткая замена за adapter.
- Отрицательные / риски: версии `typescript` / typescript-estree нужно пинить; экзотический синтаксис новых версий TS может отставать.
- Влияние: `package.json` dependencies; `src/parsers/typescript-estree-adapter.js` (имя уточняется в реализации); тесты s09.

## Ссылки

- [ADR-0001](ADR-0001-js-ast-parser.md), [ADR-0002](ADR-0002-first-language-typescript.md)
- [`docs/10-technology/external-tools.md`](../../docs/10-technology/external-tools.md)
- [`docs/20-architecture/language-backend.md`](../../docs/20-architecture/language-backend.md)
- Задачи: S09-002, S09-003, S09-005

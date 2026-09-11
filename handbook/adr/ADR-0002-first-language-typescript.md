---
id: ADR-0002
title: Первый язык beyond JS — TypeScript
status: Принято
date: 2026-09-11
replaces:
replaced_by:
---

# ADR-0002: Первый язык beyond JS — TypeScript

## Контекст

Этап [S09](../roadmap/stages/09-multilang.md) требует минимум один язык beyond JavaScript через language-backend adapter. Выбор языка фиксирует scope инспекторов, фикстур и парсера (отдельный ADR). Решение нужно до реализации adapter (S09-003).

Текущий код жёстко ограничен `.js` / `.mjs` / `.cjs` (`UNSUPPORTED_LANGUAGE` иначе). Feature-спеки S02–S07 уже откладывают TypeScript/JSX на S09.

## Варианты

1. **TypeScript** (`.ts` / `.tsx`) — уже назван как граница deferred во всех AST-фичах; blueprint monorepo ставит `inspectors/typescript/` сразу после `javascript/`; TUI/metadata уже знают `.ts`. Минус: type-level семантика шире JS; нужен отдельный парсер (не Acorn).
2. **Python** — полезен как «другой» язык и есть в runtime/shebang-пробах. Минус: другая модель модулей; не закрывает deferred-границы TS/JSX в текущих спеках; слабее стыкуется с Node-проектами пользователей Dependra.
3. **JSON / Markdown как «язык»** — дешёво, но это не language-backend для анализа импортов/сущностей; не выполняет exit criteria S09 («инспекторы beyond JS»).

## Решение

Выбран **TypeScript** как первый язык beyond JS.

Scope S09 для языка:

| Входит | Не входит (S09) |
|--------|------------------|
| `.ts` / `.tsx` через adapter | Обязательный `tsc` typecheck / полная semantic model |
| ESM + CJS-подобные импорты в TS-синтаксисе | Path mapping / `paths` из `tsconfig` как обязательная фича (best-effort позже) |
| JSX-синтаксис в `.tsx` (parse + базовые imports/exports) | Отдельный язык «JSX-only» без TS; React-специфика |
| Расширение `SourceFile.language`: `"typescript"` | Python / HTML / CSS / Lua (позже) |
| Переиспользование JS-инспекторов там, где AST совместим с ESTree-подмножеством | Ломка публичного `Inspector` контракта |

Зависимость Dependra **не** переводится на TypeScript как язык реализации ([stack.md](../../docs/10-technology/stack.md) без изменений). TS — только **анализируемый** язык.

Парсер TS — отдельный ADR ([ADR-0003](ADR-0003-typescript-parser.md)).

## Последствия

- Положительные: закрывает явный deferred-долг; один ecosystem (Node/npm); проще переиспользовать import/export/graph поверх ESTree-совместимого AST.
- Отрицательные / риски: `.tsx` и type-only imports (`import type`) требуют явных правил в спеке; без `tsconfig` resolve может быть неполным.
- Влияние: `docs/20-architecture/language-backend.md`; расширение `project-model`; фикстуры `tests/fixtures/s09/`; задачи S09-003…007.

## Ссылки

- [`docs/20-architecture/language-backend.md`](../../docs/20-architecture/language-backend.md)
- [`docs/10-technology/s09-typescript.md`](../../docs/10-technology/s09-typescript.md)
- [S09 stage](../roadmap/stages/09-multilang.md) — задачи S09-001…007
- Feature deferred: import-export, validation, quality, file-ops, modifications

---
title: S09 — TypeScript как анализируемый язык
status: review
mvp: false
source: handbook/adr/ADR-0002-first-language-typescript.md, handbook/roadmap/stages/09-multilang.md
---

# S09 — TypeScript как анализируемый язык

## Цель

Зафиксировать продуктовый scope TypeScript в этапе S09: что анализируем, какие расширения, как стыкуется с существующими инспекторами.

Язык реализации Dependra по-прежнему **JavaScript** ([stack.md](stack.md)).

## Границы

### Входит

- Расширения: `.ts`, `.tsx`
- Парсинг через language-backend ([language-backend.md](../20-architecture/language-backend.md), [ADR-0003](../../handbook/adr/ADR-0003-typescript-parser.md))
- Классификация `language: "typescript"`, `engine: "node"` (в Node-проекте с `package.json`)
- Импорты / экспорты (value): ESM `import`/`export`, dynamic `import()`, `require()` со строковым литералом
- `import type` / `export type` — в модели с опциональным отличием (ниже)
- JSX в `.tsx`: parse не падает; import/export извлекаются
- Resolve спецификаторов: к текущим `.js/.mjs/.cjs` добавить `.ts/.tsx` и `index.ts` / `index.tsx` (best-effort без полного `tsconfig`)

### Не входит (S09)

- Обязательный typecheck / `tsc --noEmit`
- Полный type-level graph / symbol rename
- Обязательный разбор `tsconfig.json` paths / project references
- Decorators experimental semantics beyond «parse ok»
- Отдельный язык «JavaScript + JSX» (`.jsx`) — можно добавить позже тем же backend или расширением; **не** exit criterion S09
- Python и прочие языки

## Инспекторы (минимум)

| Инспектор | Ожидание S09 |
|-----------|----------------|
| `basic-file-information` | `.ts`/`.tsx` → `language: "typescript"` |
| `import-export-analysis` | AST-анализ; не `UNSUPPORTED_LANGUAGE` |
| `dependency-analysis` | Обход графа по TS+JS файлам проекта |
| `exported-entities` | Best-effort по value exports; type-only — опционально |
| `validation` | Best-effort unresolved imports с учётом `.ts` |
| Прочие (quality, io, viz, …) | Best-effort или явный безопасный skip — без регрессии JS |

## Модель: type-only imports

Допустимое расширение `ImportRecord` (обратно совместимо):

```js
/**
 * @typedef {object} ImportRecord
 * @property {string|null} source
 * @property {"static"|"dynamic"|"require"} kind
 * @property {string|null} resolvedPath
 * @property {boolean} isExternal
 * @property {"value"|"type"|"typeof"} [importKind]  // default "value" если отсутствует
 * @property {{ line: number, column: number }} [loc]
 */
```

Репортёры не обязаны печатать `importKind`, если не запрошено.

## Фикстуры и тесты

Каталог: `tests/fixtures/s09/` (минимум):

- `value-imports.ts` — обычные ESM imports/exports
- `type-only.ts` — `import type` / `export type`
- `mixed.tsx` — JSX + import
- `graph/` — 2–3 файла со связями TS↔TS и TS↔JS

Тесты: `tests/s09-*.test.js` — parse, import-export, registry routing, JS regression smoke.

## Конфиг

Новых обязательных ключей `dependra.conf` в S09 нет. Опционально позже: `languages.enabled`, provider toggles — вне минимума.

## Внешние инструменты

| Область | Решение |
|---------|---------|
| Parse TS/TSX | `@typescript-eslint/typescript-estree` ([ADR-0003](../../handbook/adr/ADR-0003-typescript-parser.md)) |
| Parse JS | Acorn ([ADR-0001](../../handbook/adr/ADR-0001-js-ast-parser.md)) |
| Tree-sitter / LSP | optional providers (S09-C) |

## Acceptance criteria

- [ ] `.ts` / `.tsx` не дают `UNSUPPORTED_LANGUAGE` на минимуме инспекторов
- [ ] JS `.js/.mjs/.cjs` путь без регрессии (существующие тесты зелёные)
- [ ] Type-only imports не ломают schema (поле опционально)
- [ ] Нет зависимости «сборки Dependra через tsc»; `typescript` только за adapter
- [ ] Фикстуры s09 + тесты покрывают registry + imports

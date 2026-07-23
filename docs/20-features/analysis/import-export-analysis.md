---
title: Анализ импортов и экспортов
status: draft
mvp: true
source: .dep/.blueprint/20-features/import-export-analysis---M, exported-entities---M
tags: [M]
---

# Анализ импортов и экспортов (−M)

## Цель

Для поддерживаемого JS выполнить **AST-анализ** импортов и экспортов. Регулярные выражения для разбора синтаксиса **запрещены**.

## Границы

### Входит (MVP)

- ESM: `import`, `export`, `export default`, `export * from`, `export { } from`
- Динамический `import()` — фиксируется как `kind: "dynamic"` (specifier, если статически известен строковый литерал)
- CJS: `require("...")` со строковым литералом; `module.exports` / `exports.x` — как export records best-effort
- Спецификаторы: относительные, абсолютные, bare (пакеты) — с пометкой `isExternal`
- Реэкспорты

### Не входит (MVP)

- TypeScript / JSX как обязательный язык (можно отклонить или deferred)
- Нестроковые динамические спецификаторы (`import(expr)`) — запись с `source: null` + флаг unresolved, без падения всего анализа
- Полный symbol-level exported entities graph (отдельная deferred-фича blueprint)
- Разрешение через custom loaders / tsconfig paths

## Вход

- Файл JS с доступным текстом
- Инспектор(ы): `import-export-analysis` (можно внутренне разделить imports/exports при сохранении контракта)
- Опции: подмножество CLI `--imports` / `--exports`

## Выход (`data`)

```json
{
  "moduleKind": "esm",
  "imports": [
    {
      "source": "./lib.js",
      "kind": "static",
      "resolvedPath": "/abs/proj/src/lib.js",
      "isExternal": false,
      "loc": { "line": 1, "column": 0 }
    },
    {
      "source": "fs",
      "kind": "static",
      "resolvedPath": null,
      "isExternal": true,
      "loc": { "line": 2, "column": 0 }
    }
  ],
  "exports": [
    {
      "kind": "named",
      "name": "run",
      "from": null,
      "loc": { "line": 10, "column": 0 }
    },
    {
      "kind": "all",
      "name": null,
      "from": "./other.js",
      "loc": { "line": 11, "column": 0 }
    }
  ]
}
```

Типы — см. [project-model.md](../../20-architecture/project-model.md).

## Правила

1. Только AST (через модуль `parsers`).
2. `moduleKind`: `esm` | `cjs` | `unknown` (эвристика: наличие `import`/`export` vs `require`/`module.exports`).
3. Локальные относительные пути пытаемся resolve относительно директории файла (расширения `.js`, `.mjs`, `.cjs`, `/index.js` — минимальный алгоритм Node-like; детали — ADR при выборе).
4. Ошибка парсинга → `PARSE_FAILED`, без частичного «тихого» успеха, если AST не построен. (Допустимо: partial с явным warning в будущем; для MVP — error.)

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет файла |
| `UNSUPPORTED_LANGUAGE` | validation | Не JS MVP |
| `PARSE_FAILED` | execution | Синтаксическая ошибка / сбой парсера |
| `READ_FAILED` | execution | Не удалось прочитать файл |

## Зависимости

- `parsers`, `project-model`
- [inspector-contract.md](../../20-architecture/inspector-contract.md)

## Acceptance criteria

- [ ] ESM static import/export покрыты тестами на фикстурах
- [ ] `require('x')` со строкой распознаётся в CJS
- [ ] Нет regex-парсера импортов
- [ ] JSON-схема полей совпадает с примером

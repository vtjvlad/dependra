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
- Динамический `import()` — `kind: "dynamic"`; если спецификатор — строковый литерал, он в `source`; иначе `source: null`
- CJS: `require("...")` со строковым литералом; `module.exports` / `exports.x` — как export records best-effort
- Спецификаторы: относительные, абсолютные, bare (пакеты) — с пометкой `isExternal`
- Реэкспорты

### Не входит (MVP)

- TypeScript / JSX как обязательный язык → `UNSUPPORTED_LANGUAGE`
- Полный symbol-level exported entities graph (deferred)
- Разрешение через custom loaders / tsconfig paths

## Инспектор и CLI

- **Один** инспектор: id `import-export-analysis`.
- Внутри всегда вычисляет и `imports`, и `exports` (один проход AST).
- В `results` и в отфильтрованном `data` — по флагам `--imports` / `--exports` (см. [interface.md](../../50-cli/interface.md)).
- При `--graph` без этих флагов инспектор может вызываться как **prerequisite**: пишет в `ProjectModel`, но не обязан попадать в `results`.

## Вход

- Файл JS с доступным текстом
- `AnalysisContext`; опции `imports` / `exports` / внутренний флаг prerequisite

## Выход (`data` полного результата инспектора)

До фильтрации CLI:

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
    },
    {
      "source": null,
      "kind": "dynamic",
      "resolvedPath": null,
      "isExternal": false,
      "loc": { "line": 5, "column": 2 }
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

Типы — [project-model.md](../../20-architecture/project-model.md).  
`source: null` допустим только для dynamic import с нестроковым спецификатором; это **не** ошибка инспектора.

## Правила

1. Только AST (через модуль `parsers`).
2. `moduleKind`:
   - `esm` — есть `import`/`export` и нет доминирующего CJS-паттерна; если есть и ESM, и `require`, для MVP: **`esm`** (ESM побеждает);
   - `cjs` — нет ESM-синтаксиса, есть `require` / `module.exports` / `exports.`;
   - `unknown` — иначе.
3. Resolve относительных путей от директории файла: расширения `.js`, `.mjs`, `.cjs`, затем `…/index.js` (минимальный Node-like). Детали пакета парсера — ADR.
4. Bare specifiers (`fs`, `lodash`) → `isExternal: true`, `resolvedPath: null`.
5. Ошибка парсинга файла → `PARSE_FAILED` (нет «тихого» успеха без AST).
6. Запись с `source: null` не роняет анализ остальных импортов.

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет файла |
| `UNSUPPORTED_LANGUAGE` | validation | Не JS MVP (не `.js`/`.mjs`/`.cjs` или явно не JS) |
| `PARSE_FAILED` | execution | Синтаксическая ошибка / сбой парсера |
| `READ_FAILED` | execution | Не удалось прочитать файл |

## Зависимости

- `parsers`, `project-model`
- [inspector-contract.md](../../20-architecture/inspector-contract.md)
- [interface.md](../../50-cli/interface.md) — pipeline и фильтрация

## Acceptance criteria

- [ ] ESM static import/export покрыты фикстурами
- [ ] `require('x')` со строкой распознаётся в CJS
- [ ] `import(expr)` даёт `source: null` без падения всего анализа
- [ ] Нет regex-парсера импортов
- [ ] Один инспектор обслуживает `--imports` и `--exports`
- [ ] Фильтрация `data` по флагам соответствует CLI

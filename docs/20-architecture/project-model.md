---
title: Единая модель проекта (MVP)
status: accepted
mvp: true
source: .dep/.blueprint/20-features/unified-project-model.md, 99-terminology
---

# Единая модель проекта (MVP)

## Цель

Все операции анализа опираются на **единое внутреннее представление**, а не на разрозненное чтение файлов «каждый сам по себе».

Запрещено менять исходники прямой текстовой правкой, если есть надёжное представление (для MVP модификации вне scope).

## Сущности MVP

```js
/**
 * @typedef {object} BasicFileInfo
 * @property {string} name
 * @property {string} ext
 * @property {string} format
 * @property {string|null} mimeType
 * @property {number} size
 * @property {string|null} createdAt ISO-8601
 * @property {string} modifiedAt ISO-8601
 * @property {string|null} accessedAt ISO-8601
 * @property {string|null} owner Десятичная строка uid (имя пользователя — deferred)
 * @property {string|null} group Десятичная строка gid
 * @property {"javascript"|"unknown"} language
 * @property {"node"|null} engine
 * @property {"file"} fileType
 */

/**
 * @typedef {object} SourceFile
 * @property {string} path Абсолютный путь
 * @property {string} [relativePath] Относительно cwd
 * @property {"javascript"} language
 * @property {"esm"|"cjs"|"unknown"} moduleKind
 * @property {string} [sourceText]
 * @property {object} [ast]
 * @property {BasicFileInfo} [basic]
 */

/**
 * @typedef {object} ImportRecord
 * @property {string|null} source Спецификатор или null, если dynamic import(expr)
 * @property {"static"|"dynamic"|"require"} kind
 * @property {string|null} resolvedPath
 * @property {boolean} isExternal
 * @property {{ line: number, column: number }} [loc]
 */

/**
 * @typedef {object} ExportRecord
 * @property {"named"|"default"|"all"|"commonjs"} kind
 * @property {string|null} [name]
 * @property {string|null} [from]
 * @property {{ line: number, column: number }} [loc]
 */

/**
 * @typedef {object} DependencyEdge
 * @property {string} from Абсолютный путь источника
 * @property {string} to Абсолютный путь или спецификатор, если не resolved
 * @property {"imports"|"imported-by"} direction Относительно целевого файла отчёта
 * @property {ImportRecord} [via]
 */

/**
 * @typedef {object} ProjectModel
 * @property {string} cwd
 * @property {string} targetPath
 * @property {Object.<string, SourceFile>} files
 * @property {ImportRecord[]} [imports] Imports целевого файла (и при необходимости кэша кандидатов)
 * @property {ExportRecord[]} [exports]
 * @property {DependencyEdge[]} [edges]
 */
```

## Правила

1. Источники анализа (AST, FS metadata) **дополняют** модель.
2. Повторное чтение / пересборка AST — только при необходимости.
3. Инспекторы пишут в согласованные поля; reporters читают `results` + при необходимости модель.
4. Имя флага внешнего модуля везде: **`isExternal`** (не `external`).
5. LSP / Tree-sitter / полная семантика — **deferred**.

## Пример фрагмента модели

```json
{
  "cwd": "/home/u/proj",
  "targetPath": "/home/u/proj/src/app.js",
  "files": {
    "/home/u/proj/src/app.js": {
      "path": "/home/u/proj/src/app.js",
      "relativePath": "src/app.js",
      "language": "javascript",
      "moduleKind": "esm"
    }
  },
  "imports": [
    {
      "source": "./lib.js",
      "kind": "static",
      "resolvedPath": "/home/u/proj/src/lib.js",
      "isExternal": false,
      "loc": { "line": 1, "column": 0 }
    },
    {
      "source": null,
      "kind": "dynamic",
      "resolvedPath": null,
      "isExternal": false,
      "loc": { "line": 4, "column": 0 }
    }
  ],
  "exports": [
    { "kind": "named", "name": "run", "from": null, "loc": { "line": 10, "column": 0 } }
  ],
  "edges": []
}
```

## Acceptance criteria

- [ ] MVP-инспекторы опираются на `ProjectModel` / `SourceFile`
- [ ] `ImportRecord.source` допускает `null`
- [ ] Везде используется `isExternal`
- [ ] `BasicFileInfo` согласован с basic-инспектором

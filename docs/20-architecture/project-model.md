---
title: Единая модель проекта (MVP)
status: draft
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
 * @typedef {object} SourceFile
 * @property {string} path Абсолютный путь
 * @property {string} [relativePath] Относительно cwd/проекта
 * @property {string} language "javascript"
 * @property {"esm"|"cjs"|"unknown"} moduleKind
 * @property {string} [sourceText] Текст (если загружен)
 * @property {object} [ast] AST (если построен)
 * @property {BasicFileInfo} [basic] Результат basic-инспектора
 */

/**
 * @typedef {object} ImportRecord
 * @property {string} source Спецификатор из кода ("./x.js", "fs", …)
 * @property {"static"|"dynamic"|"require"} kind
 * @property {string} [resolvedPath] Разрешённый путь к файлу, если удалось
 * @property {boolean} isExternal Пакет/builtin vs локальный файл
 * @property {{ line: number, column: number }} [loc]
 */

/**
 * @typedef {object} ExportRecord
 * @property {"named"|"default"|"all"|"commonjs"} kind
 * @property {string} [name] Имя экспорта (для named)
 * @property {string} [from] Для реэкспорта — спецификатор
 * @property {{ line: number, column: number }} [loc]
 */

/**
 * @typedef {object} DependencyEdge
 * @property {string} from Абсолютный путь файла-источника
 * @property {string} to Абсолютный путь или спецификатор (если не resolved)
 * @property {"imports"|"imported-by"} direction Относительно целевого файла отчёта
 * @property {ImportRecord} [via]
 */

/**
 * @typedef {object} ProjectModel
 * @property {string} cwd
 * @property {string} targetPath
 * @property {Object.<string, SourceFile>} files
 * @property {ImportRecord[]} [imports]
 * @property {ExportRecord[]} [exports]
 * @property {DependencyEdge[]} [edges]
 */
```

## Правила

1. Источники анализа (AST, FS metadata) **дополняют** модель, а не живут изолированно.
2. Повторное чтение файла / пересборка AST — только при необходимости (изменение, miss в модели).
3. Инспекторы пишут в согласованные поля; reporters читают модель + результаты инспекторов.
4. LSP / Tree-sitter / полная семантическая модель — **deferred**; архитектура не должна запрещать их добавление позже.

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
    }
  ],
  "exports": [
    { "kind": "named", "name": "run", "loc": { "line": 10, "column": 0 } }
  ],
  "edges": []
}
```

## Acceptance criteria

- [ ] MVP-инспекторы опираются на `ProjectModel` / `SourceFile`
- [ ] Импорты/экспорты представлены `ImportRecord` / `ExportRecord`
- [ ] Нет параллельных несовместимых структур «на инспектор»

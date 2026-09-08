---
title: Проверка корректности
status: draft
mvp: false
source: .dep/.blueprint/20-features/validation---D
tags: [D]
---

# Проверка корректности (−D, S03)

## Цель

По целевому JS-файлу и локальному графу проекта выдать **diagnostics**: циклы зависимостей, неиспользуемые импорты/экспорты, битые импорты и ошибки разрешения путей.

## Границы

### Входит (S03)

- Циклические зависимости (локальный граф `.js`/`.mjs`/`.cjs`), затрагивающие **целевой** файл
- Неиспользуемые импорты целевого файла (AST, best-effort)
- Неиспользуемые экспорты целевого файла (нет потребителей в reverse-scan)
- Битые импорты: локальный спецификатор не резолвится или файл отсутствует
- Ошибки path resolution (тот же класс findings; отдельный код при сбое resolve vs «файл не найден»)
- Единый список `diagnostics` в JSON и schematic-секция в text

### Не входит

- Автофикс / удаление импортов (S07)
- Quality metrics / smells (S06)
- Visualization графа циклов (S05)
- TypeScript / JSX как обязательный язык (S09)
- Полный monorepo / package-exports resolve beyond Node-like S01
- Runtime / env validation (S04)

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--validate` | `-va` | `-v` занят `--version` → вторая буква → `-va` |

Не входит в default-all.  
Спека флагов: [s03-flags.md](../../50-cli/s03-flags.md).  
Short-алгоритм: [interface.md](../../50-cli/interface.md#короткие-флаги).

## Инспектор

- **Один** инспектор: id `validation`.
- В `results` ключ `validation` только при `--validate` / `-va`.
- Prerequisites: import-export (и при необходимости scan) **внутри** pipeline; ключ `import-export-analysis` в `results` не обязателен.

## Вход

- Целевой JS-файл
- `options.pathMode`: `"name"` \| `"relative"` \| `"absolute"` (default: `"relative"`) — для путей в diagnostics
- `AnalysisContext` + `ProjectModel` (imports целевого; при cycles/unused-exports — граф соседей)

## Выход (`data`)

```json
{
  "pathMode": "relative",
  "summary": {
    "error": 1,
    "warning": 2,
    "info": 0
  },
  "diagnostics": [
    {
      "code": "CYCLE",
      "severity": "error",
      "message": "Циклическая зависимость",
      "paths": ["src/a.js", "src/b.js", "src/a.js"],
      "loc": null
    },
    {
      "code": "UNUSED_IMPORT",
      "severity": "warning",
      "message": "Импорт не используется",
      "source": "./unused.js",
      "resolvedPath": "/abs/proj/src/unused.js",
      "display": "src/unused.js",
      "loc": { "line": 2, "column": 0 }
    },
    {
      "code": "UNUSED_EXPORT",
      "severity": "warning",
      "message": "Экспорт не используется в проекте",
      "name": "helper",
      "exportKind": "named",
      "display": "helper",
      "loc": { "line": 10, "column": 0 }
    },
    {
      "code": "BROKEN_IMPORT",
      "severity": "error",
      "message": "Импорт указывает на отсутствующий файл",
      "source": "./missing.js",
      "resolvedPath": null,
      "display": "./missing.js",
      "loc": { "line": 3, "column": 0 }
    },
    {
      "code": "PATH_RESOLVE_FAILED",
      "severity": "error",
      "message": "Не удалось разрешить путь импорта",
      "source": "./weird",
      "resolvedPath": null,
      "display": "./weird",
      "loc": { "line": 4, "column": 0 }
    }
  ],
  "skipped": []
}
```

### Поля diagnostic (общие)

| Поле | Тип | Назначение |
|------|-----|------------|
| `code` | string | Машинный код (таблица ниже) |
| `severity` | `"error"` \| `"warning"` \| `"info"` | Уровень |
| `message` | string | Краткий текст |
| `loc` | `{line, column}` \| `null` | Локация в целевом файле, если есть |
| `display` | string? | Путь/имя в `pathMode` |
| `paths` | string[]? | Только для `CYCLE`: замкнутая цепочка display-путей (первый = последний) |
| `source` / `resolvedPath` / `name` / `exportKind` | опц. | Контекст finding |

`summary.*` — число diagnostics каждого severity (после фильтрации duplicates).

`skipped` — abs/rel пути кандидатов reverse-scan/graph, которые не удалось разобрать (как у dependency-analysis), без падения всего анализа.

## Коды diagnostics

| code | severity (default) | Когда |
|------|--------------------|--------|
| `CYCLE` | error | Есть цикл локальных рёбер, включающий целевой файл |
| `UNUSED_IMPORT` | warning | Binding импорта целевого не встречается в AST вне import-declaration (best-effort) |
| `UNUSED_EXPORT` | warning | Named/default export целевого не импортируется ни одним файлом в scan |
| `BROKEN_IMPORT` | error | Локальный импорт: resolve дал путь, файла нет **или** relative/absolute не резолвится в существующий файл |
| `PATH_RESOLVE_FAILED` | error | Локальный спецификатор, для которого алгоритм resolve завершился неудачей без однозначного «missing file» (граничные случаи); иначе предпочтителен `BROKEN_IMPORT` |

External / bare (`isExternal: true`) **не** дают `BROKEN_IMPORT` / `PATH_RESOLVE_FAILED`.

## Корень проекта и граф (cycles / unused exports)

Те же правила, что [dependency-analysis.md](dependency-analysis.md):

1. Ближайший `package.json` вверх от директории целевого файла.
2. Иначе `cwd` из контекста.
3. Скан `.js`/`.mjs`/`.cjs`, исключая `node_modules`, `.git`.
4. Рёбра — только успешно resolved локальные импорты (static / require / dynamic со строкой).

## Правила

1. Один проход инспектора собирает все классы findings; порядок в `diagnostics`: errors, затем warnings, затем info; внутри — по `loc.line` (null в конце), стабильно.
2. **Cycles:** только циклы, где в SCC / пути участвует `targetPath`. Дубликаты одного и того же цикла (ротация) — один finding (канонический старт = минимальный path среди узлов цикла).
3. **Unused import:**
   - side-effect `import './x'` / `require` без binding — **не** unused;
   - `import * as ns` — unused, если `ns` не используется;
   - `import { a as b }` — проверка по локальному имени `b`;
   - dynamic `import(expr)` с `source: null` — не участвует в unused;
   - CJS `const x = require('…')` — unused, если `x` не используется (best-effort).
4. **Unused export:**
   - `export * from` — в S03 **не** помечается unused (слишком шумно);
   - re-export `{ x } from` — unused, если ни `x` у цели, ни потребители не тянут `x` (достаточно: нет импорта `x` из target path);
   - `module.exports =` / `exports.x` — best-effort по именам;
   - отсутствие потребителей в scan → unused; файлы вне корня не учитываются.
5. **Broken / path:** только не-external; относительные и абсолютные спецификаторы. Resolve — Node-like S01 (расширения + `index`).
6. Ошибка парсинга **целевого** → fatal `PARSE_FAILED` инспектора (нет тихого пустого success).
7. Ошибка парсинга **кандидата** scan → skip + запись в `skipped[]`, анализ продолжается.
8. Нет подготовленных imports целевого и pipeline не смог их построить → `MODEL_INCOMPLETE` (configuration).
9. Пустой `diagnostics` при чистом файле — нормальный `status: "ok"`, `summary` нули.
10. Ложные срабатывания: в пределах правил выше; фикстуры AC не должны требовать 100% semantic unused detection для сложных shadowing/eval случаев — такие случаи **не** обязаны флагиться.

## Ошибки инспектора

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет целевого файла |
| `UNSUPPORTED_LANGUAGE` | validation | Не JS MVP |
| `MODEL_INCOMPLETE` | configuration | Нет imports целевого после prerequisite |
| `PARSE_FAILED` | execution | Не разобран целевой |
| `READ_FAILED` | execution | Не прочитан целевой |
| `SCAN_FAILED` | execution | Сбой обхода корня |

Findings в `data.diagnostics` — **не** ошибки инспектора (`status` остаётся `ok`, если анализ завершён).

## Зависимости

- [import-export-analysis.md](import-export-analysis.md) (prerequisite)
- [dependency-analysis.md](dependency-analysis.md) (корень / scan / pathMode)
- [project-model.md](../../20-architecture/project-model.md)
- [inspector-contract.md](../../20-architecture/inspector-contract.md)
- [s03-flags.md](../../50-cli/s03-flags.md)

## Acceptance criteria

- [ ] `--validate` / `-va` даёт ключ `validation` в `results` с `diagnostics` + `summary`
- [ ] Фикстура с A→B→A (через target) → `CYCLE`
- [ ] Фикстура с неиспользуемым named import → `UNUSED_IMPORT`
- [ ] Фикстура с export без потребителей → `UNUSED_EXPORT`
- [ ] Фикстура с `./missing.js` → `BROKEN_IMPORT` (или `PATH_RESOLVE_FAILED` по правилам)
- [ ] Bare/`fs` не помечается broken
- [ ] Side-effect import не помечается unused
- [ ] Parse fail кандидата → `skipped`, не падение инспектора
- [ ] Без флага validate секции diagnostics нет; не в default-all
- [ ] Text schematic: секция `diagnostics` только при флаге

---
title: Форматы вывода
status: accepted
mvp: true
source: .dep/.blueprint/50-user/cli-flags.md, 35-configurations/output-settings.md
---

# Форматы вывода (MVP)

## Цель

Единый отчёт CLI в text и JSON.

## JSON-схема отчёта

```json
{
  "version": "0.0.2",
  "target": "/abs/path/to/file.js",
  "cwd": "/abs/cwd",
  "options": {
    "basic": true,
    "imports": true,
    "exports": true,
    "graph": true,
    "pathMode": "relative"
  },
  "results": {
    "basic-file-information": {
      "inspectorId": "basic-file-information",
      "status": "ok",
      "data": {}
    },
    "import-export-analysis": {
      "inspectorId": "import-export-analysis",
      "status": "ok",
      "data": {
        "moduleKind": "esm",
        "imports": [],
        "exports": []
      }
    },
    "dependency-analysis": {
      "inspectorId": "dependency-analysis",
      "status": "ok",
      "data": {}
    }
  }
}
```

Правила наполнения `results` — [interface.md](interface.md) (таблица флагов + pipeline).

- В `results` только инспекторы, запрошенные пользователем как операции отчёта.
- У `import-export-analysis.data` поля `imports` / `exports` присутствуют согласно флагам (см. фильтрацию в interface).
- Форма каждого результата — [inspector-contract.md](../20-architecture/inspector-contract.md).

### Пример: только `--imports`

```json
{
  "version": "0.0.2",
  "target": "/abs/proj/src/app.js",
  "cwd": "/abs/proj",
  "options": {
    "basic": false,
    "imports": true,
    "exports": false,
    "graph": false,
    "pathMode": "relative"
  },
  "results": {
    "import-export-analysis": {
      "inspectorId": "import-export-analysis",
      "status": "ok",
      "data": {
        "moduleKind": "esm",
        "imports": [
          {
            "source": "./lib.js",
            "kind": "static",
            "resolvedPath": "/abs/proj/src/lib.js",
            "isExternal": false,
            "loc": { "line": 1, "column": 0 }
          }
        ]
      }
    }
  }
}
```

### Пример: только `--graph`

В `results` только `dependency-analysis`. Ключа `import-export-analysis` нет.

## Text

Секции только для включённых операций. Layout — **schematic** (рамочные блоки в `reporters`): смысл секций обязателен, оформление — за reporters.

Идея вывода:

```
dependra 0.0.2 · schematic
target  src/app.js
cwd     /abs/proj

┌─ file ─────────────────────────────────────────┐
│  app.js                                        │
│  src/app.js                                    │
│  javascript  ·  text/javascript  ·  112 B      │
└────────────────────────────────────────────────┘

┌─ imports · esm ────────────────────────────────┐
│  →  fs                              external   │
│  →  ./lib.js                                   │
└────────────────────────────────────────────────┘

┌─ exports ──────────────────────────────────────┐
│  ◆  run                             named      │
│  ★  default                         default    │
└────────────────────────────────────────────────┘

┌─ graph ────────────────────────────────────────┐
│  path-mode relative                            │
│  flow … (мини-схема) + колонки imported-by/imports │
└────────────────────────────────────────────────┘
```

- секция **imports** — только при `options.imports`
- секция **exports** — только при `options.exports`
- секция **graph** — только при `options.graph`
- секция **file** (basic) — только при `options.basic`

ANSI-цвет: только если stdout — TTY и не задан `NO_COLOR`. Баннер dependra — внизу text-отчёта и `--help`.

## Секции S02

Флаги и pipeline: [s02-flags.md](s02-flags.md). В text — отдельные рамки; в JSON — ключи инспекторов и поля `options.additional` / `options.entities`.

```
┌─ additional ───────────────────────────────────┐
│  abs / rel / mode / privilege hints / copies   │
└────────────────────────────────────────────────┘

┌─ entities ─────────────────────────────────────┐
│  path-mode … · export/import symbol rows       │
└────────────────────────────────────────────────┘
```

- **additional** — только при `options.additional` (`-a` / `--additional`)
- **entities** — только при `options.entities` (`-en` / `--entities`)
- не входят в default-all S01

## Правила

1. JSON — в stdout; диагностики CLI при `--json` — в stderr.
2. При ошибке инспектора в JSON возвращается объект с `status: "error"`.
3. Имена полей зависимостей в graph: `isExternal` (не `external`) — единообразно с моделью.
4. Форматы Mermaid/Graphviz — deferred.

## Acceptance criteria

- [ ] JSON валиден и содержит `version: "0.0.2"`
- [ ] stderr не ломает парсинг JSON из stdout
- [ ] Text/JSON содержат секции только для включённых операций
- [ ] При только `--imports` в `data` нет поля `exports`
- [ ] При только `--graph` нет ключа `import-export-analysis` в `results`
- [ ] Секции S02 `additional` / `entities` появляются только при `-a` / `-en`

---
title: Форматы вывода
status: draft
mvp: true
source: .dep/.blueprint/50-user/cli-flags.md, 35-configurations/output-settings.md
---

# Форматы вывода (MVP)

## Цель

Единый отчёт CLI в text и JSON.

## JSON-схема отчёта

```json
{
  "version": "0.0.1",
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
  "version": "0.0.1",
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

Секции только для включённых операций:

```
# basic
name: app.js
...

# imports
- ./lib.js
- fs

# exports
- named: run

# graph
imported-by          imports
-------------------  -------------------
src/main.js          src/lib.js
                     fs
```

- `# imports` — только при `options.imports`
- `# exports` — только при `options.exports`
- `# graph` — только при `options.graph`
- `# basic` — только при `options.basic`

Точный layout text — за `reporters`; смысл секций обязателен.

## Правила

1. JSON — в stdout; диагностики CLI при `--json` — в stderr.
2. При ошибке инспектора в JSON возвращается объект с `status: "error"`.
3. Имена полей зависимостей в graph: `isExternal` (не `external`) — единообразно с моделью.
4. Форматы Mermaid/Graphviz — deferred.

## Acceptance criteria

- [ ] JSON валиден и содержит `version: "0.0.1"`
- [ ] stderr не ломает парсинг JSON из stdout
- [ ] Text/JSON содержат секции только для включённых операций
- [ ] При только `--imports` в `data` нет поля `exports`
- [ ] При только `--graph` нет ключа `import-export-analysis` в `results`

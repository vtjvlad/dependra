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
    "basic-file-information": { "inspectorId": "basic-file-information", "status": "ok", "data": {} },
    "import-export-analysis": { "inspectorId": "import-export-analysis", "status": "ok", "data": {} },
    "dependency-analysis": { "inspectorId": "dependency-analysis", "status": "ok", "data": {} }
  }
}
```

В `results` попадают только запрошенные инспекторы. Форма каждого — [inspector-contract.md](../20-architecture/inspector-contract.md).

## Text

Человекочитаемые секции по включённым операциям:

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

Точный layout text — за `reporters`; смысл секций обязателен.

## Правила

1. JSON пишется в stdout; диагностические сообщения CLI при `--json` — в stderr.
2. При ошибке инспектора в JSON всё равно возвращается объект с `status: "error"`.
3. Форматы Mermaid/Graphviz — deferred.

## Acceptance criteria

- [ ] JSON валиден и содержит `version: "0.0.1"`
- [ ] stderr не ломает парсинг JSON из stdout
- [ ] Text содержит секции только для включённых операций

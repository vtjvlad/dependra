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
  "version": "0.0.39",
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
  "version": "0.0.39",
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
dependra 0.0.39 · schematic
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

## Секции S03

Флаги и pipeline: [s03-flags.md](s03-flags.md). В text — рамка `diagnostics`; в JSON — ключ `validation` и поле `options.validate`.

```
┌─ diagnostics ──────────────────────────────────┐
│  summary · CYCLE / UNUSED_* / BROKEN_IMPORT …  │
└────────────────────────────────────────────────┘
```

- **diagnostics** — только при `options.validate` (`-va` / `--validate`)
- не входит в default-all S01

## Секции S04

Флаги и pipeline: [s04-flags.md](s04-flags.md).

| options.* | results key | text title |
|-----------|-------------|------------|
| `environment` | `file-environment-analysis` | `environment` |
| `commands` | `commands` | `commands` |
| `envCheck` | `environment-validation` | `env-check` |
| `runtime` | `runtime-dependency-analysis` | `runtime` |
| `io` | `file-operations` | `io` |

- только при явном флаге; не в default-all
- операции **только анализ** (нет install / записи FS)

## Секции S05

Флаги и pipeline: [s05-flags.md](s05-flags.md). Config: [s05-config.md](../35-configuration/s05-config.md).

| options.* | results key | text title |
|-----------|-------------|------------|
| `mermaid` | `visualization` | `mermaid` |
| `graphviz` | `visualization` | `graphviz` |
| `vizJson` | `visualization` | `viz-json` |
| `metadata` | `metadata` | `metadata` |

- viz-флаги разделяют один ключ `visualization`; в `data.formats` только запрошенные носители
- `--json` / `-j` — формат **отчёта**; `--viz-json` / `-vj` — вид графа
- `--level` / `--profile` / `--config` секций в `results` не создают
- не в default-all

```
┌─ mermaid ──────────────────────────────────────┐
│  dependency-graph / import-tree / …            │
└────────────────────────────────────────────────┘

┌─ metadata ─────────────────────────────────────┐
│  providers · skippedProviders                  │
└────────────────────────────────────────────────┘
```

## Секции S06

Флаги и pipeline: [s06-flags.md](s06-flags.md).

| options.* | results key | text title |
|-----------|-------------|------------|
| `quality` | `code-quality-analysis` | `quality` |
| `explain` | `ai-explain` | `ai-explain` |

- только при явном флаге / level(quality) / profile / `ai.explain`; не в default-all
- `-ex` OR-включает `quality`
- explain может быть `skipped` без падения отчёта
- quality **offline**; explain опционален ([ai-explain.md](../20-features/analysis/ai-explain.md))

```
┌─ quality ──────────────────────────────────────┐
│  scores · metrics · findings                   │
└────────────────────────────────────────────────┘

┌─ ai-explain ───────────────────────────────────┐
│  explanations | skipped: reason                │
└────────────────────────────────────────────────┘
```

## Секции S07

Флаги и pipeline: [s07-flags.md](s07-flags.md).  
Подсистема: [modifications/](../20-features/modifications/README.md).

| options.* (mutate/safety) | results key | text title |
|---------------------------|-------------|------------|
| любой mutate-op / undo | `modification` | `modification` |

- только при явном mutate/undo; **не** в default-all и **не** в `--level`
- без `--apply` → preview (`mode: "preview"|"dry-run"`), файлы не меняются
- `--dry-run` побеждает `--apply`
- анализ-инспекторы по-прежнему read-only

```
┌─ modification ─────────────────────────────────┐
│  mode · summary · changes (id/op/diff)         │
│  backup · appliedIds | undo session            │
└────────────────────────────────────────────────┘
```

## Правила

1. JSON — в stdout; диагностики CLI при `--json` — в stderr.
2. При ошибке инспектора в JSON возвращается объект с `status: "error"`.
3. Имена полей зависимостей в graph: `isExternal` (не `external`) — единообразно с моделью.
4. Форматы Mermaid/Graphviz/viz-json — спека S05: [visualization.md](../20-features/analysis/visualization.md).
5. Quality / AI explain — спека S06: [code-quality-analysis.md](../20-features/analysis/code-quality-analysis.md), [ai-explain.md](../20-features/analysis/ai-explain.md).
6. Modifications — спека S07: [modifications/safety.md](../20-features/modifications/safety.md), [s07-flags.md](s07-flags.md).

## Acceptance criteria

- [ ] JSON валиден и содержит `version: "0.0.39"`
- [ ] stderr не ломает парсинг JSON из stdout
- [ ] Text/JSON содержат секции только для включённых операций
- [ ] При только `--imports` в `data` нет поля `exports`
- [ ] При только `--graph` нет ключа `import-export-analysis` в `results`
- [ ] Секции S02 `additional` / `entities` появляются только при `-a` / `-en`
- [ ] Секция S03 `diagnostics` / ключ `validation` только при `-va` / `--validate`
- [ ] Секции S04 появляются только при `-env`/`-c`/`-ec`/`-r`/`-io`
- [ ] Секции S05 mermaid/graphviz/viz-json/metadata только при соответствующих флагах (или level/profile)
- [ ] Секции S06 `quality` / `ai-explain` только при `-q` / `-ex` (или level/profile/`ai.explain`)
- [ ] Секция S07 `modification` только при mutate/undo флагах; без `--apply` нет записи на диск

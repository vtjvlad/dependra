---
title: CLI флаги S05
status: draft
mvp: false
source: handbook/roadmap/stages/05-visualization-config.md, docs/50-cli/interface.md
---

# CLI флаги S05

## Цель

Зафиксировать флаги этапа **S05** (visualization E + config sugar + metadata U) в правилах S01–S04: long/short, pipeline/`results`, schematic help/text.

Версия пакета остаётся `0.0.33` (не повышать без approve).

## Правила short

См. [interface.md — Короткие флаги](interface.md#короткие-флаги).  
Short S01–S04 не переназначать  
(`-b|-i|-e|-g|-j|-p|-h|-v|-a|-en|-va|-env|-c|-ec|-r|-io`).

## Флаги операций S05 (viz + metadata)

| Long | Short | Почему short | Инспектор | Text-секция |
|------|-------|--------------|-----------|-------------|
| `--mermaid` | `-m` | `m` свободна | `visualization` | `mermaid` |
| `--graphviz` | `-gr` | `-g` = graph → `-gr` | `visualization` | `graphviz` |
| `--viz-json` | `-vj` | `-v` = version; mnemonic viz-json | `visualization` | `viz-json` |
| `--metadata` | `-me` | `-m` занят mermaid → `-me` | `metadata` | `metadata` |

Один инспектор `visualization` на любой набор viz-флагов; в `data.formats` только запрошенные носители.

## Флаги конфигурации S05 (не operations в `results`)

| Long | Short | Аргумент | Смысл |
|------|-------|----------|--------|
| `--level` | `-l` | `1..5` | Сахар → набор operations ([analysis-levels.md](../40-development/analysis-levels.md)) |
| `--profile` | `-pr` | имя | Профиль из конфига |
| `--config` | `-cf` | path | Явный project-config JSON |

Детали merge: [s05-config.md](../35-configuration/s05-config.md).

### Запрещено в S05

- Зашивать `--level` в inspectors
- Uppercase-short; кластеры (`-ml`)
- Включать viz/metadata в default-all
- Путать `--json` / `-j` (формат **отчёта** CLI) и `--viz-json` / `-vj` (вид графа внутри visualization)

## Default и комбинации

- Нет ops после merge → default-all **только S01**.
- Viz/metadata — только явное включение (или через `--level 5` / profile operations).
- Примеры:
  - `dependra f.js -m`
  - `dependra f.js -gr -vj -j`
  - `dependra f.js -me -a`
  - `dependra f.js -l 3`
  - `dependra f.js -pr deps -va`
  - `dependra f.js -cf ./my.config.json -l 1 -m`

## Соответствие флагов и `results`

| Флаги | Ключ в `results` | Text title(s) |
|-------|------------------|---------------|
| `--mermaid` / `-m` и/или `--graphviz` / `-gr` и/или `--viz-json` / `-vj` | `visualization` | `mermaid` / `graphviz` / `viz-json` (по флагам) |
| `--metadata` / `-me` | `metadata` | `metadata` |

`options` в JSON-отчёте дополняется:

```json
{
  "mermaid": true,
  "graphviz": false,
  "vizJson": true,
  "metadata": true,
  "level": 5,
  "profile": "deps",
  "configPath": "/abs/proj/dependra.config.json"
}
```

- `level` / `profile` / `configPath` — отражают факт использования (null/omit, если не заданы).
- Булевы `mermaid` / `graphviz` / `vizJson` / `metadata` — итог после merge.

## Pipeline (дополнение)

1. Разобрать argv → load configs → merge → итоговый `options` ([s05-config.md](../35-configuration/s05-config.md)).
2. Если любой viz-флаг:
   - prerequisite import-export (+ scan как у graph);
   - инспектор `visualization` → `results.visualization`.
3. Если `--metadata` / `-me`:
   - инспектор `metadata` (AST не обязателен).
4. Reporters: секции только для включённых форматов / metadata.

Детали данных: [visualization.md](../20-features/analysis/visualization.md), [metadata.md](../20-features/analysis/metadata.md).

## Help (schematic)

```
┌─ operations · s05 ─────────────────────────────┐
│ -m, --mermaid           Mermaid views          │
│ -gr, --graphviz         Graphviz DOT           │
│ -vj, --viz-json         JSON graph views       │
│ -me, --metadata         metadata extractors    │
│                                                │
│ только явное / level / profile (не default-all)│
└────────────────────────────────────────────────┘

┌─ config · s05 ─────────────────────────────────┐
│ -l, --level <1..5>      сахар над операциями   │
│ -pr, --profile <name>   профиль из конфига     │
│ -cf, --config <path>    явный dependra.config  │
└────────────────────────────────────────────────┘
```

## Text (идея секций)

См. [visualization.md](../20-features/analysis/visualization.md), [metadata.md](../20-features/analysis/metadata.md), [output-formats.md](output-formats.md#секции-s05).

## Acceptance criteria

- [ ] Short `-m` / `-gr` / `-vj` / `-me` / `-l` / `-pr` / `-cf` документированы и не конфликтуют с S01–S04
- [ ] `-m` ≠ `-me`; `-j` ≠ `-vj`
- [ ] Default-all не включает viz/metadata
- [ ] Help: рамки `operations · s05` и `config · s05`
- [ ] JSON `options` содержит `mermaid` / `graphviz` / `vizJson` / `metadata` (+ опц. `level`/`profile`/`configPath`)
- [ ] Один ключ `visualization` на любой набор viz-флагов
- [ ] `--level` не читается инспекторами

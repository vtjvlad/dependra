---
title: Визуализация
status: accepted
mvp: false
source: .dep/.blueprint/20-features/visualization---E
tags: [E]
---

# Визуализация (−E, S05)

## Цель

По данным анализа (граф зависимостей, импорты, экспорты) выдать **визуальные представления**: Mermaid, Graphviz (DOT) и структурированный JSON-граф. Архитектура допускает добавление форматов без смены контракта инспектора.

## Границы

### Входит (S05)

- Виды (views):
  - **dependency-graph** — локальный граф зависимостей вокруг целевого файла
  - **import-tree** — дерево импортов целевого (глубина ограничена)
  - **export-consumers** — кто импортирует экспорты целевого (reverse, best-effort)
- Форматы вывода:
  - **Mermaid** (`flowchart` / `graph LR`)
  - **Graphviz** (DOT `digraph`)
  - **viz-json** — машинный граф `{nodes, edges}` (не путать с CLI `--json` отчёта)
- Text schematic: секции с готовыми блоками (код/диаграмма) при соответствующих флагах
- JSON-отчёт CLI: ключ инспектора `visualization` в `results`

### Не входит

- Интерактивный canvas / TUI-граф (S08)
- Автооткрытие Graphviz/Mermaid-рендерера во внешнем GUI
- Полный monorepo / package-exports resolve beyond Node-like S01–S03
- Quality / architectural smells — спека S06: [code-quality-analysis.md](code-quality-analysis.md) (не поверх viz в S05)
- Замена секции `graph` (S01): viz — **отдельная** операция

## CLI

| Long | Short | Правило short | Формат в `data` |
|------|-------|---------------|-----------------|
| `--mermaid` | `-m` | `m` свободна | `formats.mermaid` |
| `--graphviz` | `-gr` | `-g` = graph → `-gr` | `formats.graphviz` |
| `--viz-json` | `-vj` | `-v` = version; mnemonic viz-json | `formats.json` |

Не в default-all. Нужен хотя бы один viz-флаг.  
Спека флагов: [s05-flags.md](../../50-cli/s05-flags.md).  
Short-алгоритм: [interface.md](../../50-cli/interface.md#короткие-флаги).

## Инспектор

- **Один** инспектор: id `visualization`.
- Ключ в `results`: `visualization` — если запрошен хотя бы один viz-флаг.
- Prerequisites (pipeline, ключи в `results` не обязательны):
  - import-export целевого;
  - для dependency-graph / export-consumers — scan/граф как у [dependency-analysis](dependency-analysis.md) / [validation](validation.md).

## Вход

- Целевой JS-файл
- `options.pathMode`: `"name"` \| `"relative"` \| `"absolute"` (default: `"relative"`) — подписи узлов
- `options.mermaid` / `graphviz` / `vizJson` — какие форматы наполнять
- `AnalysisContext` + `ProjectModel`

## Выход (`data`)

```json
{
  "pathMode": "relative",
  "views": ["dependency-graph", "import-tree", "export-consumers"],
  "formats": {
    "mermaid": {
      "dependencyGraph": "graph LR\n  A[\"src/a.js\"] --> B[\"src/b.js\"]\n",
      "importTree": "graph TD\n  T[\"src/a.js\"] --> I0[\"fs\"]\n",
      "exportConsumers": "graph LR\n  C[\"src/main.js\"] --> T[\"src/a.js\"]\n"
    },
    "graphviz": {
      "dependencyGraph": "digraph G {\n  \"src/a.js\" -> \"src/b.js\";\n}\n",
      "importTree": "digraph G {\n  \"src/a.js\" -> \"fs\";\n}\n",
      "exportConsumers": "digraph G {\n  \"src/main.js\" -> \"src/a.js\";\n}\n"
    },
    "json": {
      "dependencyGraph": {
        "nodes": [
          { "id": "src/a.js", "kind": "local" },
          { "id": "src/b.js", "kind": "local" },
          { "id": "fs", "kind": "external" }
        ],
        "edges": [
          { "from": "src/a.js", "to": "src/b.js", "type": "import" }
        ]
      },
      "importTree": {
        "root": "src/a.js",
        "nodes": [],
        "edges": []
      },
      "exportConsumers": {
        "root": "src/a.js",
        "nodes": [],
        "edges": []
      }
    }
  },
  "skipped": []
}
```

### Правила наполнения `formats`

| Флаг | Ключ в `formats` | Остальные ключи |
|------|------------------|-----------------|
| только `--mermaid` | `mermaid` | `graphviz` / `json` **отсутствуют** |
| только `--graphviz` | `graphviz` | … |
| только `--viz-json` | `json` | … |
| комбинация | все запрошенные | |

Все три **views** строятся при любом viz-флаге (одинаковый набор видов; меняется только носитель). Пустой граф (нет рёбер) — валидный результат с узлом target.

### Узлы и рёбра (viz-json)

| Поле | Тип | Назначение |
|------|-----|------------|
| `nodes[].id` | string | Display-id в `pathMode` (external — bare/`fs`/URL как в модели) |
| `nodes[].kind` | `"local"` \| `"external"` | |
| `edges[].from` / `to` | string | id узлов |
| `edges[].type` | `"import"` \| `"re-export"` \| `"dynamic"` | best-effort |

`skipped` — кандидаты scan, которые не разобрали (как у graph/validation).

## Text (schematic)

Отдельные рамки только для включённых форматов:

```
┌─ mermaid ──────────────────────────────────────┐
│  · dependency-graph                            │
│  graph LR …                                    │
│  · import-tree / export-consumers …            │
└────────────────────────────────────────────────┘

┌─ graphviz ─────────────────────────────────────┐
│  digraph G { … }                               │
└────────────────────────────────────────────────┘

┌─ viz-json ─────────────────────────────────────┐
│  nodes/edges summary (кратко; полный — в -j)   │
└────────────────────────────────────────────────┘
```

При `--json` / `-j` полный `formats` в `results.visualization.data`; text-секции не печатаются (как у остальных ops).

## Правила

1. Корень проекта / scan / resolve — как [dependency-analysis.md](dependency-analysis.md).
2. **dependency-graph:** локальные рёбра + external-соседи целевого (external — листья без исходящих).
3. **import-tree:** BFS/DFS от target по imports, max depth **3** (константа S05; глубже — truncation в узле `…`).
4. **export-consumers:** файлы из `importedBy` (reverse-scan); без полного symbol-level matching (это S02 entities) — ребро file→target достаточно.
5. Подписи узлов — `pathMode`; в Mermaid/DOT экранировать кавычки/`[]`/переводы строк.
6. Ошибка парсинга **целевого** → fatal `PARSE_FAILED`.
7. Ошибка парсинга кандидата → `skipped[]`, viz продолжается.
8. Нет imports после prerequisite → `MODEL_INCOMPLETE`.
9. Инспекторы **не** знают номера `--level`; viz включается только флагами / сахарным раскрытием level→флаги в CLI.
10. Новые форматы позже: новый флаг + ключ в `formats.*`, без смены id инспектора.

## Ошибки инспектора

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет целевого |
| `UNSUPPORTED_LANGUAGE` | validation | Не JS MVP |
| `MODEL_INCOMPLETE` | configuration | Нет imports целевого |
| `PARSE_FAILED` | execution | Не разобран целевой |
| `READ_FAILED` | execution | Не прочитан целевой |
| `SCAN_FAILED` | execution | Сбой обхода корня |

## Зависимости

- [dependency-analysis.md](dependency-analysis.md)
- [import-export-analysis.md](import-export-analysis.md)
- [inspector-contract.md](../../20-architecture/inspector-contract.md)
- [s05-flags.md](../../50-cli/s05-flags.md)

## Acceptance criteria

- [ ] `-m` / `--mermaid` даёт `results.visualization` с `formats.mermaid` и тремя views
- [ ] `-gr` / `--graphviz` даёт DOT в `formats.graphviz`
- [ ] `-vj` / `--viz-json` даёт `formats.json.nodes/edges`
- [ ] Комбинация флагов наполняет только запрошенные ключи `formats`
- [ ] Не в default-all; без viz-флагов секций mermaid/graphviz/viz-json нет
- [ ] External модули не получают исходящих рёбер в dependency-graph
- [ ] Import-tree глубже 3 уровней усечён
- [ ] Parse fail кандидата → `skipped`, не падение
- [ ] Text schematic только при соответствующих флагах (и не при чистом `-j`)

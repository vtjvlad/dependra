---
title: S05 — Visualization + config (E)
status: draft
mvp: false
source: .dep/.blueprint/20-features/visualization---E, 35-configurations, metadata---U
---

# S05 — Visualization + config (E)

| Поле | Значение |
|------|----------|
| **ID** | S05 |
| **Статус** | `в работе` |
| **dependsOn** | S03 |

## Цель / границы

**Входит:**

- visualization (E): Mermaid / Graphviz / viz-json graph views
- config sugar: `--level`, profiles, файлы конфигурации сверх MVP defaults
- metadata (U): плагинные экстракторы

**Не входит:** TUI (S08), quality scores (S06), modifications (S07).

## Зависимости

Стабильный graph + diagnostics (S03). Может идти параллельно с S06. Нужен до S07 (удобный preview/отчёты).

## Источники

- Рабочие спеки (S05-A):
  - [`docs/20-features/analysis/visualization.md`](../../../docs/20-features/analysis/visualization.md)
  - [`docs/20-features/analysis/metadata.md`](../../../docs/20-features/analysis/metadata.md)
  - [`docs/35-configuration/s05-config.md`](../../../docs/35-configuration/s05-config.md)
  - [`docs/40-development/analysis-levels.md`](../../../docs/40-development/analysis-levels.md)
  - CLI: [`docs/50-cli/s05-flags.md`](../../../docs/50-cli/s05-flags.md)
- Blueprint (архив):
  - [visualization---E](../../../.dep/.blueprint/20-features/visualization---E/README.md)
  - [metadata---U](../../../.dep/.blueprint/20-features/metadata---U/README.md)
  - [`35-configurations/`](../../../.dep/.blueprint/35-configurations/README.md)

## CLI / short (сводка)

| Long | Short | Заметка |
|------|-------|---------|
| `--mermaid` | `-m` | |
| `--graphviz` | `-gr` | `-g` = graph |
| `--viz-json` | `-vj` | ≠ `--json` / `-j` |
| `--metadata` | `-me` | `-m` = mermaid |
| `--level` | `-l` | сахар 1..5 |
| `--profile` | `-pr` | |
| `--config` | `-cf` | |

Не в default-all (кроме раскрытия level/profile). Help: `operations · s05` + `config · s05`.

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S05-A | Спека viz + config + metadata | `завершено` |
| S05-B | Visualization reporters | `запланировано` |
| S05-C | Profiles / `--level` / config files | `запланировано` |
| S05-D | Metadata extractors + тесты | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S05-001 | Спека visualization в docs | высокий | S03 | `завершено` |
| S05-002 | Спека config/profiles/`--level` | высокий | S03 | `завершено` |
| S05-003 | Спека metadata extractors | средний | S03 | `завершено` |
| S05-004 | Mermaid / Graphviz / JSON viz output | высокий | S05-001 | `запланировано` |
| S05-005 | Profiles + `--level` как сахар над флагами | высокий | S05-002 | `запланировано` |
| S05-006 | Загрузка project/user config files | высокий | S05-002 | `запланировано` |
| S05-007 | Metadata provider plugins | средний | S05-003 | `запланировано` |
| S05-008 | Тесты AC + approve | высокий | S05-004…007 | `запланировано` |

## Чеклист этапа

- [x] S05-A: спеки viz, config, metadata в `docs/`
- [ ] S05-B: Mermaid/Graphviz/JSON работают
- [ ] S05-C: profiles и `--level` = композиция инспекторов
- [ ] S05-D: metadata extractors + тесты
- [ ] Exit criteria + approve

## Exit criteria

1. Viz-вывод соответствует спеке; `--level` не зашит в инспекторы.
2. Config hierarchy задокументирована и покрыта тестами happy-path.
3. Approve владельца (нужен для S07 вместе с S06).

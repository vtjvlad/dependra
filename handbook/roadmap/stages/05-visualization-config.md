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
| **Статус** | `запланировано` |
| **dependsOn** | S03 |

## Цель / границы

**Входит:**

- visualization (E): Mermaid / Graphviz / JSON graph views
- config sugar: `--level`, profiles, файлы конфигурации сверх MVP defaults
- metadata (U): плагинные экстракторы

**Не входит:** TUI (S08), quality scores (S06), modifications (S07).

## Зависимости

Стабильный graph + diagnostics (S03). Может идти параллельно с S06. Нужен до S07 (удобный preview/отчёты).

## Источники

- [visualization---E](../../../.dep/.blueprint/20-features/visualization---E/README.md)
- [metadata---U](../../../.dep/.blueprint/20-features/metadata---U/README.md)
- Blueprint `35-configurations/`; рабочий MVP: [`docs/35-configuration/overview.md`](../../../docs/35-configuration/overview.md)
- [`docs/40-development/analysis-levels.md`](../../../docs/40-development/analysis-levels.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S05-A | Спека viz + config + metadata | `запланировано` |
| S05-B | Visualization reporters | `запланировано` |
| S05-C | Profiles / `--level` / config files | `запланировано` |
| S05-D | Metadata extractors + тесты | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S05-001 | Спека visualization в docs | высокий | S03 | `запланировано` |
| S05-002 | Спека config/profiles/`--level` | высокий | S03 | `запланировано` |
| S05-003 | Спека metadata extractors | средний | S03 | `запланировано` |
| S05-004 | Mermaid / Graphviz / JSON viz output | высокий | S05-001 | `запланировано` |
| S05-005 | Profiles + `--level` как сахар над флагами | высокий | S05-002 | `запланировано` |
| S05-006 | Загрузка project/user config files | высокий | S05-002 | `запланировано` |
| S05-007 | Metadata provider plugins | средний | S05-003 | `запланировано` |
| S05-008 | Тесты AC + approve | высокий | S05-004…007 | `запланировано` |

## Чеклист этапа

- [ ] S05-A: спеки viz, config, metadata в `docs/`
- [ ] S05-B: Mermaid/Graphviz/JSON работают
- [ ] S05-C: profiles и `--level` = композиция инспекторов
- [ ] S05-D: metadata extractors + тесты
- [ ] Exit criteria + approve

## Exit criteria

1. Viz-вывод соответствует спеке; `--level` не зашит в инспекторы.
2. Config hierarchy задокументирована и покрыта тестами happy-path.
3. Approve владельца (нужен для S07 вместе с S06).

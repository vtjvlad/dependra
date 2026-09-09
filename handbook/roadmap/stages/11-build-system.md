---
title: S11 — Build System
status: draft
mvp: false
source: .dep/.blueprint/15-build-system
---

# S11 — Build System

| Поле | Значение |
|------|----------|
| **ID** | S11 |
| **Статус** | `запланировано` |
| **dependsOn** | S10 |

## Цель / границы

**Входит:** воспроизводимая сборка и проверка (Clean → Release Bundle); граф задач / зависимостей пакетов; инкрементальная и модульная сборка; профили; артефакты; CI/CD; release / publish policy; локальный development workflow.

**Не входит:** преждевременная оркестрация до появления multi-package layout (см. S10); продуктовые фичи анализа/TUI.

## Зависимости

После S10: есть реальное разбиение `apps/` / `packages/` (или явное решение «остаёмся single-package» с минимальным pipeline). Старт только при approve нужды в полной build-системе.

## Источники

- [`.dep/.blueprint/15-build-system/`](../../../.dep/.blueprint/15-build-system/README.md)
- Stub → спека: [`docs/15-build-system/README.md`](../../../docs/15-build-system/README.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S11-A | Спека pipeline + task system | `запланировано` |
| S11-B | Incremental / module build + profiles | `запланировано` |
| S11-C | CI / artifacts / release | `запланировано` |
| S11-D | Verification + approve | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S11-001 | Спека build stages (Clean → Release Bundle) в docs | высокий | S10 | `запланировано` |
| S11-002 | Спека build-graph / task-system / build-profiles | высокий | S11-001 | `запланировано` |
| S11-003 | Incremental + module-build по спеке | высокий | S11-002 | `запланировано` |
| S11-004 | CI: lint / test / package / artifacts | высокий | S11-001, S10 | `запланировано` |
| S11-005 | Artifact generation + package verification | высокий | S11-004 | `запланировано` |
| S11-006 | Release bundle + versioning / publish policy | средний | S11-005 | `запланировано` |
| S11-007 | Development workflow в docs | средний | S11-002 | `запланировано` |
| S11-008 | Verification checklist + approve | высокий | S11-006, S11-007 | `запланировано` |

## Чеклист этапа

- [ ] S11-A: спека stages, graph, tasks, profiles в `docs/15-build-system/`
- [ ] S11-B: incremental / module-build работают на реальном layout
- [ ] S11-C: CI, artifacts, release policy
- [ ] S11-D: verification + approve
- [ ] Exit criteria выполнены

## Exit criteria

1. Clone → bootstrap → build → test → package воспроизводим по docs.
2. Порядок стадий сборки обязателен и задокументирован.
3. Владелец утвердил release policy и закрытие этапа (или следующий цикл roadmap).

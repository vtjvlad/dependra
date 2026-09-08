---
title: S10 — Platform / monorepo / releases
status: draft
mvp: false
source: .dep/.blueprint/15-build-system
---

# S10 — Platform / monorepo / releases

| Поле | Значение |
|------|----------|
| **ID** | S10 |
| **Статус** | `запланировано` |
| **dependsOn** | S09 |

## Цель / границы

**Входит:** разбиение на `apps/` + `packages/` + inspectors по реальной нужде; build/test/release pipeline; reproducible artifacts.

**Не входит:** преждевременный monorepo «на будущее» до появления multi-package необходимости (см. minimal-implementation).

## Зависимости

После S09, когда есть cli / core / несколько language inspectors. Старт только при approve «нужен monorepo».

## Источники

- [`.dep/.blueprint/15-build-system/`](../../../.dep/.blueprint/15-build-system/README.md)
- Stub: [`docs/15-build-system/README.md`](../../../docs/15-build-system/README.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S10-A | Спека layout + pipeline | `запланировано` |
| S10-B | Разбиение пакетов | `запланировано` |
| S10-C | CI / artifacts / release | `запланировано` |
| S10-D | Verification + approve | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S10-001 | Approve: monorepo действительно нужен | высокий | S09 | `запланировано` |
| S10-002 | Спека apps/packages/inspectors layout в docs | высокий | S10-001 | `запланировано` |
| S10-003 | Спека build stages (clean→release) | высокий | S10-001 | `запланировано` |
| S10-004 | Выделить packages (core, config, reporter, …) | высокий | S10-002 | `запланировано` |
| S10-005 | apps/cli (+ при необходимости daemon) | высокий | S10-004 | `запланировано` |
| S10-006 | CI: lint/test/package/artifacts | высокий | S10-003, S10-005 | `запланировано` |
| S10-007 | Release bundle + versioning policy | средний | S10-006 | `запланировано` |
| S10-008 | Verification checklist + approve | высокий | S10-007 | `запланировано` |

## Чеклист этапа

- [ ] S10-A: спека layout и pipeline; явный approve нужды
- [ ] S10-B: packages/apps выделены без мёртвых пустых пакетов
- [ ] S10-C: CI и artifacts
- [ ] S10-D: verification + approve
- [ ] Exit criteria выполнены

## Exit criteria

1. Clone → bootstrap → build → test воспроизводим по docs.
2. Нет пустых пакетов «на будущее».
3. Владелец утвердил release policy и закрытие этапа (или следующий цикл roadmap).

---
title: S10 — Platform / monorepo
status: draft
mvp: false
source: .dep/.blueprint/15-build-system/monorepo-structure.md, monorepo.md
---

# S10 — Platform / monorepo

| Поле | Значение |
|------|----------|
| **ID** | S10 |
| **Статус** | `запланировано` |
| **dependsOn** | S09 |

## Цель / границы

**Входит:** решение о monorepo по реальной нужде; layout `apps/` + `packages/` (+ inspectors); выделение пакетов без пустых «на будущее».

**Не входит:** полная build-система / CI / release pipeline — это **[S11](11-build-system.md)** после закрытия S10.

## Зависимости

После S09, когда есть cli / core / несколько language inspectors. Старт только при approve «нужен monorepo» (или явное «single-package → сразу минимальный S11»).

## Источники

- Blueprint: [`.dep/.blueprint/15-build-system/monorepo-structure.md`](../../../.dep/.blueprint/15-build-system/monorepo-structure.md), [`monorepo.md`](../../../.dep/.blueprint/15-build-system/monorepo.md)
- Stub build-system (S11): [`docs/15-build-system/README.md`](../../../docs/15-build-system/README.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S10-A | Спека / решение layout | `запланировано` |
| S10-B | Разбиение пакетов | `запланировано` |
| S10-C | Verification + approve → S11 | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S10-001 | Approve: monorepo действительно нужен | высокий | S09 | `запланировано` |
| S10-002 | Спека apps/packages/inspectors layout в docs | высокий | S10-001 | `запланировано` |
| S10-003 | Выделить packages (core, config, reporter, …) | высокий | S10-002 | `запланировано` |
| S10-004 | apps/cli (+ при необходимости daemon) | высокий | S10-003 | `запланировано` |
| S10-005 | Verification checklist + approve → S11 | высокий | S10-004 | `запланировано` |

## Чеклист этапа

- [ ] S10-A: спека layout; явный approve нужды
- [ ] S10-B: packages/apps выделены без мёртвых пустых пакетов
- [ ] S10-C: verification + approve → S11
- [ ] Exit criteria выполнены

## Exit criteria

1. Layout задокументирован; нет пустых пакетов «на будущее».
2. Пакеты собираются хотя бы минимальным способом, достаточным для старта S11.
3. Владелец утвердил закрытие S10 → переход к Build System (S11).

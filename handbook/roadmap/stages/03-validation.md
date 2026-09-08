---
title: S03 — Validation (D)
status: draft
mvp: false
source: .dep/.blueprint/20-features/validation---D
---

# S03 — Validation (D)

| Поле | Значение |
|------|----------|
| **ID** | S03 |
| **Статус** | `запланировано` |
| **dependsOn** | S02 |

## Цель / границы

**Входит:** проверка корректности — циклы зависимостей, unused imports/exports, broken imports, ошибки path resolution; diagnostics в reporters.

**Не входит:** автофикс (S07), quality metrics (S06), visualization (S05).

## Зависимости

Нужен стабильный import graph (S01 + углубление S02). Блокирует безопасный S07; открывает S05/S06.

## Источники

- Blueprint: [`.dep/.blueprint/20-features/validation---D/`](../../../.dep/.blueprint/20-features/validation---D/README.md)
- Promote → `docs/20-features/analysis/validation.md` (создать при старте этапа)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S03-A | Спека validation | `запланировано` |
| S03-B | Инспектор validation | `запланировано` |
| S03-C | Diagnostics в reporters | `запланировано` |
| S03-D | Тесты + approve | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S03-001 | Спека validation в docs | высокий | S02 | `запланировано` |
| S03-002 | Инспектор: cycles | высокий | S03-001 | `запланировано` |
| S03-003 | Инспектор: unused imports/exports | высокий | S03-001 | `запланировано` |
| S03-004 | Инспектор: broken imports / path errors | высокий | S03-001 | `запланировано` |
| S03-005 | Секции diagnostics в text/JSON reporters | высокий | S03-002…004 | `запланировано` |
| S03-006 | Фикстуры и тесты AC | высокий | S03-005 | `запланировано` |
| S03-007 | Approve владельца | средний | S03-006 | `запланировано` |

## Чеклист этапа

- [ ] S03-A: спека validation в `docs/`
- [ ] S03-B: cycles / unused / broken imports
- [ ] S03-C: diagnostics в reporters
- [ ] S03-D: тесты AC
- [ ] Exit criteria + approve

## Exit criteria

1. CLI/JSON отдают validation diagnostics по AC спеки.
2. Ложные срабатывания на фикстурах в допустимых пределах спеки.
3. Approve → можно стартовать S05/S06.

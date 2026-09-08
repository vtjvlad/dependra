---
title: S04 — Environment / runtime (P+U)
status: draft
mvp: false
source: .dep/.blueprint/20-features (P/U clusters)
---

# S04 — Environment / runtime (P+U)

| Поле | Значение |
|------|----------|
| **ID** | S04 |
| **Статус** | `запланировано` |
| **dependsOn** | S02 |

## Цель / границы

**Входит (P):** file-environment-analysis, commands, environment-validation.  
**Входит (U):** runtime-dependency-analysis, file-operations (I/O analysis).

**Не входит:** установка пакетов/модификация FS (S07), monorepo build (S10).

## Зависимости

После S02 (достаточно модели файла). Может идти **параллельно** с S03.

## Источники

- [file-environment-analysis---P](../../../.dep/.blueprint/20-features/file-environment-analysis---P/README.md)
- [commands---P](../../../.dep/.blueprint/20-features/commands---P/README.md)
- [environment-validation---P](../../../.dep/.blueprint/20-features/environment-validation---P/README.md)
- [runtime-dependency-analysis---U](../../../.dep/.blueprint/20-features/runtime-dependency-analysis---U/README.md)
- [file-operations---U](../../../.dep/.blueprint/20-features/file-operations---U/README.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S04-A | Спека кластеров P и U | `запланировано` |
| S04-B | Инспекторы P | `запланировано` |
| S04-C | Инспекторы U | `запланировано` |
| S04-D | CLI / тесты / approve | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S04-001 | Спека P-кластера в docs | высокий | S02 | `запланировано` |
| S04-002 | Спека U-кластера в docs | высокий | S02 | `запланировано` |
| S04-003 | Инспектор file-environment | высокий | S04-001 | `запланировано` |
| S04-004 | Инспектор commands | средний | S04-001 | `запланировано` |
| S04-005 | Инспектор environment-validation | высокий | S04-001 | `запланировано` |
| S04-006 | Инспектор runtime-dependency-analysis | высокий | S04-002 | `запланировано` |
| S04-007 | Инспектор file-operations (I/O) | средний | S04-002 | `запланировано` |
| S04-008 | CLI флаги + reporters | высокий | S04-003…007 | `запланировано` |
| S04-009 | Фикстуры и тесты AC | высокий | S04-008 | `запланировано` |
| S04-010 | Approve владельца | средний | S04-009 | `запланировано` |

## Чеклист этапа

- [ ] S04-A: спеки P и U в `docs/`
- [ ] S04-B: environment / commands / env-validation
- [ ] S04-C: runtime deps / file I/O ops
- [ ] S04-D: CLI, тесты, approve
- [ ] Exit criteria выполнены

## Exit criteria

1. P- и U-операции доступны флагами CLI и в JSON.
2. Нет скрытых мутаций окружения (только анализ).
3. Approve владельца.

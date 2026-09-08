---
title: S06 — Quality + AI explain (F+I)
status: draft
mvp: false
source: .dep/.blueprint/20-features/code-quality-analysis---F, 10-technology/60-artificial-intelligence
---

# S06 — Quality + AI explain (F+I)

| Поле | Значение |
|------|----------|
| **ID** | S06 |
| **Статус** | `запланировано` |
| **dependsOn** | S03 |

## Цель / границы

**Входит:**

- code-quality-analysis (F): метрики/сигналы качества (комменты, unused vars, duplication, suspicious constructs)
- AI (I): опциональные объяснения/рекомендации через provider adapter

**Не входит:** AI-модификации файлов (S07); обязательная зависимость ядра от AI (запрещена).

## Зависимости

После S03 (validation signals полезны). Параллельно с S05. Вместе с S05 открывает S07.

## Источники

- [code-quality-analysis---F](../../../.dep/.blueprint/20-features/code-quality-analysis---F/README.md)
- [60-artificial-intelligence](../../../.dep/.blueprint/10-technology/60-artificial-intelligence/README.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S06-A | Спека quality (+ AI explain) | `запланировано` |
| S06-B | Инспектор code-quality | `запланировано` |
| S06-C | AI provider adapter (optional) | `запланировано` |
| S06-D | CLI / тесты / approve | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S06-001 | Спека code-quality в docs | высокий | S03 | `запланировано` |
| S06-002 | Спека AI explain (optional, non-blocking) | средний | S03 | `запланировано` |
| S06-003 | Инспектор code-quality-analysis | высокий | S06-001 | `запланировано` |
| S06-004 | Reporter-секции quality | высокий | S06-003 | `запланировано` |
| S06-005 | AI provider adapter + флаг включения | средний | S06-002, S06-003 | `запланировано` |
| S06-006 | Тесты: quality без AI; AI mock/off | высокий | S06-004, S06-005 | `запланировано` |
| S06-007 | Approve владельца | средний | S06-006 | `запланировано` |

## Чеклист этапа

- [ ] S06-A: спеки quality и AI explain в `docs/`
- [ ] S06-B: инспектор quality + reporter
- [ ] S06-C: AI adapter optional; ядро работает offline
- [ ] S06-D: тесты AC + approve
- [ ] Exit criteria выполнены

## Exit criteria

1. Quality-анализ работает без сети и без AI.
2. AI explain отключается и не ломает pipeline.
3. Approve (вместе с S05 → S07).

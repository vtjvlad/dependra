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
| **Статус** | `завершено` |
| **dependsOn** | S03 |

## Цель / границы

**Входит:**

- code-quality-analysis (F): метрики/сигналы качества (комменты, unused locals, duplication, suspicious constructs)
- AI (I): опциональные объяснения/рекомендации через provider adapter

**Не входит:** AI-модификации файлов (S07); обязательная зависимость ядра от AI (запрещена).

## Зависимости

После S03 (validation signals полезны). Параллельно с S05. Вместе с S05 открывает S07.

## Источники

- Рабочие спеки (S06-A, accepted):
  - [`docs/20-features/analysis/code-quality-analysis.md`](../../../docs/20-features/analysis/code-quality-analysis.md)
  - [`docs/20-features/analysis/ai-explain.md`](../../../docs/20-features/analysis/ai-explain.md)
  - CLI: [`docs/50-cli/s06-flags.md`](../../../docs/50-cli/s06-flags.md)
  - Levels: [`docs/40-development/analysis-levels.md`](../../../docs/40-development/analysis-levels.md) (`quality` в level 4)
  - Config `[ai]`: [`docs/35-configuration/s05-config.md`](../../../docs/35-configuration/s05-config.md)
- Blueprint (архив):
  - [code-quality-analysis---F](../../../.dep/.blueprint/20-features/code-quality-analysis---F/README.md)
  - [60-artificial-intelligence](../../../.dep/.blueprint/10-technology/60-artificial-intelligence/README.md)

## CLI / short (сводка)

| Long | Short | Заметка |
|------|-------|---------|
| `--quality` | `-q` | offline metrics + findings |
| `--explain` | `-ex` | AI; OR-включает quality; нужен `ai.enabled` + key |

Не в default-all. Help: `operations · s06`.

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S06-A | Спека quality (+ AI explain) | `завершено` (accepted) |
| S06-B | Инспектор code-quality | `завершено` |
| S06-C | AI provider adapter (optional) | `завершено` |
| S06-D | CLI / тесты / approve | `завершено` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S06-001 | Спека code-quality в docs | высокий | S03 | `завершено` |
| S06-002 | Спека AI explain (optional, non-blocking) | средний | S03 | `завершено` |
| S06-003 | Инспектор code-quality-analysis | высокий | S06-001 | `завершено` |
| S06-004 | Reporter-секции quality | высокий | S06-003 | `завершено` |
| S06-005 | AI provider adapter + флаг включения | средний | S06-002, S06-003 | `завершено` |
| S06-006 | Тесты: quality без AI; AI mock/off | высокий | S06-004, S06-005 | `завершено` |
| S06-007 | Approve владельца | средний | S06-006 | `завершено` |

## Чеклист этапа

- [x] S06-A: спеки quality и AI explain в `docs/`
- [x] S06-B: инспектор quality + reporter
- [x] S06-C: AI adapter optional; ядро работает offline
- [x] S06-D: тесты AC + approve
- [x] Exit criteria выполнены

## Exit criteria

1. Quality-анализ работает без сети и без AI. — **сделано**
2. AI explain отключается и не ломает pipeline. — **сделано**
3. Approve (вместе с S05 → S07). — **сделано**

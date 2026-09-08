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
| **Статус** | `в работе` |
| **dependsOn** | S02 |

## Цель / границы

**Входит (P):** file-environment-analysis, commands, environment-validation.  
**Входит (U):** runtime-dependency-analysis, file-operations (I/O analysis).

**Не входит:** установка пакетов/модификация FS (S07), monorepo build (S10).

## Зависимости

После S02 (достаточно модели файла). Может идти **параллельно** с S03.

## Источники

- Рабочие спеки (S04-A):
  - P: [`file-environment-analysis.md`](../../../docs/20-features/analysis/file-environment-analysis.md), [`commands.md`](../../../docs/20-features/analysis/commands.md), [`environment-validation.md`](../../../docs/20-features/analysis/environment-validation.md)
  - U: [`runtime-dependency-analysis.md`](../../../docs/20-features/analysis/runtime-dependency-analysis.md), [`file-operations.md`](../../../docs/20-features/analysis/file-operations.md)
  - CLI: [`docs/50-cli/s04-flags.md`](../../../docs/50-cli/s04-flags.md)
- Blueprint (архив): см. `.dep/.blueprint/20-features/*---P|U`

## CLI / short (сводка)

| Long | Short | Секция |
|------|-------|--------|
| `--environment` | `-env` | environment |
| `--commands` | `-c` | commands |
| `--env-check` | `-ec` | env-check |
| `--runtime` | `-r` | runtime |
| `--io` | `-io` | io |

Не в default-all. Help: `operations · s04`. Только анализ (без install/мутаций).

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S04-A | Спека кластеров P и U | `завершено` |
| S04-B | Инспекторы P | `завершено` |
| S04-C | Инспекторы U | `завершено` |
| S04-D | CLI / тесты / approve | `в работе` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S04-001 | Спека P-кластера в docs | высокий | S02 | `завершено` |
| S04-002 | Спека U-кластера в docs | высокий | S02 | `завершено` |
| S04-003 | Инспектор file-environment | высокий | S04-001 | `завершено` |
| S04-004 | Инспектор commands | средний | S04-001 | `завершено` |
| S04-005 | Инспектор environment-validation | высокий | S04-001 | `завершено` |
| S04-006 | Инспектор runtime-dependency-analysis | высокий | S04-002 | `завершено` |
| S04-007 | Инспектор file-operations (I/O) | средний | S04-002 | `завершено` |
| S04-008 | CLI флаги + reporters | высокий | S04-003…007 | `завершено` |
| S04-009 | Фикстуры и тесты AC | высокий | S04-008 | `завершено` |
| S04-010 | Approve владельца | средний | S04-009 | `запланировано` |

## Чеклист этапа

- [x] S04-A: спеки P и U + s04-flags в `docs/`
- [x] S04-B: environment / commands / env-validation
- [x] S04-C: runtime deps / file I/O ops
- [x] S04-D: CLI, тесты AC
- [ ] Exit criteria + approve

## Exit criteria

1. P- и U-операции доступны флагами CLI и в JSON.
2. Нет скрытых мутаций окружения (только анализ).
3. Approve владельца.

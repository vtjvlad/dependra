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
| **Статус** | `завершено` |
| **dependsOn** | S02 |

## Цель / границы

**Входит:** проверка корректности — циклы зависимостей, unused imports/exports, broken imports, ошибки path resolution; diagnostics в reporters.

**Не входит:** автофикс (S07), quality metrics (S06), visualization (S05).

## Зависимости

Нужен стабильный import graph (S01 + углубление S02). Блокирует безопасный S07; открывает S05/S06.

## Источники

- Рабочая спека (S03-A):
  - [`docs/20-features/analysis/validation.md`](../../../docs/20-features/analysis/validation.md)
  - [`docs/50-cli/s03-flags.md`](../../../docs/50-cli/s03-flags.md) — long/short, help, schematic
  - Short-алгоритм (общий): [`docs/50-cli/interface.md`](../../../docs/50-cli/interface.md#короткие-флаги)
- Blueprint (архив): [`.dep/.blueprint/20-features/validation---D/`](../../../.dep/.blueprint/20-features/validation---D/README.md)

## CLI / short (сводка)

| Long | Short | Заметка |
|------|-------|---------|
| `--validate` | `-va` | `-v` = version → вторая буква |

Не в default-all. Text-секция: **diagnostics**. Help: `operations · s03`.

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S03-A | Спека validation | `завершено` |
| S03-B | Инспектор validation | `завершено` |
| S03-C | Diagnostics в reporters | `завершено` |
| S03-D | Тесты + approve | `завершено` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S03-001 | Спека validation в docs | высокий | S02 | `завершено` |
| S03-002 | Инспектор: cycles | высокий | S03-001 | `завершено` |
| S03-003 | Инспектор: unused imports/exports | высокий | S03-001 | `завершено` |
| S03-004 | Инспектор: broken imports / path errors | высокий | S03-001 | `завершено` |
| S03-005 | Секции diagnostics в text/JSON reporters | высокий | S03-002…004 | `завершено` |
| S03-006 | Фикстуры и тесты AC | высокий | S03-005 | `завершено` |
| S03-007 | Approve владельца | средний | S03-006 | `завершено` |

## Чеклист этапа

- [x] S03-A: спека validation + s03-flags в `docs/`
- [x] S03-B: cycles / unused / broken imports
- [x] S03-C: diagnostics в reporters
- [x] S03-D: тесты AC
- [x] Exit criteria + approve

## Exit criteria

1. CLI/JSON отдают validation diagnostics по AC спеки.
2. Ложные срабатывания на фикстурах в допустимых пределах спеки.
3. Approve → можно стартовать S05/S06. — **сделано**

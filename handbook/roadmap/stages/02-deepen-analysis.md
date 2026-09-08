---
title: S02 — Углубление анализа B/M
status: draft
mvp: false
source: .dep/.blueprint/20-features/additional-file-information---B, exported-entities---M
---

# S02 — Углубление анализа B/M

| Поле | Значение |
|------|----------|
| **ID** | S02 |
| **Статус** | `завершено` |
| **dependsOn** | S01 |

## Цель / границы

**Входит:**

- additional-file-information (B): abs/rel paths, permissions, copy detection
- exported-entities глубже MVP (M): функции/классы/переменные/типы с path modes

**Не входит:** validation (S03), env/runtime (S04), viz (S05), quality (S06), modifications (S07).

## Зависимости

Требует закрытый S01 (парсер, модель, reporters). Открывает S03 и S04.

## Источники

- Рабочая спека (S02-A):
  - [`docs/20-features/analysis/additional-file-information.md`](../../../docs/20-features/analysis/additional-file-information.md)
  - [`docs/20-features/analysis/exported-entities.md`](../../../docs/20-features/analysis/exported-entities.md)
  - [`docs/50-cli/s02-flags.md`](../../../docs/50-cli/s02-flags.md) — long/short, help, schematic
  - Short-алгоритм (общий с S01): [`docs/50-cli/interface.md`](../../../docs/50-cli/interface.md#короткие-флаги)
- Blueprint (архив): [`.dep/.blueprint/20-features/additional-file-information---B/`](../../../.dep/.blueprint/20-features/additional-file-information---B/README.md)
- Blueprint (архив): [`.dep/.blueprint/20-features/exported-entities---M/`](../../../.dep/.blueprint/20-features/exported-entities---M/README.md)

## CLI / short (сводка)

| Long | Short | Заметка |
|------|-------|---------|
| `--additional` | `-a` | `a` свободна |
| `--entities` | `-en` | `-e` = exports (S01); вторая буква |

Не в default-all. Оформление help/text — schematic, как S01 (`operations · s02`, секции `additional` / `entities`).

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S02-A | Спека в `docs/` | `завершено` |
| S02-B | Инспекторы + модель | `завершено` |
| S02-C | CLI / reporters | `завершено` |
| S02-D | Тесты + стабилизация | `завершено` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S02-001 | Спека additional-file-information в docs | высокий | S01 | `завершено` |
| S02-002 | Спека exported-entities (deep) в docs | высокий | S01 | `завершено` |
| S02-003 | Инспектор / расширение basic → additional fields | высокий | S02-001 | `завершено` |
| S02-004 | Инспектор exported-entities | высокий | S02-002, parsers S01 | `завершено` |
| S02-005 | CLI флаги и секции отчёта (`-a`, `-en`, schematic) | высокий | S02-003, S02-004 | `завершено` |
| S02-006 | Фикстуры и тесты AC | высокий | S02-005 | `завершено` |
| S02-007 | Approve владельца → S03/S04 | средний | S02-006 | `завершено` |

## Чеклист этапа

- [x] S02-A: спеки additional + exported-entities + s02-flags в `docs/` (шаблон)
- [x] S02-B: инспекторы реализованы, модель расширена
- [x] S02-C: CLI/reporters отдают новые секции (`-a`, `-en`, schematic)
- [x] S02-D: тесты AC зелёные
- [x] Exit criteria + approve владельца (S02-007)

## Exit criteria

1. Additional file fields и deep exported entities доступны через CLI/JSON.
2. Спека в `docs/` не только в blueprint.
3. Approve на старт S03 и/или S04.

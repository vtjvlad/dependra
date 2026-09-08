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
| **Статус** | `в работе` |
| **dependsOn** | S01 |

## Цель / границы

**Входит:**

- additional-file-information (B): abs/rel paths, permissions, copy detection
- exported-entities глубже MVP (M): функции/классы/переменные/типы с path modes

**Не входит:** validation (S03), env/runtime (S04), viz (S05), quality (S06), modifications (S07).

## Зависимости

Требует закрытый S01 (парсер, модель, reporters). Открывает S03 и S04.

## Источники

- Blueprint: [`.dep/.blueprint/20-features/additional-file-information---B/`](../../../.dep/.blueprint/20-features/additional-file-information---B/README.md)
- Blueprint: [`.dep/.blueprint/20-features/exported-entities---M/`](../../../.dep/.blueprint/20-features/exported-entities---M/README.md)
- Promote в `docs/20-features/analysis/` по [`_template.md`](../../../docs/_template.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S02-A | Спека в `docs/` | `в работе` |
| S02-B | Инспекторы + модель | `запланировано` |
| S02-C | CLI / reporters | `запланировано` |
| S02-D | Тесты + стабилизация | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S02-001 | Спека additional-file-information в docs | высокий | S01 | `запланировано` |
| S02-002 | Спека exported-entities (deep) в docs | высокий | S01 | `запланировано` |
| S02-003 | Инспектор / расширение basic → additional fields | высокий | S02-001 | `запланировано` |
| S02-004 | Инспектор exported-entities | высокий | S02-002, parsers S01 | `запланировано` |
| S02-005 | CLI флаги и секции отчёта | высокий | S02-003, S02-004 | `запланировано` |
| S02-006 | Фикстуры и тесты AC | высокий | S02-005 | `запланировано` |
| S02-007 | Approve владельца → S03/S04 | средний | S02-006 | `запланировано` |

## Чеклист этапа

- [ ] S02-A: спеки additional + exported-entities в `docs/` (шаблон)
- [ ] S02-B: инспекторы реализованы, модель расширена
- [ ] S02-C: CLI/reporters отдают новые секции
- [ ] S02-D: тесты AC зелёные
- [ ] Exit criteria + approve владельца

## Exit criteria

1. Additional file fields и deep exported entities доступны через CLI/JSON.
2. Спека в `docs/` не только в blueprint.
3. Approve на старт S03 и/или S04.

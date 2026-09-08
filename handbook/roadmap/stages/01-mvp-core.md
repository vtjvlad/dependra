---
title: S01 — MVP core
status: draft
mvp: true
source: .dep/.blueprint/80-roadmap, docs/20-features/mvp-scope.md
---

# S01 — MVP core

| Поле | Значение |
|------|----------|
| **ID** | S01 |
| **Статус** | `в работе` |
| **dependsOn** | — |
| **Версия** | `0.0.1` (не повышать) |

## Цель / границы

**Входит:** один JS-файл (ESM/CJS); basic + imports/exports + graph; минимальный CLI + JSON; каркас core + контракт инспектора.

**Не входит:** всё из [deferred](../../../docs/20-features/deferred/README.md) (TUI, modifications, validation D, quality, viz, multi-lang, monorepo, `--level`).

## Зависимости

Нет предыдущих этапов. Блокирует S02+.

## Источники

- [`docs/20-features/mvp-scope.md`](../../../docs/20-features/mvp-scope.md)
- [`docs/50-cli/interface.md`](../../../docs/50-cli/interface.md)
- [`docs/20-architecture/`](../../../docs/20-architecture/overview.md)
- Детальный backlog: [`../mvp-backlog.md`](../mvp-backlog.md)

## Подэтапы

| ID | Название | Статус | Задачи |
|----|----------|--------|--------|
| S01-A | Спека | `завершено` | MVP-001 |
| S01-B | Каркас + ADR парсера | `в работе` | MVP-002, MVP-003, MVP-004 |
| S01-C | Инспекторы + reporters + CLI | `запланировано` | MVP-005…010 |
| S01-D | Стабилизация | `запланировано` | MVP-011 |

## Задачи

Полная таблица и статусы — в [`mvp-backlog.md`](../mvp-backlog.md) (`MVP-001`…`011`). Не переименовывать ID.

Кратко:

| ID | Название | dependsOn |
|----|----------|-----------|
| MVP-001 | Утвердить спеку `docs/` + `handbook/` | — |
| MVP-002 | Каркас `src/` | MVP-001 |
| MVP-003 | ADR: JS AST-парсер | MVP-001 |
| MVP-004 | `parsers` + SourceFile | MVP-002, MVP-003 |
| MVP-005 | basic-file-information | MVP-002 |
| MVP-006 | import-export-analysis | MVP-004 |
| MVP-007 | dependency-analysis | MVP-006 |
| MVP-008 | Reporters text + json | MVP-005…007 |
| MVP-009 | CLI флаги + pipeline + exit codes | MVP-005…008 |
| MVP-010 | Фикстуры и тесты AC | MVP-009 |
| MVP-011 | Обновить handbook/context | MVP-010 |

## Чеклист этапа

- [x] S01-A: ключевые docs в `review`/`accepted` (MVP-001)
- [ ] S01-B: каркас `src/`, ADR парсера, parsers (MVP-002…004)
- [ ] S01-C: три инспектора, reporters, CLI pipeline (MVP-005…009)
- [ ] S01-C: фикстуры и тесты AC (MVP-010)
- [ ] S01-D: context обновлён (MVP-011)
- [ ] Exit criteria выполнены, approve владельца на переход к S02

## Exit criteria

1. CLI анализирует один JS-файл: `--basic`, `--imports`, `--exports`, `--graph`, `--json`.
2. Реализация не тянет deferred-фичи.
3. AC из MVP-доков закрыты тестами на фикстурах.
4. Владелец подтвердил закрытие S01.

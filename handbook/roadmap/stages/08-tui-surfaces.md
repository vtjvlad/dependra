---
title: S08 — TUI и поверхности
status: draft
mvp: false
source: .dep/.blueprint/50-user/tui
---

# S08 — TUI и поверхности

| Поле | Значение |
|------|----------|
| **ID** | S08 |
| **Статус** | `запланировано` |
| **dependsOn** | S07 |

## Цель / границы

**Входит:**

- TUI над стабильным public core API (навигация, результаты, операции, configurator, save/presentation)
- Контракты future surfaces: Web UI, REST API, Node library, IDE plugins — **каркас/контракт**, не полная реализация всех UI

**Не входит:** полноценный Web/Desktop IDE client; monorepo packaging (S10); Build System (S11).

## Зависимости

После S07 (API покрывает analysis + safe mods). Открывает S09.

## Источники

- [`.dep/.blueprint/50-user/tui/`](../../../.dep/.blueprint/50-user/tui/README.md)
- CLI база: [`docs/50-cli/`](../../../docs/50-cli/interface.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S08-A | Спека TUI + public API surface | `запланировано` |
| S08-B | TUI MVP | `запланировано` |
| S08-C | Контракты future surfaces | `запланировано` |
| S08-D | Тесты / smoke / approve | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S08-001 | Спека TUI в docs | высокий | S07 | `запланировано` |
| S08-002 | Зафиксировать public core API для UI | высокий | S08-001 | `запланировано` |
| S08-003 | TUI: просмотр результатов analysis | высокий | S08-002 | `запланировано` |
| S08-004 | TUI: запуск ops + configurator | высокий | S08-003 | `запланировано` |
| S08-005 | TUI: save / presentation результатов | средний | S08-003 | `запланировано` |
| S08-006 | Контракты REST / library / IDE hook (docs + stubs) | средний | S08-002 | `запланировано` |
| S08-007 | Smoke-тесты TUI + approve | высокий | S08-004…006 | `запланировано` |

## Чеклист этапа

- [ ] S08-A: спека TUI и public API в `docs/`
- [ ] S08-B: TUI MVP (results + ops + configurator)
- [ ] S08-C: контракты future surfaces задокументированы
- [ ] S08-D: smoke + approve
- [ ] Exit criteria выполнены

## Exit criteria

1. TUI использует только public API (не внутренности инспекторов).
2. Future surfaces описаны контрактами без обязательной полной реализации.
3. Approve → S09.

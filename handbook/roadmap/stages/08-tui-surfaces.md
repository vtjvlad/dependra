---
title: S08 — TUI и поверхности
status: accepted
mvp: false
source: .dep/.blueprint/50-user/tui
---

# S08 — TUI и поверхности

| Поле | Значение |
|------|----------|
| **ID** | S08 |
| **Статус** | `завершено` |
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
- Рабочая спека: [`docs/50-tui/`](../../../docs/50-tui/overview.md)
- Public API: [`docs/20-architecture/public-api.md`](../../../docs/20-architecture/public-api.md)
- CLI: [`docs/50-cli/s08-flags.md`](../../../docs/50-cli/s08-flags.md)

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S08-A | Спека TUI + public API surface | `завершено` |
| S08-B | TUI MVP | `завершено` |
| S08-C | Контракты future surfaces | `завершено` |
| S08-D | Тесты / smoke / approve | `завершено` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S08-001 | Спека TUI в docs | высокий | S07 | `завершено` |
| S08-002 | Зафиксировать public core API для UI | высокий | S08-001 | `завершено` |
| S08-003 | TUI: просмотр результатов analysis | высокий | S08-002 | `завершено` |
| S08-004 | TUI: запуск ops + configurator | высокий | S08-003 | `завершено` |
| S08-005 | TUI: save / presentation результатов | средний | S08-003 | `завершено` |
| S08-006 | Контракты REST / library / IDE hook (docs + stubs) | средний | S08-002 | `завершено` |
| S08-007 | Smoke-тесты TUI + approve | высокий | S08-004…006 | `завершено` |

## Чеклист этапа

- [x] S08-A: спека TUI и public API в `docs/`
- [x] S08-B: TUI MVP (results + ops + configurator)
- [x] S08-C: контракты future surfaces задокументированы
- [x] S08-D: smoke + approve
- [x] Exit criteria выполнены

## Реализация (факт)

```
src/api/          public facade (analyze, formatText, config R/W, listOperations)
src/tui/          neo-blessed TUI
  bridge.js       только src/api
  screens/        file tree (Devicons)
  popups/         inspector-picker, text-result, settings (+ config-schema)
  theme.js        цветовые схемы
  mouse.js        wheel / hover
docs/50-tui/      UX + future surfaces
docs/20-architecture/public-api.md
docs/50-cli/s08-flags.md
tests/s08-*.test.js
```

Entrypoint: `dependra --tui` | `-t` | `tui`. Версия пакета: `0.0.47` (без bump).

Доработки после MVP-каркаса (в рамках S08): мышь/свайп, дерево+Devicons, configurator по блокам с описаниями, набор цветовых схем.

## Exit criteria

1. TUI использует только public API (не внутренности инспекторов). — **сделано** (`src/tui/bridge.js` → `src/api`)
2. Future surfaces описаны контрактами без обязательной полной реализации. — **сделано**
3. Approve → S09. — **сделано** (закрыто владельцем)

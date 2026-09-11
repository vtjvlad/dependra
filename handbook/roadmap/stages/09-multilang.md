---
title: S09 — Multi-language + LSP/Tree-sitter
status: draft
mvp: false
source: .dep/.blueprint/10-technology, 30-architecture, 99-terminology/language-backend
---

# S09 — Multi-language + LSP/Tree-sitter

| Поле | Значение |
|------|----------|
| **ID** | S09 |
| **Статус** | `в работе` (S09-B/C stubs/D тесты готовы → approve этапа) |
| **dependsOn** | S08 |

## Цель / границы

**Входит:**

- language-backend adapters; инспекторы beyond JS (минимум один дополнительный язык)
- опциональные Tree-sitter / LSP providers за адаптерами

**Не входит:** обязательный LSP для всех языков; полный monorepo (S10); Build System (S11).

## Зависимости

Стабильный core API и UI-контракты (S08). Открывает S10 при реальной multi-package нужде.

## Источники

- Blueprint tech: [`.dep/.blueprint/10-technology/`](../../../.dep/.blueprint/10-technology/README.md)
- Рабочая спека adapter: [`docs/20-architecture/language-backend.md`](../../../docs/20-architecture/language-backend.md)
- TS scope: [`docs/10-technology/s09-typescript.md`](../../../docs/10-technology/s09-typescript.md)
- [`docs/10-technology/external-tools.md`](../../../docs/10-technology/external-tools.md)
- ADR: [0002](../../adr/ADR-0002-first-language-typescript.md), [0003](../../adr/ADR-0003-typescript-parser.md)
- Terminology: language-backend, inspector, provider в blueprint `99-terminology/`

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S09-A | Спека adapters + выбор первого языка | `завершено` |
| S09-B | Language-backend + инспекторы | `завершено` |
| S09-C | Tree-sitter / LSP (optional) | `завершено` (null-object stubs) |
| S09-D | Тесты / approve | `ожидает подтверждения` (тесты зелёные) |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S09-001 | ADR: первый язык beyond JS | высокий | S08 | `завершено` |
| S09-002 | Спека language-backend adapter contract | высокий | S09-001 | `завершено` |
| S09-003 | Реализация adapter + basic/import inspectors для языка | высокий | S09-002 | `завершено` |
| S09-004 | Регистрация в core без правок контракта ядра | высокий | S09-003 | `завершено` |
| S09-005 | Optional Tree-sitter provider | средний | S09-002 | `завершено` (null stub) |
| S09-006 | Optional LSP provider | средний | S09-002 | `завершено` (null stub) |
| S09-007 | Фикстуры multi-lang + approve | высокий | S09-004…006 | `ожидает подтверждения` |

### S09-001 / S09-002 — артефакты

| Задача | Артефакт |
|--------|----------|
| S09-001 | [ADR-0002](../../adr/ADR-0002-first-language-typescript.md) — TypeScript; парсер — [ADR-0003](../../adr/ADR-0003-typescript-parser.md) |
| S09-002 | [`language-backend.md`](../../../docs/20-architecture/language-backend.md) + [`s09-typescript.md`](../../../docs/10-technology/s09-typescript.md) |

## Чеклист этапа

- [x] S09-A: ADR языка + спека adapter *(approve: ADR `Принято`, спеки `accepted`)*
- [x] S09-B: минимум один язык beyond JS через adapter (TypeScript + typescript-estree)
- [x] S09-C: Tree-sitter/LSP optional за интерфейсом *(null-object: `isAvailable() === false`)*
- [x] S09-D: тесты `tests/s09-*.test.js` + fixtures/s09 *(approve этапа — владельцу)*
- [x] Ядро не знает внутренностей конкретного языка
- [ ] Exit criteria выполнены *(ждёт approve владельца → S10)*

## Exit criteria

1. Новый язык подключается адаптером без изменения публичного контракта core.
2. JS-путь S01+ не деградировал.
3. Approve → решение о S10 (затем S11 Build System).

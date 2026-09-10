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
| **Статус** | `запланировано` |
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
- [`docs/10-technology/external-tools.md`](../../../docs/10-technology/external-tools.md)
- Terminology: language-backend, inspector, provider в blueprint `99-terminology/`

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S09-A | Спека adapters + выбор первого языка | `запланировано` |
| S09-B | Language-backend + инспекторы | `запланировано` |
| S09-C | Tree-sitter / LSP (optional) | `запланировано` |
| S09-D | Тесты / approve | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S09-001 | ADR: первый язык beyond JS | высокий | S08 | `запланировано` |
| S09-002 | Спека language-backend adapter contract | высокий | S09-001 | `запланировано` |
| S09-003 | Реализация adapter + basic/import inspectors для языка | высокий | S09-002 | `запланировано` |
| S09-004 | Регистрация в core без правок контракта ядра | высокий | S09-003 | `запланировано` |
| S09-005 | Optional Tree-sitter provider | средний | S09-002 | `запланировано` |
| S09-006 | Optional LSP provider | средний | S09-002 | `запланировано` |
| S09-007 | Фикстуры multi-lang + approve | высокий | S09-004…006 | `запланировано` |

## Чеклист этапа

- [ ] S09-A: ADR языка + спека adapter
- [ ] S09-B: минимум один язык beyond JS через adapter
- [ ] S09-C: Tree-sitter/LSP optional за интерфейсом
- [ ] S09-D: тесты + approve
- [ ] Ядро не знает внутренностей конкретного языка
- [ ] Exit criteria выполнены

## Exit criteria

1. Новый язык подключается адаптером без изменения публичного контракта core.
2. JS-путь S01+ не деградировал.
3. Approve → решение о S10 (затем S11 Build System).

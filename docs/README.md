---
title: Рабочая спецификация Dependra
status: draft
mvp: true
source: .dep/.blueprint/README.md
---

# Рабочая спецификация Dependra

Источник истины для реализации кода. Версия пакета на этом этапе: **0.0.1** (не повышать).

## Связанные каталоги

| Каталог | Назначение |
|---------|------------|
| [`docs/`](.) | Продуктовая спека: архитектура, фичи, CLI, конфигурация |
| [`handbook/`](../handbook/README.md) | ADR, roadmap, постоянный контекст |
| [`.dep/.blueprint/`](../.dep/.blueprint/README.md) | Архив/макет исходной спецификации (не редактировать как рабочий источник) |

## Легенда статусов

| Статус | Значение |
|--------|----------|
| `draft` | Черновик, можно менять свободно |
| `review` | Готово к проверке владельцем |
| `accepted` | Утверждено; менять только осознанно |
| `deferred` | Вне текущего MVP; кратко + ссылка на blueprint |

Поле `mvp: true` — документ нужен для текущего этапа разработки при версии `0.0.1`.

## Карта разделов

- [00-project/](00-project/overview.md) — концепция, цели, правило, глоссарий
- [10-technology/](10-technology/stack.md) — стек и внешние инструменты
- [15-build-system/](15-build-system/README.md) — система сборки (`deferred`)
- [20-architecture/](20-architecture/overview.md) — модули, контракты, модель
- [20-features/](20-features/mvp-scope.md) — MVP-фичи и отложенный функционал
- [35-configuration/](35-configuration/overview.md) — конфигурация (минимум для MVP)
- [40-development/](40-development/coding-principles.md) — принципы разработки
- [50-cli/](50-cli/interface.md) — интерфейс командной строки

Шаблон документа: [`_template.md`](_template.md).

## Процесс

1. Спека пишется/уточняется в `docs/`.
2. Задачи и порядок — в [`handbook/roadmap/`](../handbook/roadmap/README.md).
3. Архитектурные решения — в [`handbook/adr/`](../handbook/adr/README.md).
4. Постоянный контекст — в [`handbook/context/`](../handbook/context/README.md).
5. Статус `accepted` — только после подтверждения владельцем.
6. Реализация — в `src/` строго по `accepted`/`review` документам MVP.

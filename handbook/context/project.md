---
title: Индекс контекста проекта
status: draft
mvp: true
source: .dep/.blueprint/90-context/project-context-spec.md
---

# Индекс контекста проекта

Версия пакета: **0.0.1**.

| Секция | Статус | Где смотреть |
|--------|--------|--------------|
| Общая концепция | Задокументировано | [docs/00-project/overview.md](../../docs/00-project/overview.md) |
| Главное правило | Задокументировано | [docs/00-project/main-rule.md](../../docs/00-project/main-rule.md) |
| Архитектурная модель | Задокументировано (draft) | [docs/20-architecture/](../../docs/20-architecture/overview.md) |
| Принятые соглашения | Ожидает | — |
| Правила кодирования | Задокументировано (draft) | [docs/40-development/coding-principles.md](../../docs/40-development/coding-principles.md) |
| Структура проекта | Задокументировано (draft) | [docs/20-architecture/project-structure.md](../../docs/20-architecture/project-structure.md) |
| Соглашения по именованию | Ожидает | — |
| Принятые технологии | Задокументировано (draft) | [docs/10-technology/stack.md](../../docs/10-technology/stack.md) |
| Выбор AST-парсера | Ожидает ADR | [handbook/adr](../adr/README.md), [external-tools](../../docs/10-technology/external-tools.md) |
| Ограничения проекта | Задокументировано (draft) | [docs/20-architecture/limitations.md](../../docs/20-architecture/limitations.md) |
| MVP scope | Задокументировано (draft) | [docs/20-features/mvp-scope.md](../../docs/20-features/mvp-scope.md) |
| Текущие договорённости | Частично | docs/ + handbook/; версия = 0.0.1; handbook отдельно от docs |
| Долгосрочные цели | Ожидает | blueprint / будущие этапы roadmap |
| Особенности реализации | Ожидает | появятся с кодом |
| Требования к качеству | Ожидает | — |
| Взаимодействие модулей | Задокументировано (draft) | [inspector-contract](../../docs/20-architecture/inspector-contract.md), [modules](../../docs/20-architecture/modules.md) |
| Требования к документации | Частично | docs = спека, handbook = процесс; blueprint = архив |
| Принятые проектные решения (ADR) | Журнал пуст | [handbook/adr](../adr/README.md) |

## Краткие договорённости (подтверждённые в работе над спекой)

1. Рабочая продуктовая спека живёт в `docs/`.
2. ADR, roadmap и context живут в `handbook/`.
3. `.dep/.blueprint` — архив/макет, не рабочий источник правок.
4. Версия пакета на этом этапе — `0.0.1`, не повышать.
5. MVP: один JS-файл, basic + imports/exports + graph, CLI + JSON.

Изменения этого списка — только с approve владельца.

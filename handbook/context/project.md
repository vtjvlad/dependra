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
| Архитектурная модель | Accepted | [docs/20-architecture/](../../docs/20-architecture/overview.md) |
| Принятые соглашения | Ожидает | — |
| Правила кодирования | Accepted | [docs/40-development/coding-principles.md](../../docs/40-development/coding-principles.md) |
| Структура проекта | Accepted | [docs/20-architecture/project-structure.md](../../docs/20-architecture/project-structure.md) |
| Соглашения по именованию | Ожидает | — |
| Принятые технологии | Accepted | [docs/10-technology/stack.md](../../docs/10-technology/stack.md) |
| Выбор AST-парсера | ADR-0001 (Acorn) | [ADR-0001](../adr/ADR-0001-js-ast-parser.md), [external-tools](../../docs/10-technology/external-tools.md) |
| Ограничения проекта | Accepted | [docs/20-architecture/limitations.md](../../docs/20-architecture/limitations.md) |
| MVP scope | Accepted | [docs/20-features/mvp-scope.md](../../docs/20-features/mvp-scope.md) |
| Полный roadmap (S01–S10) | Задокументировано | [handbook/roadmap](../roadmap/README.md), [todo-checklist](../roadmap/todo-checklist.md) |
| Текущие договорённости | Частично | docs accepted; активный подэтап = S01-B; следующая задача = MVP-004 |
| Долгосрочные цели | В roadmap | [stages S02–S10](../roadmap/stages/README.md); детали фич — blueprint / deferred |
| Особенности реализации | Каркас есть | `src/cli`, `src/core` (реестр + pipeline); инспекторы/parsers/reporters — следующие задачи |
| Требования к качеству | Ожидает | — |
| Взаимодействие модулей | Accepted | [inspector-contract](../../docs/20-architecture/inspector-contract.md), [modules](../../docs/20-architecture/modules.md) |
| Требования к документации | Частично | docs = спека, handbook = процесс; blueprint = архив |
| Принятые проектные решения (ADR) | ADR-0001 | [handbook/adr](../adr/README.md) |

## Краткие договорённости (подтверждённые в работе над спекой)

1. Рабочая продуктовая спека живёт в `docs/` (MVP docs: `status: accepted`).
2. ADR, roadmap и context живут в `handbook/`.
3. `.dep/.blueprint` — архив/макет, не рабочий источник правок.
4. Версия пакета на этом этапе — `0.0.1`, не повышать.
5. MVP (S01): один JS-файл; basic + imports/exports + graph; CLI + JSON; один инспектор import-export; pipeline prerequisites для graph; без `--level`.
6. Единое поле внешнего модуля: `isExternal`. `ImportRecord.source` может быть `null`.
7. Полный roadmap: этапы `S01`–`S10` в `handbook/roadmap/`; сводный чеклист — `todo-checklist.md`; deferred привязан к целевым этапам.
8. JS AST-парсер MVP: **Acorn** ([ADR-0001](../adr/ADR-0001-js-ast-parser.md)); доступ только через будущий модуль `parsers`.
9. Entrypoint: `node src/cli/index.js` (ESM, `"type": "module"`).

Изменения этого списка — только с approve владельца.

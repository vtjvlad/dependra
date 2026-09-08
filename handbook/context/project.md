---
title: Индекс контекста проекта
status: draft
mvp: true
source: .dep/.blueprint/90-context/project-context-spec.md
---

# Индекс контекста проекта

Версия пакета: **0.0.1** (не повышать без решения владельца).

| Секция | Статус | Где смотреть |
|--------|--------|--------------|
| Общая концепция | Accepted | [docs/00-project/overview.md](../../docs/00-project/overview.md) |
| Главное правило | Accepted | [docs/00-project/main-rule.md](../../docs/00-project/main-rule.md) |
| Архитектурная модель | Accepted | [docs/20-architecture/](../../docs/20-architecture/overview.md) |
| Принятые соглашения | Зафиксировано ниже | этот файл |
| Правила кодирования | Accepted | [docs/40-development/coding-principles.md](../../docs/40-development/coding-principles.md) |
| Структура проекта | Accepted + реализовано | [project-structure.md](../../docs/20-architecture/project-structure.md), `src/` |
| Соглашения по именованию | Зафиксировано ниже | этот файл |
| Принятые технологии | Accepted | [stack.md](../../docs/10-technology/stack.md) |
| Выбор AST-парсера | ADR-0001 (Acorn) | [ADR-0001](../adr/ADR-0001-js-ast-parser.md) |
| Ограничения проекта | Accepted | [limitations.md](../../docs/20-architecture/limitations.md) |
| MVP scope | Accepted, S01 реализован | [mvp-scope.md](../../docs/20-features/mvp-scope.md) |
| Полный roadmap (S01–S10) | S01 `завершено` | [roadmap](../roadmap/README.md), [todo-checklist](../roadmap/todo-checklist.md) |
| Текущие договорённости | Актуальны | S01 закрыт; следующий этап = **S02** |
| Долгосрочные цели | В roadmap | [stages S02–S10](../roadmap/stages/README.md) |
| Особенности реализации | Задокументировано | раздел ниже |
| Требования к качеству | `npm test` (13 AC) | `tests/mvp-*.test.js`, `tests/fixtures/mvp/` |
| Взаимодействие модулей | Accepted | [inspector-contract](../../docs/20-architecture/inspector-contract.md), [modules](../../docs/20-architecture/modules.md) |
| Требования к документации | Частично | docs = спека, handbook = процесс; blueprint = архив |
| Принятые проектные решения (ADR) | ADR-0001 | [handbook/adr](../adr/README.md) |

## Реализация S01 (факт)

```
src/
  cli/          argv, help/version, валидация файла, запуск pipeline + reporters
  core/         context, registry, pipeline (prerequisites import→graph)
  parsers/      Acorn за адаптером; loadSourceFile / ensureTargetSourceFile
  inspectors/   basic-file-information, import-export-analysis, dependency-analysis
  reporters/    text + JSON по флагам секций
```

Entrypoint: `node src/cli/index.js <file> [options]`  
Флаги MVP: `--basic` `--imports` `--exports` `--graph` `--json` `--path-mode` `--help` `--version`.  
Default без op-флагов: все четыре операции. Версия пакета: `0.0.1`.

## Соглашения по именованию (S01)

- Инспекторы: kebab-case id = имя файла (`basic-file-information`).
- Поле внешнего модуля: всегда `isExternal` (не `external`).
- Опции отчёта JSON: `basic`, `imports`, `exports`, `graph`, `pathMode`.
- Коды ошибок: `SCREAMING_SNAKE` (`PARSE_FAILED`, `MODEL_INCOMPLETE`, …).

## Краткие договорённости

1. Рабочая продуктовая спека — `docs/` (`status: accepted` для MVP).
2. ADR, roadmap, context — `handbook/`.
3. `.dep/.blueprint` — архив, не источник правок.
4. Версия на S01/S02 старте — `0.0.1`, не бампать без решения владельца.
5. MVP: один JS-файл; basic + imports/exports + graph; один инспектор import-export; pipeline prerequisites для graph; без `--level`.
6. `ImportRecord.source` может быть `null` (dynamic import).
7. Roadmap: `S01`–`S10`; сводный чеклист — `todo-checklist.md`.
8. Парсер: **Acorn** только через `parsers` (ADR-0001).
9. Тесты: `npm test` (= `node --test tests/**/*.test.js`).

Изменения этого списка — только с approve владельца.

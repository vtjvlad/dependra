---
title: Индекс контекста проекта
status: draft
mvp: true
source: .dep/.blueprint/90-context/project-context-spec.md
---

# Индекс контекста проекта

Версия пакета: **0.0.33** (не повышать без решения владельца).

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
| Полный roadmap (S01–S11) | S01 `завершено` | [roadmap](../roadmap/README.md), [todo-checklist](../roadmap/todo-checklist.md) |
| Текущие договорённости | Актуальны | S01–S04 `завершено`; **S05** спека готова (`в работе`); S06 параллельно; пакет = `0.0.33` |
| Долгосрочные цели | В roadmap | [stages S02–S11](../roadmap/stages/README.md) |
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
npm `bin`: `dependra`, `fds`, `deps`, `dep` (один entrypoint).  
Флаги MVP: `--basic|-b` `--imports|-i` `--exports|-e` `--graph|-g` `--json|-j` `--path-mode|-p` `--help|-h` `--version|-v`.  
Default без op-флагов: все четыре операции S01 (операции S02+ только явно). Версия пакета: `0.0.33`. `--version`/`-v` → `Dependra v0.0.33`.  
Text/help: schematic (рамки + баннер). Short при коллизии: вторая буква (`--entities` → `-en`); short S01 не переназначать.  
S02 (спека): `--additional|-a`, `--entities|-en` — [s02-flags.md](../../docs/50-cli/s02-flags.md).

## Соглашения по именованию (S01)

- Инспекторы: kebab-case id = имя файла (`basic-file-information`).
- Поле внешнего модуля: всегда `isExternal` (не `external`).
- Опции отчёта JSON: `basic`, `imports`, `exports`, `graph`, `pathMode` (+ S02: `additional`, `entities`).
- Коды ошибок: `SCREAMING_SNAKE` (`PARSE_FAILED`, `MODEL_INCOMPLETE`, …).
- CLI short: 1 буква → при коллизии 2+ буквы одним токеном; без кластеров `-bg`.

## Краткие договорённости

1. Рабочая продуктовая спека — `docs/` (`status: accepted` для MVP).
2. ADR, roadmap, context — `handbook/`.
3. `.dep/.blueprint` — архив, не источник правок.
4. Версия пакета — `0.0.33`; **не повышать** без approve владельца. `--version` → `Dependra v…`.
5. MVP: один JS-файл; basic + imports/exports + graph; один инспектор import-export; pipeline prerequisites для graph; без `--level`.
6. `ImportRecord.source` может быть `null` (dynamic import).
7. Roadmap: `S01`–`S11`; сводный чеклист — `todo-checklist.md`.
8. Парсер: **Acorn** только через `parsers` (ADR-0001).
9. Тесты: `npm test` (= `node --test tests/**/*.test.js`).

Изменения этого списка — только с approve владельца.

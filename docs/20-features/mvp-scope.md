---
title: Область MVP
status: draft
mvp: true
source: .dep/.blueprint/20-features/README.md, 00-project/main-rule.md
---

# Область MVP (этап 0.0.1)

## Цель

Явно зафиксировать, что реализуется сейчас, а что отложено. Версия пакета остаётся **0.0.1**.

## Входит

| ID | Фича | Тег | Документ |
|----|------|-----|----------|
| F-B1 | Базовая информация о файле | B | [basic-file-information.md](analysis/basic-file-information.md) |
| F-M1 | Анализ импортов и экспортов | M | [import-export-analysis.md](analysis/import-export-analysis.md) |
| F-M2 | Отображение зависимостей | M | [dependency-analysis.md](analysis/dependency-analysis.md) |
| F-CLI | Минимальный CLI + JSON | — | [../50-cli/interface.md](../50-cli/interface.md) |
| F-CORE | Каркас core + контракт инспектора | — | [../20-architecture/inspector-contract.md](../20-architecture/inspector-contract.md) |

Язык целевого файла: **JavaScript** (ESM и CJS). Один файл за запуск.

Один инспектор `import-export-analysis` на `--imports`/`--exports`; `--graph` требует prerequisite imports в модели (см. [interface.md](../50-cli/interface.md)). Флаг `--level` не в MVP.

## Не входит

См. [deferred/README.md](deferred/README.md):

- Доп. file info сверх MVP-полей, metadata U, runtime U, permissions-heavy P
- Validation D, quality F, visualization E, AI I
- Вся подсистема modifications
- TUI
- Multi-file / whole-project deep analysis (level 5)
- Build-system / monorepo

## Принципы операций

Операции независимы и комбинируемы: по отдельности, вместе, наборами (профили — позже).

См. [operations-principles.md](operations-principles.md), [priority-tags.md](priority-tags.md).

## Acceptance criteria

- [ ] Реализация не тянет deferred-фичи «заодно»
- [x] Backlog в handbook отражает только MVP-задачи текущего этапа

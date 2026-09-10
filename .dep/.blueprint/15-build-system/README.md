---
title: Build System
source: prompt.md
source_lines: [2083, 2436]
status: draft
---

# Build System

Система сборки Dependra: компиляция, проверка, упаковка и публикация компонентов проекта.

## Содержание раздела

- [README.md](README.md) — назначение (из prompt.md)
- [monorepo-structure.md](monorepo-structure.md) — структура каталогов монорепозитория
- [build-stages.md](build-stages.md) — этапы сборки (Clean → Publish)
- [build-graph.md](build-graph.md) — граф зависимостей пакетов
- [incremental-build.md](incremental-build.md) — инкрементальная сборка
- [artifacts.md](artifacts.md) — артефакты сборки
- [module-build.md](module-build.md) — независимая сборка модулей
- [task-system.md](task-system.md) — декларативный граф задач
- [build-profiles.md](build-profiles.md) — профили сборки
- [monorepo.md](monorepo.md) — управление монорепозиторием
- [release-system.md](release-system.md) — система релизов
- [development-workflow.md](development-workflow.md) — цикл локальной разработки

## Назначение

Система сборки Dependra отвечает за компиляцию, проверку, упаковку и публикацию всех компонентов проекта. Build System должна обеспечивать воспроизводимую сборку, инкрементальную и параллельную сборку, единый процесс разработки и CI/CD.

## Связанные разделы

- [../30-architecture/requirements/project-structure.md](../30-architecture/requirements/project-structure.md)
- [../80-roadmap/README.md](../80-roadmap/README.md)

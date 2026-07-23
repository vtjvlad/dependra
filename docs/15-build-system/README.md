---
title: Build System
status: deferred
mvp: false
source: .dep/.blueprint/15-build-system
---

# Build System

**Статус: deferred** для этапа `0.0.1`.

## Цель (долгосрочно)

Воспроизводимая сборка, проверка, упаковка и публикация компонентов; в перспективе — monorepo, инкрементальная сборка, профили, CI/CD.

## Сейчас

- Обычный npm-пакет, версия `0.0.1`
- Нет отдельной build-системы / monorepo-оркестрации
- Детали остаются в архиве: [`.dep/.blueprint/15-build-system/`](../../.dep/.blueprint/15-build-system/README.md)

## Когда возвращаться

После стабилизации MVP-ядра CLI и появления реальной нужды в пакетировании нескольких модулей.

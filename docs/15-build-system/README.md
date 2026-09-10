---
title: Build System
status: deferred
mvp: false
source: .dep/.blueprint/15-build-system
---

# Build System

**Статус: deferred** до этапа **[S11](../../handbook/roadmap/stages/11-build-system.md)** (после S01–S10).

## Цель (долгосрочно)

Воспроизводимая сборка, проверка, упаковка и публикация компонентов; инкрементальная сборка, профили, CI/CD, release policy.

## Сейчас

- Обычный npm-пакет, версия `0.0.47`
- Нет отдельной build-системы / monorepo-оркестрации
- Layout monorepo — этап **[S10](../../handbook/roadmap/stages/10-platform-monorepo.md)**; полный pipeline — **S11**
- Детали остаются в архиве: [`.dep/.blueprint/15-build-system/`](../../.dep/.blueprint/15-build-system/README.md)

## Когда возвращаться

После закрытия остальных продуктовых этапов и S10 (platform / monorepo), когда есть реальная нужда в воспроизводимом Clean → Release Bundle.

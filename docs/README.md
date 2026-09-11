---
title: Рабочая спецификация Dependra
status: accepted
mvp: true
source: .dep/.blueprint/README.md
---

# Рабочая спецификация Dependra

Источник истины для реализации кода. Версия пакета: **0.0.47** (не повышать без решения владельца).

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
- [10-technology/](10-technology/stack.md) — стек и внешние инструменты ([S09 TypeScript](10-technology/s09-typescript.md), [доп. языки](10-technology/additional-languages.md))
- [15-build-system/](15-build-system/README.md) — система сборки (`deferred`)
- [20-architecture/](20-architecture/overview.md) — модули, контракты, модель ([public-api](20-architecture/public-api.md), [language-backend](20-architecture/language-backend.md))
- [20-features/](20-features/mvp-scope.md) — MVP-фичи и отложенный функционал
- [35-configuration/](35-configuration/overview.md) — конфигурация ([MVP](35-configuration/overview.md) + [S05 `.conf`](35-configuration/s05-config.md) + [example](35-configuration/dependra.conf.example))
- [40-development/](40-development/coding-principles.md) — принципы разработки
- [50-cli/](50-cli/interface.md) — CLI (S01 + [s02](50-cli/s02-flags.md) + [s03](50-cli/s03-flags.md) + [s04](50-cli/s04-flags.md) + [s05](50-cli/s05-flags.md) + [s06](50-cli/s06-flags.md) + [s07](50-cli/s07-flags.md) + [s08](50-cli/s08-flags.md))
- [50-tui/](50-tui/overview.md) — TUI S08 ([попапы](50-tui/popups.md), [future surfaces](50-tui/future-surfaces.md))

Шаблон документа: [`_template.md`](_template.md).

## Процесс

1. Спека пишется/уточняется в `docs/`.
2. Задачи и порядок — в [`handbook/roadmap/`](../handbook/roadmap/README.md).
3. Архитектурные решения — в [`handbook/adr/`](../handbook/adr/README.md).
4. Постоянный контекст — в [`handbook/context/`](../handbook/context/README.md).
5. Статус `accepted` — только после подтверждения владельцем.
6. Реализация — в `src/` строго по `accepted`/`review` документам MVP.

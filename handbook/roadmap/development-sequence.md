---
title: Последовательность разработки
status: draft
mvp: true
source: .dep/.blueprint/80-roadmap/development-sequence.md, 00-project/main-rule.md
---

# Последовательность разработки

## Этап A — Спека (текущий)

1. Рабочая спека в `docs/` (MVP до уровня реализации)
2. Handbook: ADR-процесс, backlog, context
3. Review владельцем → перевод ключевых docs в `accepted`

## Этап B — Каркас кода (после accept спеки)

1. Инициализация `src/` по мере нужды (`cli`, `core`, `inspectors`, `parsers`, `reporters`, …)
2. ADR: выбор AST-парсера
3. Контракт инспектора в коде + пустой/smoke CLI

## Этап C — MVP-инспекторы

1. `basic-file-information`
2. `import-export-analysis`
3. `dependency-analysis`
4. Text + JSON reporters
5. Тесты на фикстурах

## Этап D — Стабилизация

1. Доработка по AC из docs
2. Обновление `handbook/context` (после approve)
3. Решение о следующем этапе (не путать с bump версии — версия остаётся `0.0.1`, пока владелец не решит иначе)

## Вне последовательности сейчас

Build-system monorepo, TUI, modifications, multi-language — только через новый этап roadmap.

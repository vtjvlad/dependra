---
title: Отложенный функционал
status: deferred
mvp: false
source: .dep/.blueprint/20-features
---

# Отложенный функционал (deferred)

Всё перечисленное **не** входит в этап `0.0.1`. Детали — в [`.dep/.blueprint/20-features/`](../../../.dep/.blueprint/20-features/README.md).

## Анализ

| Раздел blueprint | Тег | Заметка |
|------------------|-----|---------|
| additional-file-information | B | Расширение basic |
| file-environment-analysis | P | Окружение файла |
| file-operations | U | Операции с файлами |
| exported-entities (глубокий) | M | Сверх списка export records MVP |
| validation | D | Проверка корректности |
| commands | P | Доступные команды запуска |
| runtime-dependency-analysis | U | Зависимости runtime |
| environment-validation | P | Проверка окружения |
| code-quality-analysis | F | Качество кода |
| visualization | E | Mermaid/Graphviz и др. |
| metadata | U | Расширенные метаданные |
| file-enhancement-functions | E/I/F | Усовершенствование |

## Модификации

Вся подсистема [modifications/](../../../.dep/.blueprint/20-features/modifications/README.md) — deferred (safety, AI, imports/exports ops, comments, environment, …).

## Пользовательский UI

TUI и связанные документы blueprint `50-user/tui` — deferred. CLI MVP — в [docs/50-cli](../../50-cli/interface.md).

## Правило возврата

Фича переводится из deferred в MVP следующего этапа только через запись в [`handbook/roadmap`](../../../handbook/roadmap/README.md) и уточнение спеки в `docs/` до уровня шаблона (`_template.md`).

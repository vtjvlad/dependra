---
title: Подсистема модификации
source: prompt.md
source_lines: [464, 713]
status: draft
---

# Подсистема модификации файлов

Операции автоматической модификации файлов и проекта. Отдельная подсистема, не относящаяся к анализу.

**По умолчанию Dependra никогда не изменяет файлы.** Модификация — только по явному запросу пользователя.

## Содержание

- [environment-operations.md](environment-operations.md) — установка зависимостей, пакетных менеджеров
- [code-operations.md](code-operations.md) — форматирование, нормализация
- [imports-exports-operations.md](imports-exports-operations.md) — корректировка импортов/экспортов
- [functions-variables-operations.md](functions-variables-operations.md) — функции и переменные
- [comments-operations.md](comments-operations.md) — работа с комментариями
- [other-operations.md](other-operations.md) — расширяемость операций
- [composition.md](composition.md) — комбинирование, переиспользование анализа
- [safety.md](safety.md) — preview, backup, undo, отчёты
- [ai-integration.md](ai-integration.md) — использование ИИ

## Связанные разделы

- [../unified-project-model.md](../unified-project-model.md)
- [../../30-architecture/principles/operation-composition.md](../../30-architecture/principles/operation-composition.md)

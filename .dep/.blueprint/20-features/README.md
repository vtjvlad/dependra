---
title: Функционал
source: prompt.md
source_lines: [167, 713]
status: draft
---

# Функционал (то, что видит пользователь)

Dependra (fds) — утилита для получения и отображения расширенной информации о файле. Основа — анализ и удобное отображение зависимостей.

Все операции максимально независимы и комбинируемы: отдельно, совместно или как часть заранее определённого набора действий.

## Общие документы

- [priority-tags.md](priority-tags.md) — внутренние теги приоритета (-B, -M, -U, -P, -D, -F, -I)
- [operations-principles.md](operations-principles.md) — принципы независимости операций
- [unified-project-model.md](unified-project-model.md) — единая модель проекта

## Анализ файла

| Тег | Раздел |
|-----|--------|
| B | [basic-file-information---B/](basic-file-information---B/README.md) — базовая информация |
| B | [additional-file-information---B/](additional-file-information---B/README.md) — дополнительная информация |
| P | [file-environment-analysis---P/](file-environment-analysis---P/README.md) — окружение файла |
| U | [file-operations---U/](file-operations---U/README.md) — операции с файлами |
| M | [import-export-analysis---M/](import-export-analysis---M/README.md) — импорты и экспорты |
| M | [dependency-analysis---M/](dependency-analysis---M/README.md) — отображение зависимостей |
| M | [exported-entities---M/](exported-entities---M/README.md) — экспортируемые сущности |
| D | [validation---D/](validation---D/README.md) — проверка корректности |
| P | [commands---P/](commands---P/README.md) — доступные команды |
| U | [runtime-dependency-analysis---U/](runtime-dependency-analysis---U/README.md) — зависимости запуска |
| P | [environment-validation---P/](environment-validation---P/README.md) — проверка окружения |
| F | [code-quality-analysis---F/](code-quality-analysis---F/README.md) — качество кода |
| E | [visualization---E/](visualization---E/README.md) — визуализация |
| U | [metadata---U/](metadata---U/README.md) — метаданные |

## Модификация файлов

- [modifications/](modifications/README.md) — подсистема модификации (отдельно от анализа)
- [file-enhancement-functions---E--I--F/](file-enhancement-functions---E--I--F/README.md) — обзор функций усовершенствования

## Связанные разделы

- [../50-user/cli-flags.md](../50-user/cli-flags.md) — флаги CLI
- [../40-development-guidelines/analysis-levels.md](../40-development-guidelines/analysis-levels.md) — уровни анализа

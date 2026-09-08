---
title: Конфигурация (MVP)
status: accepted
mvp: true
source: .dep/.blueprint/35-configurations
---

# Конфигурация (MVP)

## Цель

Зафиксировать минимальную модель конфигурации для этапа `0.0.1` без полной иерархии файлов.

## MVP-поведение

Источники (по возрастанию приоритета):

1. Встроенные defaults
2. Параметры CLI (наивысший приоритет)

Файлы `dependra.config.*`, глобальные/пользовательские конфиги, профили — **deferred** (см. blueprint `35-configurations`).

## Defaults

| Параметр | Default |
|----------|---------|
| `basic` | true, если нет явных флагов операций; иначе по флагам |
| `imports` | аналогично |
| `exports` | аналогично |
| `graph` | аналогично |
| `pathMode` | `"relative"` |
| `output` | `"text"` (`--json` → `"json"`) |

Параметр / флаг `level` в MVP **отсутствует** (см. [analysis-levels.md](../40-development/analysis-levels.md)).

## Долгосрочная модель (справочно, deferred)

Иерархия blueprint: defaults → global → project → user → profile → CLI. Типы параметров и валидация по схеме — когда появятся config-файлы.

Архив: [`.dep/.blueprint/35-configurations/`](../../.dep/.blueprint/35-configurations/README.md).

## Acceptance criteria

- [ ] MVP работает без config-файла
- [ ] CLI переопределяет defaults

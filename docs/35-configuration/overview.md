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

Файлы `dependra.conf`, user-конфиг, профили, report/flags/ai — **S05**: [s05-config.md](s05-config.md), шаблон [dependra.conf.example](dependra.conf.example).

## Defaults

| Параметр | Default |
|----------|---------|
| `basic` | true, если нет явных флагов операций; иначе по флагам |
| `imports` | аналогично |
| `exports` | аналогично |
| `graph` | аналогично |
| `pathMode` | `"relative"` |
| `output` | `"text"` (`--json` → `"json"`) |

Параметр / флаг `level` в **MVP/S01 отсутствует**. В S05 — сахар: [analysis-levels.md](../40-development/analysis-levels.md).

## Долгосрочная модель

Иерархия, `.conf`, профили, report/flags/ai — **[s05-config.md](s05-config.md)**.  
Архив blueprint: [`.dep/.blueprint/35-configurations/`](../../.dep/.blueprint/35-configurations/README.md).

## Acceptance criteria

- [ ] MVP работает без config-файла
- [ ] CLI переопределяет defaults

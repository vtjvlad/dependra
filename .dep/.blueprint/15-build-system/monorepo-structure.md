---
title: Структура монорепозитория
source: prompt.md
source_lines: [2100, 2141]
status: draft
---

# Структура монорепозитория

## Структура проекта

dependra/

├── apps/
│   ├── cli/
│   ├── daemon/
│   └── playground/
│
├── packages/
│   ├── core/
│   ├── config/
│   ├── logger/
│   ├── cache/
│   ├── graph/
│   ├── events/
│   ├── parser/
│   ├── diagnostics/
│   ├── reporter/
│   └── workspace/
│
├── inspectors/
│   ├── javascript/
│   ├── typescript/
│   ├── html/
│   ├── css/
│   ├── lua/
│   ├── json/
│   └── ...
│
├── providers/
│
├── plugins/
│
├── tools/
│
├── scripts/
│
├── docs/
│
└── tests/
Каждый каталог представляет собой независимый пакет.

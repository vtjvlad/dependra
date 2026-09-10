---
title: Структура проекта
source: prompt.md
source_lines: [1003, 1030]
status: draft
---

# Структура проекта

###  Структура проекта
Базовая структура проекта должна соответствовать следующей архитектуре.
src/
├── cli/
├── core/
├── scanner/
├── inspectors/
├── analyzers/
├── parsers/
├── dependency/
├── graph/
├── metadata/
├── permissions/
├── runtime/
├── plugins/
├── reporters/
├── cache/
├── utils/
└── types/

docs/
examples/
tests/


⸻


Конкретная структура проекта может расширяться по мере развития системы.
Добавление новых модулей допускается при соблюдении всех архитектурных принципов проекта.

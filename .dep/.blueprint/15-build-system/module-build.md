---
title: Сборка модулей
source: prompt.md
source_lines: [2274, 2298]
status: draft
---

# Сборка модулей

## Сборка модулей

Каждый модуль собирается независимо.
packages/core

↓

packages/parser

↓

packages/cache

↓

packages/events

↓

inspectors/javascript

↓

inspectors/lua
Ошибка одного модуля не должна приводить к повреждению результатов сборки остальных компонентов.

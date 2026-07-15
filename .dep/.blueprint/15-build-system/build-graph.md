---
title: Граф сборки
source: prompt.md
source_lines: [2201, 2216]
status: draft
---

# Граф сборки

## Граф сборки
Build System строит граф зависимостей между пакетами.
core
│
├── logger
├── events
├── cache
├── graph
│
└── parser
      │
      ├── js
      ├── lua
      ├── html
      └── css
Пакет может быть собран только после успешной сборки всех его зависимостей.

---
id: ADR-0001
title: Выбор JS AST-парсера для MVP
status: Принято
date: 2026-09-08
replaces:
replaced_by:
---

# ADR-0001: Выбор JS AST-парсера для MVP

## Контекст

Для инспекторов `import-export-analysis` и (косвенно) `dependency-analysis` нужен разбор JavaScript (ESM и CJS) в AST. Regex-парсинг запрещён контрактом. Конкретный пакет в [`docs/10-technology/external-tools.md`](../../docs/10-technology/external-tools.md) оставлен на ADR. Решение нужно до модуля `parsers` (MVP-004).

## Варианты

1. **Acorn** (+ при необходимости `acorn-walk`) — зрелый, лёгкий, ESM-совместимый, широко используется в Node-инструментах. Минус: опциональные фичи новее ECMAScript иногда требуют плагинов/`ecmaVersion`.
2. **@babel/parser** — очень полный синтаксис (TS/JSX из коробки при настройке). Минус: тяжелее dependency footprint для MVP без TS/JSX.
3. **Meriyah** — быстрый современный парсер. Минус: меньшая экосистема walk/утилит по сравнению с Acorn.

## Решение

Выбран **Acorn** как единственный JS AST-парсер MVP. Обход узлов — через `acorn-walk` при появлении нужды в обходе (не обязателен в момент ADR, если достаточно ручного обхода). Доступ к Acorn только из модуля `parsers`; инспекторы не импортируют API парсера напрямую.

## Последствия

- Положительные: малый вес, предсказуемый AST (ESTree), лёгкая замена за адаптером `parsers`.
- Отрицательные / риски: экзотический синтаксис вне выбранного `ecmaVersion` потребует настройки или смены парсера через новый ADR.
- Влияние: зависимость `acorn` в `package.json`; реализация парсинга — MVP-004; docs `external-tools` ссылается на этот ADR.

## Ссылки

- [`docs/10-technology/external-tools.md`](../../docs/10-technology/external-tools.md)
- [`docs/20-architecture/inspector-contract.md`](../../docs/20-architecture/inspector-contract.md)
- Задачи: MVP-003, MVP-004 ([`mvp-backlog.md`](../roadmap/mvp-backlog.md))

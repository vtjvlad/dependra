---
title: Внешние инструменты
status: accepted
mvp: true
source: .dep/.blueprint/10-technology/20-external-tools
---

# Внешние инструменты

## Цель

Разрешить и упорядочить использование зрелых внешних решений для анализа кода вместо изобретения с нуля.

## Правила

1. Готовые инструменты приветствуются, если решают задачу заметно лучше/быстрее собственной реализации.
2. Особенно: парсеры AST, Tree-sitter, LSP, графовые библиотеки, профильные утилиты файлов.
3. Инструмент должен быть заменяем **без ломки архитектуры** (изоляция за адаптером / language backend).
4. Оценка: качество, зрелость, поддержка, производительность, удобство интеграции, заменяемость.

## MVP (0.0.1)

| Область | Решение |
|---------|---------|
| Парсинг JS (ESM/CJS) | **Acorn** ([ADR-0001](../../handbook/adr/ADR-0001-js-ast-parser.md)) |
| FS / path / MIME | Стандартная библиотека Node.js (+ при необходимости узкая утилита) |
| LSP / Tree-sitter | **Не обязательны** для MVP; `deferred` → S09-C |

До выбора пакета парсера реализация не начинается «наугад» — фиксируется ADR в [`handbook/adr/`](../../handbook/adr/README.md).

## S09 (multi-language)

| Область | Решение |
|---------|---------|
| Парсинг TypeScript / TSX | **`@typescript-eslint/typescript-estree`** ([ADR-0003](../../handbook/adr/ADR-0003-typescript-parser.md)) — *Предложено* |
| Language backends | Контракт [language-backend.md](../20-architecture/language-backend.md) |
| Scope TS | [s09-typescript.md](s09-typescript.md) |
| LSP / Tree-sitter | Optional providers за backend; не обязательны для S09-B |

Изоляция: инспекторы не импортируют API парсера; только `parsers` / language-backend registry.

## Границы

- Не тащить тяжёлые фреймворки ради одной функции
- Не встраивать инструмент так, чтобы инспекторы зависели от его API напрямую

## Acceptance criteria

- [x] Парсер скрыт за модулем `parsers` / language backend
- [x] Выбор парсера оформлен ADR (когда принято)
- [ ] Инспекторы не импортируют API парсера напрямую

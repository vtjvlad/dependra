---
title: Технологический стек
status: accepted
mvp: true
source: .dep/.blueprint/10-technology/00-used-stack, 10-primary-development-stack
---

# Технологический стек

## Цель

Зафиксировать обязательный стек разработки Dependra.

## Использовать

| Технология | Назначение |
|------------|------------|
| **JavaScript** | Язык реализации |
| **Node.js** | Runtime |
| **ES Modules** | Модульная система |
| **JSDoc** | Типизация/документация в коде |
| **npm** | Пакеты и скрипты |

## Запрещено

- TypeScript как язык исходников проекта
- UI/application-фреймворки для ядра CLI (Express, React и т.п. не нужны ядру анализа)

## Границы

Стек описывает код Dependra. Анализируемые пользователем проекты могут быть на других языках (поддержка языков — поэтапно; MVP — JS; S09 — TypeScript как **анализируемый** язык, см. [s09-typescript.md](s09-typescript.md)).

TypeScript **запрещён** как язык исходников Dependra; dependency на пакет `typescript` допускается только за language-backend adapter ([ADR-0003](../../handbook/adr/ADR-0003-typescript-parser.md)).

## Acceptance criteria

- [ ] Новый код в `src/` — JS + ESM + JSDoc
- [ ] Нет зависимости от TypeScript compiler для сборки исходников Dependra

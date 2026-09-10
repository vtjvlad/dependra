---
title: Code operations
status: review
mvp: false
source: .dep/.blueprint/20-features/modifications/code-operations.md
tags: [E, F]
---

# Code operations (S07)

## Цель

Локальные правки **оформления** целевого JS-файла: нормализация пробелов/пустых строк, сортировка импортов, лёгкий format — через safety-каркас (без скрытой записи).

## Границы

### Входит

| Op id | CLI | Суть |
|-------|-----|------|
| `format` | `--format` / `-f` | Нормализация оформления (indent consistency best-effort, trailing whitespace, final newline) |
| `sort-imports` | `--sort-imports` / `-si` | Сортировка import/require-блоков (stable, grouped: side-effect → builtin → external → relative) |
| `normalize-blanks` | входит в `--format` | Схлопывание лишних пустых строк (подряд > 1 → 1), если не отключено политикой format |

### Не входит

- Prettier/ESLint как обязательная зависимость ядра (опциональный внешний bin — later / best-effort за флагом конфига, не min AC)
- Структурный рефакторинг AST (extract function, …)
- JSX/TS format (S09)
- Переписывание логики кода

## CLI

| Long | Short | Почему short |
|------|-------|--------------|
| `--format` | `-f` | `f` свободна |
| `--sort-imports` | `-si` | `-s` свободна, но mnemonic sort-imports → `-si` (двухбуквенный ок; `-s` можно оставить свободным) |

Не в default-all / levels.  
Без `--apply` → preview only ([safety.md](safety.md)).

## Вход

- Целевой `.js` / `.mjs` / `.cjs`
- Текст файла (+ AST при наличии из pipeline)
- `options.pathMode` для `display` в Change

## Выход (через Change)

Каждая op добавляет ≥0 `Change` с `op: "format" | "sort-imports"`, `kind: "update"`, `risk: "safe"`, `before`/`after`/`diff`.

Если файл уже соответствует правилам → `changes` без этой op (или пустой вклад в summary).

## Правила

1. Детерминизм: одинаковый вход → одинаковый `after`.
2. Не трогать содержимое строк / шаблонных литералов / комментариев (кроме trailing ws на пустых строках комментариев — по политике format: **не** менять текст комментария).
3. `sort-imports` не удаляет и не добавляет импорты (это [imports-exports-ops.md](imports-exports-ops.md)).
4. Комбинация `-f -si`: сначала format-нормализация ws, затем sort (или наоборот — **зафиксировать в реализации**: **sort → format** чтобы format не разъезжал группы). Рекомендация S07: **sort-imports → format**.
5. Парсинг невалидного JS → Change не строится; ошибка op `PARSE_FAILED` (не silent empty).

## Ошибки

| code | category | смысл |
|------|----------|--------|
| `PARSE_FAILED` | execution | не разобрали файл |
| `FORMAT_NOOP` | — | не ошибка; просто нет changes |

## Зависимости

- [safety.md](safety.md)
- [s07-flags.md](../../50-cli/s07-flags.md)
- Опционально quality metrics (не обязательны)

## Acceptance criteria

- [ ] `-f` без `--apply` не меняет файл; в `modification.changes` есть diff при грязном файле
- [ ] `-si` сортирует импорты стабильно на фикстуре
- [ ] `-f --apply` пишет файл и создаёт backup
- [ ] Невалидный JS → понятная ошибка, без записи

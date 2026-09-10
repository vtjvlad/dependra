---
title: Comments operations
status: review
mvp: false
source: .dep/.blueprint/20-features/modifications/comments-operations.md
tags: [E, I]
---

# Comments operations (S07)

## Цель

Детерминированные правки комментариев в целевом JS-файле (без обязательного AI). AI-улучшение комментариев — опционально через [ai-mods.md](ai-mods.md).

## Границы

### Входит

| Op id | CLI | Суть |
|-------|-----|------|
| `strip-comments` | `--strip-comments` / `-sc` | Удалить comments (опции: all \| trailing-only — default **не** трогать license headers `/*!` / первые `/**` copyright) |
| `add-file-banner` | `--comment-banner` / `-cb` | Добавить/обновить однострочный file banner, если отсутствует |

Min S07: **`--strip-comments`** как полный AC; `--comment-banner` — nice-to-have в том же модуле.

### Не входит (без AI / later)

- Автогенерация JSDoc по сложной семантике (→ ai-mods или later)
- Перевод комментариев
- «Функциональные» комментарии на каждую функцию эвристикой без AI

## CLI

| Long | Short | Почему short |
|------|-------|--------------|
| `--strip-comments` | `-sc` | `-s` свободна; mnemonic strip-comments → `-sc` |
| `--comment-banner` | `-cb` | `-c` = commands → `-cb` |

## Правила

1. Не ломать строки и regex; удаление только через AST/tokenizer comments, не regex по файлу.
2. `risk: "caution"` для strip; `safe` для banner.
3. Порядок: после fix-imports/sort/format? **До format** или после — зафиксировать: **comments → format** в конце кодовых ops, но **после** sort/fix. Глобальный порядок: fix-imports → fix-exports → sort-imports → strip/banner → format → env → ai.  
   Практичнее: **format последним** среди code-like ops.
4. Preview/apply через safety.

## Зависимости

- [safety.md](safety.md)
- [s07-flags.md](../../50-cli/s07-flags.md)

## Acceptance criteria

- [ ] `-sc` preview показывает удаление комментариев; `--apply` удаляет
- [ ] License-like `/*!` сохраняется (политика default)
- [ ] Строки с `//` внутри литералов не портятся

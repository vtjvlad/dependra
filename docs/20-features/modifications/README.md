---
title: Подсистема модификации (S07)
status: accepted
mvp: false
source: .dep/.blueprint/20-features/modifications, file-enhancement-functions---E--I--F
tags: [E, I, F]
---

# Подсистема модификации (S07)

## Цель

Отдельная подсистема **записи** (не анализ): по явному запросу пользователя строить и применять безопасные изменения файлов / окружения. Анализ остаётся read-only; модификации — только opt-in.

## Главное правило

> **По умолчанию Dependra никогда не изменяет файлы.**  
> Любая мутация — только после явного `--apply` (или эквивалента в API).  
> Без `--apply` mutate-ops дают **preview / dry-run** (план + diff / change report).

Безопасность и предсказуемость **выше** степени автоматизации.

## Документы этапа

| Документ | Назначение |
|----------|------------|
| [safety.md](safety.md) | Preview, dry-run, backup, undo, selective apply, change report |
| [code-ops.md](code-ops.md) | Format / normalize / sort imports / blank lines |
| [imports-exports-ops.md](imports-exports-ops.md) | Fix / remove / add imports·exports по сигналам анализа |
| [environment-ops.md](environment-ops.md) | Установка npm-зависимостей (явный opt-in) |
| [comments-ops.md](comments-ops.md) | Добавление / удаление / унификация комментариев |
| [ai-mods.md](ai-mods.md) | Опциональные AI-правки (не обязательны для ядра) |
| [../../50-cli/s07-flags.md](../../50-cli/s07-flags.md) | CLI long/short, pipeline, help |

## Границы S07

### Входит

- Safety-каркас + change report в `results`
- Code / imports / comments ops по **целевому** JS-файлу (и минимально связанным local-файлам только если op это явно требует — см. imports)
- Environment: **только** npm/pnpm/yarn/bun install отсутствующих пакетов по манифесту проекта, с явным флагом
- AI modification adapter (optional), тот же конфиг `[ai]`, что S06
- CLI флаги; не в default-all; не в `--level`

### Не входит

- Скрытый автофикс / запись без запроса
- TUI / интерактивный confirm UI (→ S08)
- Системные пакетные менеджеры (apt, brew, winget, …) — только контракт-задел, без реализации S07
- Крупный рефакторинг (перенос функций между файлами, rename symbol project-wide) — deferred / later stage
- TypeScript / JSX как обязательный язык (S09)
- Плагины сторонних форматтеров как жёсткая зависимость ядра (допустим вызов внешнего бинаря best-effort, см. code-ops)

## Архитектурные принципы

1. **Отдельный слой** `modifications/` (или `ops/`) — не инспекторы анализа. Инспекторы остаются read-only.
2. Ops **независимы и комбинируемы**; общий вход — `AnalysisContext` + уже собранные `results` анализа.
3. Повторный полный анализ **не** обязателен: переиспользовать validation / quality / import-export, если они уже в `results` или были prerequisites pipeline.
4. Каждая op → список `Change[]`; safety применяет их единообразно.
5. Результат mutate-pass кладётся в `results` под ключами вроде `modification-plan` / `modification-apply` (см. safety), а не подменяет ключи анализа.

## Зависимости этапа

- S03 validation (сигналы для fix-imports)
- S05 config / reporters
- S06 quality (+ AI stack для ai-mods)

## Roadmap

[handbook/roadmap/stages/07-modifications.md](../../../handbook/roadmap/stages/07-modifications.md)

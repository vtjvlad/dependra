---
title: Последовательность разработки
status: draft
mvp: true
source: .dep/.blueprint/80-roadmap/development-sequence.md, 00-project/main-rule.md
---

# Последовательность разработки

Полная цепочка больших этапов `S01`–`S11`. Детали — в [stages/](stages/), задачи S01 — в [mvp-backlog.md](mvp-backlog.md).

## Обзор

| Этап | Суть | dependsOn |
|------|------|-----------|
| [S01](stages/01-mvp-core.md) | MVP core: спека → каркас → инспекторы B/M → стабилизация | — |
| [S02](stages/02-deepen-analysis.md) | Углубление анализа B/M | S01 |
| [S03](stages/03-validation.md) | Validation (D) | S02 |
| [S04](stages/04-environment-runtime.md) | Environment / runtime (P+U) | S02 |
| [S05](stages/05-visualization-config.md) | Visualization + config (E) | S03 |
| [S06](stages/06-quality-ai.md) | Quality + AI explain (F+I) | S03 |
| [S07](stages/07-modifications.md) | Modifications / enhancement | S05, S06 |
| [S08](stages/08-tui-surfaces.md) | TUI и поверхности | S07 |
| [S09](stages/09-multilang.md) | Multi-language + LSP/Tree-sitter | S08 |
| [S10](stages/10-platform-monorepo.md) | Platform / monorepo | S09 |
| [S11](stages/11-build-system.md) | Build System | S10 |

Параллели: S04 ∥ S03 (после S02); S05 ∥ S06 (после S03). S11 — строго после остальных.

---

## S01 — MVP core (`завершено`)

Внутренние подэтапы (бывшие A–D):

### S01-A — Спека

1. Рабочая спека в `docs/` (MVP до уровня реализации)
2. Handbook: ADR-процесс, backlog, context
3. Review владельцем → перевод ключевых docs в `accepted` — **сделано (MVP-001)**

### S01-B — Каркас кода (после accept спеки)

1. Инициализация `src/` по мере нужды (`cli`, `core`, …) — **MVP-002 сделано**
2. ADR: выбор AST-парсера — **ADR-0001 Acorn (MVP-003)**
3. Контракт инспектора в коде + smoke CLI — **есть**; MVP-004 `parsers` + SourceFile — **сделано**


### S01-C — MVP-инспекторы

1. `basic-file-information` — **MVP-005 сделано**
2. `import-export-analysis` — **MVP-006 сделано**
3. `dependency-analysis` — **MVP-007 сделано**
4. Text + JSON reporters — **MVP-008 сделано**
5. CLI pipeline + тесты на фикстурах — **MVP-009/010 сделано**

### S01-D — Стабилизация

1. Доработка по AC из docs
2. Обновление `handbook/context` — **MVP-011 сделано**
3. Переход к S02 (версия пакета `0.0.33`; дальше **не повышать** без решения владельца)

Задачи: [mvp-backlog.md](mvp-backlog.md) (`MVP-001`…`011` — все `завершено`).

---

## S02 — Углубление анализа B/M (`завершено`)

1. Спека additional-file-information + exported-entities в `docs/`
2. Инспекторы и расширение модели
3. CLI / reporters / тесты
4. Approve → S03 / S04 — **сделано**

## S03 — Validation (D) (в работе · ждёт approve)

1. Спека validation — **сделано**
2. Инспектор + diagnostics в reporters — **сделано**
3. Тесты (cycles, unused, broken imports) — **сделано**
4. Approve владельца ← **сейчас** (нужен до S05/S06 и безопасных modifications)

## S04 — Environment / runtime (P+U) (в работе · ждёт approve)

1. Спека кластеров P и U — **сделано**
2. Инспекторы P — **сделано**
3. Инспекторы U — **сделано**
4. CLI / тесты — **сделано**
5. Approve владельца ← **сейчас**

## S05 — Visualization + config (E)

1. Спека viz + profiles/`--level` + config files + metadata extractors
2. Реализация визуализации и конфигурации
3. Тесты / approve

## S06 — Quality + AI explain (F+I)

1. Спека code-quality
2. Инспектор quality
3. Опциональный AI-adapter (объяснения; ядро без AI)
4. Тесты / approve

## S07 — Modifications

1. Спека safety (preview/backup/undo/dry-run)
2. Safety-каркас
3. Code/import ops → env installs → comments → AI mods
4. Тесты / approve

## S08 — TUI и поверхности

1. Спека TUI над core API
2. TUI MVP
3. Контракты future surfaces (Web/REST/IDE) без полной реализации всех UI
4. Approve

## S09 — Multi-language

1. Спека language-backend adapters
2. Первый язык beyond JS + опционально Tree-sitter/LSP
3. Тесты / approve

## S10 — Platform / monorepo

1. Approve: monorepo действительно нужен
2. Спека layout `apps/` / `packages/`
3. Разбиение по реальной нужде
4. Approve → S11

## S11 — Build System

1. Спека build stages (Clean → Release Bundle) + task system / profiles
2. Incremental / module-build
3. CI / artifacts / release policy
4. Development workflow + approve

---

## Вне последовательности до своего этапа

Monorepo (S10), Build System (S11), полный TUI, modifications, multi-language — только через соответствующий `S0N`/`S11`, не «заодно» с S01.

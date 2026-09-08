---
title: Сводный TODO-чеклист
status: draft
mvp: true
source: handbook/roadmap/stages
---

# Сводный TODO-чеклист

Единая картина прогресса по этапам `S01`–`S10`.  
Детали, `dependsOn` и exit criteria — в [stages/](stages/) и [mvp-backlog.md](mvp-backlog.md).  
При закрытии пункта синхронизируй статус в файле этапа / backlog.

**Активный этап:** S01.

---

## S01 — MVP core

Детали: [stages/01-mvp-core.md](stages/01-mvp-core.md), [mvp-backlog.md](mvp-backlog.md)

### S01-A — Спека
- [ ] MVP-001: утвердить рабочую спеку `docs/` + `handbook/`

### S01-B — Каркас + ADR
- [ ] MVP-002: каркас `src/` (cli, core, регистрация инспекторов)
- [ ] MVP-003: ADR — выбор JS AST-парсера
- [ ] MVP-004: модуль `parsers` + загрузка SourceFile

### S01-C — Инспекторы + reporters + CLI
- [ ] MVP-005: инспектор basic-file-information
- [ ] MVP-006: инспектор import-export-analysis
- [ ] MVP-007: инспектор dependency-analysis
- [ ] MVP-008: reporters text + json
- [ ] MVP-009: CLI флаги MVP + pipeline + коды выхода
- [ ] MVP-010: фикстуры и тесты AC

### S01-D — Стабилизация
- [ ] MVP-011: обновить handbook/context после стабилизации
- [ ] Exit criteria S01 + approve → S02

---

## S02 — Углубление анализа B/M

Детали: [stages/02-deepen-analysis.md](stages/02-deepen-analysis.md)

### S02-A — Спека
- [ ] S02-001: спека additional-file-information в docs
- [ ] S02-002: спека exported-entities (deep) в docs

### S02-B — Инспекторы
- [ ] S02-003: additional file fields
- [ ] S02-004: инспектор exported-entities

### S02-C — CLI / reporters
- [ ] S02-005: CLI флаги и секции отчёта

### S02-D — Тесты
- [ ] S02-006: фикстуры и тесты AC
- [ ] S02-007: approve → S03/S04
- [ ] Exit criteria S02

---

## S03 — Validation (D)

Детали: [stages/03-validation.md](stages/03-validation.md)

### S03-A — Спека
- [ ] S03-001: спека validation в docs

### S03-B — Инспектор
- [ ] S03-002: cycles
- [ ] S03-003: unused imports/exports
- [ ] S03-004: broken imports / path errors

### S03-C — Reporters
- [ ] S03-005: diagnostics в text/JSON

### S03-D — Тесты
- [ ] S03-006: фикстуры и тесты AC
- [ ] S03-007: approve → S05/S06
- [ ] Exit criteria S03

---

## S04 — Environment / runtime (P+U)

Детали: [stages/04-environment-runtime.md](stages/04-environment-runtime.md)

### S04-A — Спека
- [ ] S04-001: спека P-кластера в docs
- [ ] S04-002: спека U-кластера в docs

### S04-B — Инспекторы P
- [ ] S04-003: file-environment
- [ ] S04-004: commands
- [ ] S04-005: environment-validation

### S04-C — Инспекторы U
- [ ] S04-006: runtime-dependency-analysis
- [ ] S04-007: file-operations (I/O)

### S04-D — CLI / тесты
- [ ] S04-008: CLI флаги + reporters
- [ ] S04-009: фикстуры и тесты AC
- [ ] S04-010: approve владельца
- [ ] Exit criteria S04

---

## S05 — Visualization + config (E)

Детали: [stages/05-visualization-config.md](stages/05-visualization-config.md)

### S05-A — Спека
- [ ] S05-001: спека visualization
- [ ] S05-002: спека config / profiles / `--level`
- [ ] S05-003: спека metadata extractors

### S05-B — Visualization
- [ ] S05-004: Mermaid / Graphviz / JSON viz

### S05-C — Config
- [ ] S05-005: profiles + `--level`
- [ ] S05-006: project/user config files

### S05-D — Metadata + тесты
- [ ] S05-007: metadata provider plugins
- [ ] S05-008: тесты AC + approve
- [ ] Exit criteria S05

---

## S06 — Quality + AI explain (F+I)

Детали: [stages/06-quality-ai.md](stages/06-quality-ai.md)

### S06-A — Спека
- [ ] S06-001: спека code-quality
- [ ] S06-002: спека AI explain (optional)

### S06-B — Quality
- [ ] S06-003: инспектор code-quality-analysis
- [ ] S06-004: reporter-секции quality

### S06-C — AI adapter
- [ ] S06-005: AI provider adapter + флаг включения

### S06-D — Тесты
- [ ] S06-006: тесты quality без AI; AI mock/off
- [ ] S06-007: approve владельца
- [ ] Exit criteria S06

---

## S07 — Modifications / enhancement

Детали: [stages/07-modifications.md](stages/07-modifications.md)

### S07-A — Спека
- [ ] S07-001: спека safety (preview/backup/undo/dry-run)
- [ ] S07-002: спека modification ops

### S07-B — Safety-каркас
- [ ] S07-003: safety-каркас в core

### S07-C — Ops
- [ ] S07-004: code ops
- [ ] S07-005: imports/exports fix ops
- [ ] S07-006: environment install ops (opt-in)
- [ ] S07-007: comments ops

### S07-D — AI mods + тесты
- [ ] S07-008: AI modification provider (optional)
- [ ] S07-009: фикстуры, rollback-тесты, approve
- [ ] Default = no mutate без явного запроса
- [ ] Exit criteria S07

---

## S08 — TUI и поверхности

Детали: [stages/08-tui-surfaces.md](stages/08-tui-surfaces.md)

### S08-A — Спека
- [ ] S08-001: спека TUI в docs
- [ ] S08-002: public core API для UI

### S08-B — TUI MVP
- [ ] S08-003: просмотр результатов analysis
- [ ] S08-004: запуск ops + configurator
- [ ] S08-005: save / presentation

### S08-C — Future surfaces
- [ ] S08-006: контракты REST / library / IDE hook

### S08-D — Тесты
- [ ] S08-007: smoke-тесты TUI + approve
- [ ] Exit criteria S08

---

## S09 — Multi-language + LSP/Tree-sitter

Детали: [stages/09-multilang.md](stages/09-multilang.md)

### S09-A — Спека
- [ ] S09-001: ADR — первый язык beyond JS
- [ ] S09-002: спека language-backend adapter contract

### S09-B — Adapters
- [ ] S09-003: adapter + inspectors для языка
- [ ] S09-004: регистрация в core без ломки контракта

### S09-C — Optional providers
- [ ] S09-005: Tree-sitter provider
- [ ] S09-006: LSP provider

### S09-D — Тесты
- [ ] S09-007: фикстуры multi-lang + approve
- [ ] Exit criteria S09

---

## S10 — Platform / monorepo / releases

Детали: [stages/10-platform-monorepo.md](stages/10-platform-monorepo.md)

### S10-A — Спека / решение
- [ ] S10-001: approve — monorepo действительно нужен
- [ ] S10-002: спека apps/packages/inspectors layout
- [ ] S10-003: спека build stages

### S10-B — Разбиение
- [ ] S10-004: выделить packages
- [ ] S10-005: apps/cli (+ daemon при нужде)

### S10-C — CI / release
- [ ] S10-006: CI lint/test/package/artifacts
- [ ] S10-007: release bundle + versioning policy

### S10-D — Verification
- [ ] S10-008: verification checklist + approve
- [ ] Exit criteria S10

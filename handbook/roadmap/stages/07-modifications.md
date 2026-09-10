---
title: S07 — Modifications / enhancement
status: draft
mvp: false
source: .dep/.blueprint/20-features/modifications, file-enhancement-functions---E--I--F
---

# S07 — Modifications / enhancement

| Поле | Значение |
|------|----------|
| **ID** | S07 |
| **Статус** | `запланировано` (спека S07-A готова к review) |
| **dependsOn** | S05, S06 |

## Цель / границы

**Входит:** подсистема модификации файлов с safety-first: preview, dry-run, backup, undo, selective apply, change reports; затем code/import ops, env installs, comments, AI mods.

**Не входит:** скрытые автоправки без запроса; TUI (S08) — только CLI/API ops на этом этапе; системные PM (apt/brew/…); крупный multi-file refactor.

## Зависимости

Нужны validation (S03), удобные отчёты/viz/config (S05), quality signals (S06). Открывает S08.

## Источники

- Рабочие спеки (S07-A, `review`):
  - [`docs/20-features/modifications/README.md`](../../../docs/20-features/modifications/README.md)
  - [`docs/20-features/modifications/safety.md`](../../../docs/20-features/modifications/safety.md)
  - [`docs/20-features/modifications/code-ops.md`](../../../docs/20-features/modifications/code-ops.md)
  - [`docs/20-features/modifications/imports-exports-ops.md`](../../../docs/20-features/modifications/imports-exports-ops.md)
  - [`docs/20-features/modifications/environment-ops.md`](../../../docs/20-features/modifications/environment-ops.md)
  - [`docs/20-features/modifications/comments-ops.md`](../../../docs/20-features/modifications/comments-ops.md)
  - [`docs/20-features/modifications/ai-mods.md`](../../../docs/20-features/modifications/ai-mods.md)
  - CLI: [`docs/50-cli/s07-flags.md`](../../../docs/50-cli/s07-flags.md)
- Blueprint (архив):
  - [modifications/](../../../.dep/.blueprint/20-features/modifications/README.md)
  - [file-enhancement-functions---E--I--F](../../../.dep/.blueprint/20-features/file-enhancement-functions---E--I--F/README.md)

## CLI / short (сводка)

| Long | Short | Заметка |
|------|-------|---------|
| `--format` | `-f` | normalize / format |
| `--sort-imports` | `-si` | sort import blocks |
| `--fix-imports` | `-fi` | unused/broken imports |
| `--fix-exports` | `-fe` | unused exports |
| `--strip-comments` | `-sc` | remove comments |
| `--install-deps` | `-id` | PM install (dangerous) |
| `--ai-modify` | `-am` | AI patch (optional) |
| `--apply` | `-ap` | write/exec |
| `--dry-run` | `-dr` | no write (wins over apply) |
| `--undo` | `-u` | restore backup |

Не в default-all / `--level`. Без `--apply` = preview. Help: `operations · s07`.

## Подэтапы

| ID | Название | Статус |
|----|----------|--------|
| S07-A | Спека safety + ops | `завершено` (docs `review`, ждёт approve) |
| S07-B | Safety-каркас | `запланировано` |
| S07-C | Code / import / env / comments ops | `запланировано` |
| S07-D | AI mods (optional) + тесты | `запланировано` |

## Задачи

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| S07-001 | Спека safety (preview/backup/undo/dry-run) | высокий | S05, S06 | `завершено` |
| S07-002 | Спека modification ops (code/imports/env/comments) | высокий | S07-001 | `завершено` |
| S07-003 | Safety-каркас в core (без реальных ops) | высокий | S07-001 | `запланировано` |
| S07-004 | Code ops (format/normalize/sort imports…) | высокий | S07-003, S07-002 | `запланировано` |
| S07-005 | Imports/exports fix ops | высокий | S07-004 | `запланировано` |
| S07-006 | Environment install ops (явный opt-in) | средний | S07-003 | `запланировано` |
| S07-007 | Comments ops | средний | S07-003 | `запланировано` |
| S07-008 | AI modification provider (optional) | низкий | S07-003, S06 AI | `запланировано` |
| S07-009 | Фикстуры, rollback-тесты, approve | высокий | S07-004…008 | `запланировано` |

## Чеклист этапа

- [x] S07-A: спеки safety и ops в `docs/`
- [ ] S07-B: preview/dry-run/backup/undo работают
- [ ] S07-C: code/import/(env)/comments ops
- [ ] S07-D: AI mods optional; тесты rollback
- [ ] Default = no mutate без явного запроса
- [ ] Exit criteria + approve

## Exit criteria

1. Любая мутация требует явного запроса и поддерживает dry-run.
2. Backup/undo покрыты тестами на фикстурах.
3. Approve → S08.

---
title: TUI — попапы и потоки
status: review
mvp: false
source: docs/50-tui/overview.md
---

# TUI — попапы и потоки

## Inspector picker

Открывается после выбора файла.

- Список из `listOperations()`: группы `analysis` | `mutate` | `ai`
- Multi-select по option-keys (`basic`, `imports`, …), не по сырым inspector ids
- Пустой выбор → default `whenNoFlags` из конфига (`s01-all` = basic+imports+exports+graph)
- Mutate ops: передаются в `options` вместе с `dryRun`/`apply`/`backup` как в CLI (по умолчанию dry-run для mutate, пока пользователь не включит apply в picker)

## Text result

После `analyze()`:

1. `formatText(report, { report: model.report })`
2. Попап со scroll (`j`/`k`, PgUp/PgDn)
3. `Esc` / `q` — закрыть и вернуться к browser

## Settings

Две вкладки:

1. **TUI** — `theme`, `showHidden`, `showKeyHints` → `tui.json`
2. **Configurator** — модель `dependra.conf` (pathMode, output, defaults, operations, report, profiles, ai без секретов) → `serializeConf` + `saveConf`

Сохранение: `Enter` на «Save» или `:w` в command line попапа.

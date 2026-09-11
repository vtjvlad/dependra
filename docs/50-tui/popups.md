---
title: TUI — попапы и потоки
status: accepted
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
2. Попап со scroll (`j`/`k`, wheel, PgUp/PgDn)
3. `Esc` / `q` — закрыть и вернуться к browser

## Settings

Две вкладки:

1. **TUI** — блоки «Внешний вид» / «Дерево файлов»: `theme` (10 схем), `showHidden`, `showKeyHints` → `tui.json`
2. **Configurator** — `dependra.conf` по логическим блокам с описаниями → `serializeConf` + `saveConf`

Сохранение: `w`. Описание текущего параметра — в нижней строке помощи.

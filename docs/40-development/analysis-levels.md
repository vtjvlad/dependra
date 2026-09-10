---
title: Уровни анализа
status: accepted
mvp: true
source: .dep/.blueprint/40-development-guidelines/analysis-levels.md
---

# Уровни анализа

## Цель

Концептуальная карта глубины анализа. Уровни — **конфигурация / сахар CLI**, не жёсткий код инспекторов.

## MVP (S01, исторически)

**Флаг `--level` в CLI S01 не реализовывался.** Пользователь включал операции явными флагами.

| Level | Эквивалент флагов MVP | Заметка |
|-------|----------------------|---------|
| **1** | `--basic` | |
| **2** | нет в MVP | Не эмулировать noop-level |
| **3** | `--basic --imports --exports --graph` (или default-all) | |

## S05 — `--level` / `-l`

Сахар над композицией операций. Раскрытие — в CLI/config layer ([s05-config.md](../35-configuration/s05-config.md)), **не** внутри inspectors.

| Level | Включаемые operations (OR-набор) |
|-------|----------------------------------|
| **1** | `basic` |
| **2** | `basic`, `additional`, `environment` |
| **3** | level **2** + `imports`, `exports`, `graph` |
| **4** | level **3** + `entities`, `validate`, `quality` |
| **5** | level **4** + `mermaid`, `metadata` |

Пояснения:

- Level **2** использует уже существующие S02/S04 ops (`additional`, `environment`), без noop.
- Level **4** (S06): добавляет `quality` (`-q`); **не** включает `explain` / AI.
- Level **5** включает **один** viz-формат по умолчанию (`mermaid`); `graphviz` / `viz-json` — только явными флагами.
- S04 ops (`commands`, `envCheck`, `runtime`, `io`) и S06 `explain` в levels **не** входят — только явными флагами / профилем / `ai.explain`.
- Спека quality / explain: [code-quality-analysis.md](../20-features/analysis/code-quality-analysis.md), [ai-explain.md](../20-features/analysis/ai-explain.md), [s06-flags.md](../50-cli/s06-flags.md).

### Правила

1. `--level <n>` / `-l <n>`, `n` ∈ 1..5.
2. Явные op-флаги **добавляются** к набору level (OR).
3. Level + profile → OR операций; явный CLI выше по pathMode/output.
4. Не зашивать номера уровней в инспекторы.
5. Можно менять состав levels в конфиге **будущим** полем `levels` (не в S05 schema min) — сейчас таблица фиксирована спекой.

## Зависимости

- [s05-config.md](../35-configuration/s05-config.md)
- [s05-flags.md](../50-cli/s05-flags.md)
- [interface.md](../50-cli/interface.md)

## Acceptance criteria

- [ ] S01/MVP: без `--level` в старых AC — поведение сохранено, пока флаг не передан
- [ ] `--level 1` → только basic (если нет других ops)
- [ ] `--level 3` → basic+additional+environment+imports+exports+graph
- [ ] `--level 4` включает quality (не explain)
- [ ] `--level 5` включает mermaid+metadata
- [ ] Инспекторы не ветвятся по номеру level
- [ ] Неверный level → exit 1

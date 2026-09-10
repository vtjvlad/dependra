---
title: Safety модификаций
status: accepted
mvp: false
source: .dep/.blueprint/20-features/modifications/safety.md
tags: [E, I, F]
---

# Safety модификаций (S07)

## Цель

Единый каркас для **любой** операции, которая может изменить FS: preview, dry-run, backup, undo, selective apply, change report. Без этого каркаса mutate-ops не пишут на диск.

## Границы

### Входит

- Модель `Change` / `ChangeSet` / `ModificationReport`
- Режимы: `preview` (default без `--apply`), `apply`, принудительный `--dry-run`
- Backup перед первой записью сессии; `undo` последней сессии
- Selective apply по `changeId` / фильтрам
- JSON + text отчёт обо всех предложенных / применённых изменениях
- Инвариант: анализ-инспекторы **никогда** не вызывают safety write API

### Не входит

- Интерактивный TUI confirm (S08)
- Распределённый / сетевой undo
- Git commit/stash как единственный механизм backup (git — optional later; S07 = файловый backup dir)
- Автоприменение по cron / watch

## Режимы

| Режим | Условие | Запись на диск |
|-------|---------|----------------|
| `preview` | есть mutate-op **и** нет `--apply` | нет (только plan) |
| `dry-run` | `--dry-run` / `-dr` (даже вместе с `--apply`) | нет; `--dry-run` **побеждает** |
| `apply` | `--apply` / `-ap` и **нет** dry-run | да, после backup (если не `--no-backup`) |

Без хотя бы одного mutate-op флаги `--apply` / `--dry-run` / `--backup` **не** запускают mutate-pass (warning в stderr допустим; exit 0 если анализ ok).

## Модель данных

```js
/**
 * @typedef {"create"|"update"|"delete"|"rename"|"exec"} ChangeKind
 * // exec — side-effect вне файла (напр. package install); тоже в отчёте
 *
 * @typedef {object} Change
 * @property {string} id            стабильный id в рамках запуска (напр. "c1")
 * @property {ChangeKind} kind
 * @property {string} path          abs path цели (для exec — манифест / cwd marker)
 * @property {string} [display]     pathMode-aware
 * @property {string} op            id операции-источника: "format"|"fix-imports"|…
 * @property {string} summary       коротко
 * @property {string} [before]      полный или усечённый до лимита
 * @property {string} [after]
 * @property {string} [diff]        unified diff (предпочтительно для text)
 * @property {object} [loc]         { startLine, endLine } если уместно
 * @property {boolean} [selected]   default true; selective apply
 * @property {"safe"|"caution"|"dangerous"} risk
 */

/**
 * @typedef {object} ModificationReport
 * @property {"preview"|"dry-run"|"apply"} mode
 * @property {Change[]} changes
 * @property {string[]} appliedIds
 * @property {string[]} skippedIds
 * @property {object|null} backup   { sessionId, dir, createdAt } | null
 * @property {object} summary       { proposed, applied, failed, byOp }
 */
```

## Backup

1. При `mode === "apply"` и **не** `--no-backup`: перед первой записью создать session dir.
2. Рекомендуемый путь: `<project>/.dependra/backup/<sessionId>/` (или `os.tmpdir()/dependra-backup/<sessionId>/` если `.dependra` нельзя создать — зафиксировать в реализации; в JSON указать фактический `dir`).
3. Копировать **только** файлы, которые будут записаны (`kind: update|delete|rename`); для `create` — достаточно метаданных в манифесте сессии.
4. Манифест сессии: `session.json` со списком путей, timestamp, argv summary (без секретов).
5. `--backup` / `-bk` сам по себе **не** мутирует; вместе с apply усиливает «backup required» (redundant if default on).
6. `--no-backup` разрешён только с явным осознанием; в report `backup: null` + warning.

## Undo

| Long | Short | Поведение |
|------|-------|-----------|
| `--undo` | `-u` | Восстановить файлы из **последней** session (или `--undo-session <id>`) |

- Undo — **отдельный** режим CLI: можно без mutate-ops и без `<file>` analysis ops; target file для undo не обязателен, если session известен. Практично: `dependra --undo` из cwd проекта.
- Не удаляет session dir сразу (оставить для аудита); опционально `--undo-purge` — **не** в min S07.
- Если session нет → exit 1, код понятный (`NO_BACKUP_SESSION`).

## Selective apply

- `--change <id>` (repeatable) или `--changes <id,id,…>`: применить только выбранные.
- Без фильтра при `--apply` — все `selected: true` (default все).
- Op может заранее пометить `selected: false` для dangerous пунктов, требующих явного `--change`.

## Ключи в `results`

| Ключ | Когда |
|------|--------|
| `modification-plan` | Любой mutate-op (всегда plan, в т.ч. перед apply) |
| `modification-apply` | Только `mode === "apply"` (итог записи) |
| `modification-undo` | Режим `--undo` |

`modification-plan.data` ≈ `ModificationReport` с `mode: preview|dry-run|apply` (при apply plan отражает **предложенное** до записи; apply-ключ — факт).

Допустимо объединить plan+apply в один ключ `modification` с полями `plan` / `apply` — тогда AC и reporters используют **один** ключ `modification`. Предпочтение S07: **один** ключ `modification`:

```json
{
  "mode": "preview",
  "changes": [],
  "appliedIds": [],
  "skippedIds": [],
  "backup": null,
  "summary": { "proposed": 0, "applied": 0, "failed": 0, "byOp": {} }
}
```

## Pipeline (mutate-pass)

После анализа (если нужны prerequisites):

1. Собрать `Change[]` от всех запрошенных mutate-ops (порядок: code → imports → comments → env → ai; детерминированно).
2. Построить report (`mode` по флагам).
3. Если preview/dry-run → записать в `results.modification`, **стоп** (без FS write).
4. Если apply → backup → применить selected → обновить report (`appliedIds` / ошибки per change).
5. Ошибка одной change **не** обязана откатывать уже записанные в S07 min — но session backup позволяет `--undo`. Ideal: best-effort continue + `failed` в summary. (Строгий all-or-nothing — optional later.)

## Ошибки

| code | Когда | exit |
|------|-------|------|
| `NO_MUTATE_OPS` | только `--apply` без ops | 1 (или 0+stderr; **предпочтение: 1**) |
| `BACKUP_FAILED` | не удалось создать backup | 1, без записи |
| `APPLY_FAILED` | частичные/полные сбои записи | 1 если любой failed |
| `NO_BACKUP_SESSION` | undo без session | 1 |
| `UNDO_FAILED` | не восстановили | 1 |

## Правила

1. Mutate-ops **не** в default-all и **не** в `--level` 1..5.
2. Preview по умолчанию при любом mutate-op без `--apply`.
3. `--dry-run` всегда без записи.
4. Секреты / API keys не писать в backup манифест и JSON report.
5. `risk: "dangerous"` (env install, AI rewrite) требует `--apply` и не применяется «молча» через широкие профили.

## Зависимости

- [README.md](README.md)
- [s07-flags.md](../../50-cli/s07-flags.md)
- Ops: [code-ops.md](code-ops.md), [imports-exports-ops.md](imports-exports-ops.md), [environment-ops.md](environment-ops.md), [comments-ops.md](comments-ops.md), [ai-mods.md](ai-mods.md)

## Acceptance criteria

- [ ] Mutate-op без `--apply` → `mode: "preview"`, файлы байт-в-байт неизменны
- [ ] `--dry-run` + `--apply` → нет записи
- [ ] `--apply` создаёт backup (если не `--no-backup`) и пишет только selected changes
- [ ] `--undo` восстанавливает содержимое из последней session на фикстуре
- [ ] Report в JSON содержит `changes[]` с `id`, `op`, `summary`
- [ ] Анализ-инспекторы не пишут на диск даже при `--apply`

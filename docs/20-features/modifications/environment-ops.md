---
title: Environment operations
status: review
mvp: false
source: .dep/.blueprint/20-features/modifications/environment-operations.md
tags: [P, U]
---

# Environment operations (S07)

## Цель

Явный opt-in на **установку отсутствующих JS-зависимостей** пакетным менеджером проекта. Высокий risk; никогда не в levels / default-all.

## Границы

### Входит

| Op id | CLI | Суть |
|-------|-----|------|
| `install-deps` | `--install-deps` / `-id` | Установить missing packages, обнаруженные анализом (runtime / env-check / bare imports), через детектированный PM |

Поддержка PM (detect по lockfile / packageManager field): `npm` | `pnpm` | `yarn` | `bun`.

### Не входит (S07)

- apt / dnf / brew / winget / pip / gem / cargo / snap / flatpak (blueprint-список — **задел**, без реализации)
- Глобальный `npm i -g`
- Смена version ranges в `package.json` без явного будущего флага (S07: только install того, что уже в dependencies/devDependencies или явно listed в Change)
- Автозапуск install при `-ec` / `-r`

**Уточнение min:** ставить пакеты, которые **уже объявлены** в манифесте, но отсутствуют в `node_modules` (repair install), **или** один пакет, явно указанный `--install-package <name>` (optional CLI). Автодобавление новых deps в `package.json` из bare import — **опционально** отдельным `--add-deps` / later; не обязателен для exit criteria S07.

Рекомендация для AC S07:  
`dependra app.js -id --apply` → `npm ci` / `npm install` (или PM-equivalent) в project root при missing modules из lock/manifest — dry-run печатает команду без exec.

## CLI

| Long | Short | Почему short |
|------|-------|--------------|
| `--install-deps` | `-id` | `-i` = imports → `-id` |

Дополнительно (optional min):

| Long | Arg | Смысл |
|------|-----|--------|
| `--pm` | `npm\|pnpm\|yarn\|bun` | override автодетекта |
| `--install-package` | name | точечная установка (может обновить package.json — `risk: dangerous`) |

## Risk

Все env Changes: `risk: "dangerous"`, `kind: "exec"`.

Selective apply: при широком `--apply` dangerous exec **требует** либо явного `-id` (уже явный), либо не требует `--change` дополнительно — сам флаг `-id` = согласие.  
`--install-package` всегда dangerous.

## Preview / dry-run

Не выполнять PM; в Change:

```json
{
  "id": "c1",
  "kind": "exec",
  "op": "install-deps",
  "risk": "dangerous",
  "summary": "npm install",
  "details": { "pm": "npm", "cwd": "/proj", "argv": ["install"], "packages": [] }
}
```

## Apply

1. Backup **не** покрывает node_modules целиком (слишком большой). Backup session фиксирует `exec` манифест; undo **не** откатывает node_modules в S07 (документировать: undo ≠ uninstall).
2. Запуск PM с таймаутом; stdout/stderr PM → в details / stderr CLI.
3. Failure PM → `APPLY_FAILED`, exit 1.

## Правила

1. Только с `-id` (и обычно `--apply` для реального exec).
2. Не в level / default-all / profile sugar без явного op в conf `operations.installDeps` (если conf OR — всё равно нужен apply для записи/exec).
3. Не смешивать с системными PM.
4. Рабочий cwd = корень пакета с `package.json` (поиск вверх от target).

## Зависимости

- [environment-validation.md](../analysis/environment-validation.md) (сигналы missing — optional)
- [runtime-dependency-analysis.md](../analysis/runtime-dependency-analysis.md)
- [safety.md](safety.md)
- [s07-flags.md](../../50-cli/s07-flags.md)

## Acceptance criteria

- [ ] `-id` без `--apply` → plan с `kind: "exec"`, PM не запускался
- [ ] `-id --apply` на фикстуре с missing module → PM вызван (можно stub в тестах)
- [ ] `--dry-run` блокирует exec даже с `--apply`
- [ ] Undo не обещает откат node_modules

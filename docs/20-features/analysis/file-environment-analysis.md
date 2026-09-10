---
title: Исследование окружения файла
status: draft
mvp: false
source: .dep/.blueprint/20-features/file-environment-analysis---P
tags: [P]
---

# Исследование окружения файла (−P, S04)

## Цель

Показать **окружение** целевого файла: ссылки (symlink / hard link), связанные скрипты и эвристические точки входа — только анализ, без мутаций FS.

## Границы

### Входит (S04)

- Symlink: является ли цель symlink; куда указывает (`realpath` best-effort)
- Hard links: `nlink > 1` (если FS отдаёт); поиск других путей с тем же inode в корне проекта (best-effort, лимит скана)
- Shebang / shell-скрипты в корне проекта, которые **упоминают** целевой файл (строковый путь / basename) — `*.sh`, файлы с `#!/…`
- Эвристика точек входа: `package.json` `main` / `bin` / `scripts` значения, указывающие на цель; CLI shebang `#!/usr/bin/env node` у самой цели
- Расположение находок с `--path-mode`

### Не входит

- Windows `.lnk` / macOS aliases как полноценный парсинг (можно `info`, что «не поддержано на платформе»)
- Полный обход crontab системы; только если доступен пользовательский crontab **и** это не требует интерактива — иначе skip + `details.crontabSkipped`
- Установка / правка ссылок (S07)
- Индексация всего диска; корень скана — как у graph: ближайший `package.json` вверх от файла, иначе `cwd`; skip `node_modules`, `.git`

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--environment` | `-env` | `-e` = exports, `-en` = entities → третья буква → `-env` |

Не в default-all.  
Спека флагов: [s04-flags.md](../../50-cli/s04-flags.md).

## Инспектор

- id: `file-environment-analysis`
- Ключ в `results` только при `--environment` / `-env`
- Text-секция: `environment`

## Вход

- Существующий `targetPath`
- `options.pathMode`
- Чтение FS metadata + ограниченный scan корня

## Выход (`data`)

```json
{
  "pathMode": "relative",
  "symlink": {
    "isSymlink": false,
    "target": null,
    "realpath": "/abs/proj/src/app.js"
  },
  "hardLink": {
    "nlink": 1,
    "inode": "12345",
    "peers": []
  },
  "scripts": [
    {
      "display": "scripts/run.sh",
      "path": "/abs/proj/scripts/run.sh",
      "kind": "shell",
      "mention": "basename"
    }
  ],
  "entryPoints": [
    {
      "kind": "package-bin",
      "display": "package.json#bin.app",
      "path": "/abs/proj/package.json"
    }
  ],
  "details": {}
}
```

`scripts[].kind`: `"shell"` \| `"bash"` \| `"other"`.  
`entryPoints[].kind`: `"package-main"` \| `"package-bin"` \| `"package-script"` \| `"shebang"`.

## Правила

1. Только чтение FS / `package.json`; никаких `ln`/`chmod`.
2. Hard-link peers: тот же dev+inode, только внутри корня проекта; лимит кандидатов как у additional copies (разумный cap, напр. 5000 файлов) — при превышении `details.scanTruncated: true`.
3. Упоминание в скрипте: basename цели или relative/absolute path substring — best-effort, возможны ложные срабатывания в пределах AC фикстур.
4. Ошибки чтения отдельных кандидатов → skip, не падение всего инспектора.
5. На не-POSIX (нет inode) — `hardLink.peers: []`, `details.hardLinksUnsupported` при необходимости.

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет целевого файла |
| `NOT_A_FILE` | validation | Цель не файл |
| `READ_FAILED` | execution | Не прочитать metadata цели |
| `SCAN_FAILED` | execution | Сбой обхода корня |

## Зависимости

- [scan / root](dependency-analysis.md) (правила корня)
- [s04-flags.md](../../50-cli/s04-flags.md)
- [inspector-contract.md](../../20-architecture/inspector-contract.md)

## Acceptance criteria

- [ ] `-env` / `--environment` → ключ `file-environment-analysis`
- [ ] Symlink-поля заполнены на обычном файле и на фикстуре-symlink (если платформа позволяет)
- [ ] `nlink` присутствует (или явно unsupported в details)
- [ ] Хотя бы один script или entryPoint на фикстуре с `package.json` bin/main
- [ ] Нет записи в FS (только анализ)
- [ ] Не в default-all

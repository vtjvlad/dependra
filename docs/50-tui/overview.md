---
title: TUI (S08)
status: accepted
mvp: false
source: .dep/.blueprint/50-user/tui, handbook/roadmap/stages/08-tui-surfaces.md
---

# TUI (S08)

## Цель

Дополнительный консольный интерфейс над публичным API ядра. Не заменяет CLI.

## Границы

### Входит

- File browser: раскрываемое **дерево** проекта с иконками **Devicons** (`devicons` + Nerd Fonts `nf-dev-*`)
- Vim-like клавиши + мышь (wheel / hover)
- Попап выбора операций (инспекторов) при выборе файла
- Попап текстового отчёта
- Попап настроек: TUI prefs (темы) + configurator `dependra.conf` (блоки + описания)
- Запуск только через `src/api` (не internals инспекторов)
- Контракты future surfaces (docs)

### Не входит

- Web UI / Desktop IDE client
- REST/library/IDE — только контракты ([future-surfaces.md](future-surfaces.md))
- React / Ink

## Запуск

```
dependra --tui
dependra -t
dependra tui
```

Требуется интерактивный TTY. Без TTY — exit `1` с сообщением.

## UX

| Элемент | Поведение |
|---------|-----------|
| Главный экран | **Дерево проекта** (раскрываемые каталоги, иконки типов файлов) |
| Выбор файла | `Enter` → попап multi-select операций → Run |
| Каталог | `Enter` / `Space` / `l` — раскрыть; `h` — свернуть / к родителю |
| Результаты | Scrollable text-попап (`formatText(report)`) |
| Настройки | `s` или `:settings` → вкладки TUI / Configurator |
| Выход | `q` |

## Keymap

| Клавиша | Действие |
|---------|----------|
| `hjkl` / стрелки / **мышь** | Навигация; колесо и touchpad-свайп — прокрутка; hover подсвечивает строку |
| `Enter` / `Space` | Файл → inspector picker; каталог → раскрыть/свернуть |
| `l` / `→` | Раскрыть каталог / войти в первую дочернюю строку |
| `h` / `←` | Свернуть каталог / перейти к родителю |
| `/` | Фильтр/поиск по дереву |
| `:` | Command line (`settings`, `q`, `quit`) |
| `s` | Settings popup |
| `Esc` | Закрыть попап / отменить command |
| `q` | Выход из TUI |
| `Space` (в picker) | Toggle операции |
| `r` (в picker) | Run |
| `Tab` (в settings) | Переключить вкладку TUI / Config |

## Стек

- `neo-blessed` — виджеты и модалки
- `devicons` + `@m234/nerd-fonts` — иконки дерева
- Код: `src/tui/`, bridge только к `src/api`

## TUI prefs

Файл: `$XDG_CONFIG_HOME/dependra/tui.json` или `~/.config/dependra/tui.json`.

| Ключ | Тип | Default | Описание |
|------|-----|---------|----------|
| `theme` | string | `"default"` | Цветовая схема: `default`, `dim`, `ocean`, `forest`, `amber`, `slate`, `crimson`, `nord`, `mono`, `paper` |
| `showHidden` | bool | `false` | Показывать скрытые файлы/каталоги |
| `showKeyHints` | bool | `true` | Строка подсказок внизу |

## Configurator

Вкладка Config: параметры сгруппированы по блокам (Сохранение, Общие, Defaults, Отчёт, AI, Операции·анализ, Операции·модификации) с краткими описаниями блока и каждого ключа. Запись через `serializeConf` / `saveConf`.

## Acceptance criteria

- [x] TUI не импортирует `src/inspectors/*` / `src/parsers/*` напрямую
- [x] Выбор файла открывает picker операций
- [x] Отчёт показывается текстом в попапе
- [x] Settings сохраняет TUI prefs и `dependra.conf`

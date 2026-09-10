---
title: TUI (S08)
status: review
mvp: false
source: .dep/.blueprint/50-user/tui, handbook/roadmap/stages/08-tui-surfaces.md
---

# TUI (S08)

## Цель

Дополнительный консольный интерфейс над публичным API ядра. Не заменяет CLI.

## Границы

### Входит

- File browser (список/дерево проекта)
- Vim-like клавиши
- Попап выбора операций (инспекторов) при выборе файла
- Попап текстового отчёта
- Попап настроек: TUI prefs + полный configurator `dependra.conf`
- Запуск только через `src/api` (не internals инспекторов)

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
| Главный экран | Список файлов от project root (ncdu/mc-стиль) |
| Выбор файла | `Enter` → попап multi-select операций → Run |
| Результаты | Scrollable text-попап (`formatText(report)`) |
| Настройки | `s` или `:settings` → вкладки TUI / Configurator |
| Выход | `q` |

## Keymap

| Клавиша | Действие |
|---------|----------|
| `hjkl` / стрелки / **мышь** | Навигация; колесо и touchpad-свайп — прокрутка; hover подсвечивает строку |
| `Enter` | Выбрать файл → inspector picker |
| `/` | Фильтр/поиск по списку |
| `:` | Command line (`settings`, `q`, `quit`) |
| `s` | Settings popup |
| `Esc` | Закрыть попап / отменить command |
| `q` | Выход из TUI |
| `Space` (в picker) | Toggle операции |
| `r` (в picker) | Run |
| `Tab` (в settings) | Переключить вкладку TUI / Config |

## Стек

- `neo-blessed` — виджеты и модалки
- Код: `src/tui/`, bridge только к `src/api`

## TUI prefs

Файл: `$XDG_CONFIG_HOME/dependra/tui.json` или `~/.config/dependra/tui.json`.

| Ключ | Тип | Default | Описание |
|------|-----|---------|----------|
| `theme` | `"default"` \| `"dim"` | `"default"` | Палитра рамок/focus |
| `showHidden` | bool | `false` | Показывать скрытые файлы/каталоги |
| `showKeyHints` | bool | `true` | Строка подсказок внизу |

## Acceptance criteria

- [ ] TUI не импортирует `src/inspectors/*` / `src/parsers/*` напрямую
- [ ] Выбор файла открывает picker операций
- [ ] Отчёт показывается текстом в попапе
- [ ] Settings сохраняет TUI prefs и `dependra.conf`

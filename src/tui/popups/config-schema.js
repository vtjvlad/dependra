/**
 * Configurator schema: logical blocks + parameter help text.
 * @see docs/35-configuration/s05-config.md
 */

/** @typedef {"toggle"|"cycle"|"none"} FieldKind */

/**
 * @typedef {object} FieldDef
 * @property {string} id
 * @property {string} label
 * @property {string} help
 * @property {FieldKind} [kind]
 */

/**
 * @typedef {object} SectionDef
 * @property {string} id
 * @property {string} title
 * @property {string} help
 * @property {FieldDef[]} fields
 */

/** Analysis ops (read-only inspectors). */
export const ANALYSIS_OPS = [
  { key: "basic", help: "метаданные файла (размер, пути, mtime)" },
  { key: "imports", help: "список import / require" },
  { key: "exports", help: "список export / module.exports" },
  { key: "graph", help: "граф зависимостей imported-by / imports" },
  { key: "additional", help: "доп. пути, права, копии файла" },
  { key: "entities", help: "символы import/export (имена)" },
  { key: "validate", help: "диагностика: циклы, unused, broken imports" },
  { key: "environment", help: "окружение файла: scripts, entryPoints" },
  { key: "commands", help: "какие CLI-утилиты встречаются в коде" },
  { key: "envCheck", help: "проверка наличия node/npm и т.п." },
  { key: "runtime", help: "runtime-зависимости запуска" },
  { key: "io", help: "операции чтения/записи/удаления файлов" },
  { key: "mermaid", help: "визуализация графа в Mermaid" },
  { key: "graphviz", help: "визуализация графа в Graphviz DOT" },
  { key: "vizJson", help: "JSON-модель для внешней визуализации" },
  { key: "metadata", help: "расширенные метаданные / embedded text" },
  { key: "quality", help: "метрики и findings качества кода" },
];

/** Mutate ops (may change files; safety via dry-run/apply). */
export const MUTATE_OPS = [
  { key: "format", help: "форматирование кода" },
  { key: "sortImports", help: "сортировка import-строк" },
  { key: "fixImports", help: "исправление / чистка imports" },
  { key: "fixExports", help: "исправление exports" },
  { key: "stripComments", help: "удаление комментариев (с оговорками)" },
  { key: "commentBanner", help: "добавить файловый banner-комментарий" },
  { key: "installDeps", help: "установка недостающих npm-зависимостей" },
  { key: "aiModify", help: "AI-патч файла по инструкции" },
];

/**
 * TUI preferences sections.
 * @returns {SectionDef[]}
 */
export function tuiSections() {
  return [
    {
      id: "tui-appearance",
      title: "Внешний вид",
      help: "Тема и оформление интерактивного TUI",
      fields: [
        {
          id: "theme",
          label: "theme",
          help: "цветовая схема TUI (Space — следующая: default, ocean, forest, amber…)",
          kind: "cycle",
        },
      ],
    },
    {
      id: "tui-browser",
      title: "Дерево файлов",
      help: "Поведение браузера проекта в TUI",
      fields: [
        {
          id: "showHidden",
          label: "showHidden",
          help: "показывать скрытые файлы и каталоги (имя начинается с .)",
          kind: "toggle",
        },
        {
          id: "showKeyHints",
          label: "showKeyHints",
          help: "строка подсказок клавиш внизу экрана",
          kind: "toggle",
        },
      ],
    },
  ];
}

/**
 * dependra.conf sections.
 * @returns {SectionDef[]}
 */
export function configSections() {
  return [
    {
      id: "save",
      title: "Сохранение",
      help: "Куда записать dependra.conf при Save (w)",
      fields: [
        {
          id: "confTarget",
          label: "save target",
          help: "project — конфиг в корне проекта; user — ~/.config/dependra/",
          kind: "cycle",
        },
      ],
    },
    {
      id: "general",
      title: "Общие",
      help: "Базовые параметры анализа и CLI",
      fields: [
        {
          id: "pathMode",
          label: "pathMode",
          help: "формат путей в отчётах: name | relative | absolute",
          kind: "cycle",
        },
        {
          id: "output",
          label: "output",
          help: "формат вывода по умолчанию: text или json",
          kind: "cycle",
        },
        {
          id: "strict",
          label: "strict",
          help: "ошибка на неизвестных ключах конфига (иначе warning)",
          kind: "toggle",
        },
      ],
    },
    {
      id: "defaults",
      title: "Defaults",
      help: "Поведение, когда не указаны operation-флаги",
      fields: [
        {
          id: "whenNoFlags",
          label: "whenNoFlags",
          help: "s01-all — basic+imports+exports+graph; none — ничего не включать",
          kind: "cycle",
        },
      ],
    },
    {
      id: "report",
      title: "Отчёт",
      help: "Оформление текстового / JSON отчёта",
      fields: [
        {
          id: "report.style",
          label: "style",
          help: "schematic — рамки и акценты; plain — простой текст",
          kind: "cycle",
        },
        {
          id: "report.color",
          label: "color",
          help: "ANSI-цвет: auto (TTY) | always | never",
          kind: "cycle",
        },
        {
          id: "report.banner",
          label: "banner",
          help: "показывать баннер dependra в начале text-отчёта",
          kind: "toggle",
        },
        {
          id: "report.unicode",
          label: "unicode",
          help: "unicode-символы в schematic-оформлении",
          kind: "toggle",
        },
        {
          id: "report.verbosity",
          label: "verbosity",
          help: "объём деталей: quiet | normal | verbose",
          kind: "cycle",
        },
      ],
    },
    {
      id: "ai",
      title: "AI",
      help: "Провайдер объяснений и AI-модификаций (ключ только через apiKeyEnv)",
      fields: [
        {
          id: "ai.enabled",
          label: "enabled",
          help: "разрешить вызовы AI-провайдера",
          kind: "toggle",
        },
        {
          id: "ai.explain",
          label: "explain",
          help: "включать AI-explain вместе с quality при запросе",
          kind: "toggle",
        },
        {
          id: "ai.provider",
          label: "provider",
          help: "openai — реальный API; mock — заглушка для тестов",
          kind: "cycle",
        },
      ],
    },
    {
      id: "ops-analysis",
      title: "Операции · анализ",
      help: "Инспекторы: только чтение и отчёт, файлы не меняют",
      fields: ANALYSIS_OPS.map((op) => ({
        id: `op.${op.key}`,
        label: op.key,
        help: op.help,
        kind: /** @type {FieldKind} */ ("toggle"),
      })),
    },
    {
      id: "ops-mutate",
      title: "Операции · модификации",
      help: "Могут менять файлы; по умолчанию preview/dry-run, apply — явно",
      fields: MUTATE_OPS.map((op) => ({
        id: `op.${op.key}`,
        label: op.key,
        help: op.help,
        kind: /** @type {FieldKind} */ ("toggle"),
      })),
    },
  ];
}

import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { ParserError } from "./errors.js";

/**
 * Проверяет, что путь существует и является файлом.
 * @param {string} absPath
 */
export function assertReadableFile(absPath) {
  if (!existsSync(absPath)) {
    throw new ParserError(
      "FILE_NOT_FOUND",
      `Файл не найден: ${absPath}`,
      "validation",
      { filePath: absPath },
    );
  }

  let st;
  try {
    st = statSync(absPath);
  } catch (err) {
    throw new ParserError(
      "READ_FAILED",
      `Не удалось прочитать путь: ${absPath}`,
      "execution",
      {
        filePath: absPath,
        cause: err instanceof Error ? err.message : String(err),
      },
    );
  }

  if (!st.isFile()) {
    throw new ParserError(
      "FILE_NOT_FOUND",
      `Не файл: ${absPath}`,
      "validation",
      { filePath: absPath },
    );
  }
}

/**
 * @param {string} absPath
 * @returns {Promise<string>}
 */
export async function readUtf8File(absPath) {
  try {
    return await readFile(absPath, "utf8");
  } catch (err) {
    throw new ParserError(
      "READ_FAILED",
      `Не удалось прочитать файл: ${absPath}`,
      "execution",
      {
        filePath: absPath,
        cause: err instanceof Error ? err.message : String(err),
      },
    );
  }
}

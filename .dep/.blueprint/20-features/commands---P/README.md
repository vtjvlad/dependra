---
title: Команды
source: prompt.md
source_lines: [329, 353]
tags: [P]
status: draft
---

# Команды

## Команды ( -P)
Определять список команд, которые могут работать с данным файлом без sudo.
Например:
cat
less
head
tail
grep
sed
awk
diff
cp
mv
ln
stat
file
strings
hexdump
и другие.
Не учитывать команды запуска файла.
Например:
node
python
java
не должны попадать в этот список.

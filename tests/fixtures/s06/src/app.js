// sample quality fixture
export function run(x) {
  const unused = 1;
  const used = x + 1;
  return used;
}

export function withUnderscore(_unused, y) {
  return y;
}

export function badEval(code) {
  return eval(code);
}

export function blanks() {
  const a = 1;


  return a;
}

export function dupA() {
  const line1 = 1;
  const line2 = 2;
  const line3 = 3;
  const line4 = 4;
  const line5 = 5;
  return line1 + line2 + line3 + line4 + line5;
}

export function dupB() {
  const line1 = 1;
  const line2 = 2;
  const line3 = 3;
  const line4 = 4;
  const line5 = 5;
  return line1 + line2 + line3 + line4 + line5;
}

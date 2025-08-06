// src/lib/theme-client.ts
let _setTheme: ((theme: string) => void) | undefined;

export function setThemeSetter(setter: (theme: string) => void) {
  _setTheme = setter;
}

export function setThemeClient(theme: string) {
  if (_setTheme) _setTheme(theme);
}

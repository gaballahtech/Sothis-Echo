// Boot script — runs before first paint (blocking, classic script).
// Restores saved language direction and colour scheme so neither flashes.
// Kept external so a strict CSP (script-src 'self') needs no 'unsafe-inline'.
(function () {
  try {
    var saved =
      localStorage.getItem('sothis-echo-language') ||
      localStorage.getItem('dancing-with-sar-language');
    if (saved === 'ar') {
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.setAttribute('dir', 'rtl');
    }
  } catch (e) {}

  try {
    var theme = localStorage.getItem('sothis-echo-theme');
    if (theme !== 'dark' && theme !== 'light') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.body.classList.remove(theme === 'dark' ? 'bp6-light' : 'bp6-dark');
    document.body.classList.add(theme === 'dark' ? 'bp6-dark' : 'bp6-light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#151513' : '#f7f6f2');
  } catch (e) {}
})();

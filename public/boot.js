// Boot script — runs before first paint (blocking, classic script).
// Restores saved language direction to avoid an LTR/RTL flash.
// Kept external so a strict CSP (script-src 'self') needs no 'unsafe-inline'.
(function () {
  try {
    var saved =
      localStorage.getItem('dancing-with-sar-language') ||
      localStorage.getItem('aura-sar-language');
    if (saved === 'ar') {
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.setAttribute('dir', 'rtl');
    }
    document.documentElement.classList.add('dark');
  } catch (e) {}
})();

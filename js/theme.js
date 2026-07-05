/* ============================================
   THEME.JS
   Handles dark/light mode toggling and
   remembers the user's choice using localStorage.
   Loaded on every page.
   ============================================ */

const THEME_KEY = "studenthub_theme"; // centralized key name — avoid typos across files

/**
 * Apply a theme by adding/removing the "dark" class on <body>.
 * All our CSS variable overrides in variables.css are scoped
 * to body.dark, so this one line updates the entire site's colors.
 */
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

/**
 * On page load: check if the user previously chose a theme.
 * If not, default to their OS-level preference using
 * the matchMedia API, falling back to light mode.
 */
function initTheme() {
  const savedTheme = getFromStorage(THEME_KEY, null);

  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // window.matchMedia lets us check system-level settings from CSS media queries in JS
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}

/**
 * Toggle between dark and light, save the choice, update the icon.
 */
function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";

  applyTheme(newTheme);
  saveToStorage(THEME_KEY, newTheme);
  updateThemeIcon(newTheme);
}

/**
 * Swap the toggle button's icon between moon (light mode, click to go dark)
 * and sun (dark mode, click to go light).
 */
function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return; // page might not have this button

  const icon = theme === "dark" ? "sun" : "moon";
  toggleBtn.innerHTML = `<i data-lucide="${icon}"></i>`;

  // Re-render the new icon since we just replaced the <i> tag's HTML
  if (window.lucide) {
    lucide.createIcons();
  }
}

// --- Run on every page load ---
initTheme();

// --- Wire up the toggle button once the DOM is ready ---
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleTheme);
    // Set the correct icon on load based on current theme
    const isDark = document.body.classList.contains("dark");
    updateThemeIcon(isDark ? "dark" : "light");
  }
});
/* ============================================
   DATETIME.JS
   Shows a time-based greeting ("Good morning")
   and a live-updating clock in the topbar.
   ============================================ */

/**
 * Pick a greeting based on the current hour of the day.
 */
function getGreeting() {
  const hour = new Date().getHours(); // 0-23

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Burning the midnight oil";
}

/**
 * Format the current date & time as a readable string,
 * e.g. "Sunday, July 5, 2026 · 3:42:07 PM"
 */
function getFormattedDateTime() {
  const now = new Date();

  // toLocaleDateString/toLocaleTimeString use the browser's
  // locale settings to format dates properly, instead of us
  // manually building strings like `${month}/${day}/${year}`
  // (which is fragile and easy to get wrong — e.g. off-by-one
  // month bugs since getMonth() is 0-indexed).
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const timeStr = now.toLocaleTimeString();

  return `${dateStr} · ${timeStr}`;
}

/**
 * Update the greeting and clock elements in the DOM.
 */
function updateTopbar() {
  const greetingEl = document.getElementById("greeting-text");
  const datetimeEl = document.getElementById("datetime-text");

  if (greetingEl) {
    greetingEl.textContent = `${getGreeting()}! 👋`;
  }
  if (datetimeEl) {
    datetimeEl.textContent = getFormattedDateTime();
  }
}

// Run once immediately so the user doesn't see "Loading..." flash
updateTopbar();

// Then update every second so the clock actually ticks live.
// setInterval schedules a function to repeat every N milliseconds.
setInterval(updateTopbar, 1000);
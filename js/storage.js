/* ============================================
   STORAGE.JS
   A tiny wrapper around localStorage so every
   feature (todo, assignments, planner...) reads
   and writes data the exact same safe way.

   WHY WE NEED THIS:
   localStorage can ONLY store strings. If you try
   to save an array or object directly, JavaScript
   silently converts it to the string "[object Object]"
   — which is a classic beginner bug. We must always
   JSON.stringify() before saving, and JSON.parse()
   after reading.
   ============================================ */

/**
 * Save any JS value (array, object, string, number) under a key.
 * @param {string} key - the localStorage key, e.g. "studenthub_todos"
 * @param {any} value - the data to save
 */
function saveToStorage(key, value) {
  try {
    // JSON.stringify() converts a JS value into a string
    // e.g. [{id:1, text:"Study"}] becomes '[{"id":1,"text":"Study"}]'
    const stringified = JSON.stringify(value);
    localStorage.setItem(key, stringified);
  } catch (error) {
    // This can fail if storage is full (~5-10MB limit) or
    // if the browser blocks storage (e.g. private/incognito mode
    // in some browsers). We fail gracefully instead of crashing.
    console.error(`Failed to save "${key}" to localStorage:`, error);
  }
}

/**
 * Read a value back from localStorage.
 * @param {string} key - the localStorage key
 * @param {any} fallback - what to return if nothing is saved yet
 * @returns {any} the parsed value, or the fallback
 */
function getFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);

    // If nothing has been saved yet, getItem returns null.
    // Without this check, JSON.parse(null) actually returns
    // null too (weirdly), but it's clearer to handle it explicitly.
    if (raw === null) {
      return fallback;
    }

    // JSON.parse() converts the string back into a real JS value
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read "${key}" from localStorage:`, error);
    return fallback;
  }
}

/**
 * Remove a key entirely (used for "clear all" type features).
 * @param {string} key
 */
function removeFromStorage(key) {
  localStorage.removeItem(key);
}
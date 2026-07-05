/* ============================================
   PLANNER.JS
   A weekly schedule, organized as an object keyed
   by day name, each holding an array of time-slot
   entries. Different shape from our previous flat
   arrays, but the same "render from data" principle
   still applies — just with a nested loop (days,
   then each day's entries).

   DATA SHAPE:
   {
     Monday: [
       { id: 123, time: "18:00", activity: "Revise Physics" }
     ],
     Tuesday: [],
     ...
   }
   ============================================ */

const PLANNER_KEY = "studenthub_planner";

// Single source of truth for day order — used both to build
// the grid and to know what a "fresh" empty schedule looks like.
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- DOM references ---
const plannerForm = document.getElementById("planner-form");
const daySelect = document.getElementById("planner-day");
const timeInput = document.getElementById("planner-time");
const activityInput = document.getElementById("planner-activity");
const plannerGrid = document.getElementById("planner-grid");

/**
 * Build a fresh empty schedule shape: every day mapped to an
 * empty array. Used the first time this page ever loads, before
 * anything has been saved yet.
 */
function createEmptySchedule() {
  const schedule = {};
  DAYS_OF_WEEK.forEach(day => {
    schedule[day] = [];
  });
  return schedule;
}

function getSchedule() {
  return getFromStorage(PLANNER_KEY, createEmptySchedule());
}

function setSchedule(schedule) {
  saveToStorage(PLANNER_KEY, schedule);
}

/**
 * Add one entry to a specific day, keeping that day's
 * entries sorted chronologically by time.
 */
function addEntry(day, time, activity) {
  const schedule = getSchedule();

  schedule[day].push({
    id: Date.now(),
    time,       // "HH:MM" 24-hour string from <input type="time">
    activity: activity.trim()
  });

  // Sort this day's entries chronologically. "HH:MM" strings
  // sort correctly as plain text since they're zero-padded and
  // biggest-unit-first — no need to convert to Date objects here,
  // unlike assignments.js where we needed full calendar dates.
  schedule[day].sort((a, b) => a.time.localeCompare(b.time));

  setSchedule(schedule);
  renderGrid();
}

function deleteEntry(day, id) {
  const schedule = getSchedule();
  schedule[day] = schedule[day].filter(entry => entry.id !== id);
  setSchedule(schedule);
  renderGrid();
}

/**
 * Format "18:00" as "6:00 PM" for friendlier display.
 */
function formatTime12Hour(time24) {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12; // 0 or 12 in 24hr both display as 12 in 12hr format

  return `${hour}:${minuteStr} ${period}`;
}

/**
 * Render the full 7-day grid from scratch, based on current data —
 * same "wipe and rebuild" habit as every previous list feature.
 */
function renderGrid() {
  const schedule = getSchedule();
  plannerGrid.innerHTML = "";

  DAYS_OF_WEEK.forEach(day => {
    const dayCol = document.createElement("div");
    dayCol.className = "planner-day-col";

    const title = document.createElement("div");
    title.className = "planner-day-title";
    title.textContent = day;
    dayCol.appendChild(title);

    const entries = schedule[day] || [];

    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "planner-day-empty";
      empty.textContent = "No sessions planned";
      dayCol.appendChild(empty);
    } else {
      entries.forEach(entry => {
        const entryEl = document.createElement("div");
        entryEl.className = "planner-entry";

        const details = document.createElement("div");
        details.className = "planner-entry-details";

        const timeEl = document.createElement("span");
        timeEl.className = "planner-entry-time";
        timeEl.textContent = formatTime12Hour(entry.time);

        const activityEl = document.createElement("span");
        activityEl.className = "planner-entry-activity";
        activityEl.textContent = entry.activity; // textContent — user-typed, XSS-safe

        details.appendChild(timeEl);
        details.appendChild(activityEl);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = `<i data-lucide="x"></i>`;
        deleteBtn.setAttribute("aria-label", "Remove entry");
        deleteBtn.addEventListener("click", () => deleteEntry(day, entry.id));

        entryEl.appendChild(details);
        entryEl.appendChild(deleteBtn);
        dayCol.appendChild(entryEl);
      });
    }

    plannerGrid.appendChild(dayCol);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

// --- Form submit handler ---
plannerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const day = daySelect.value;
  const time = timeInput.value;
  const activity = activityInput.value;

  if (time === "" || activity.trim() === "") return;

  addEntry(day, time, activity);

  activityInput.value = "";
  timeInput.value = "";
  activityInput.focus();
});

renderGrid();
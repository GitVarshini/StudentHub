/* ============================================
   POMODORO.JS
   A 25-minute focus / 5-minute break timer with
   start/pause/reset and a persisted session counter.

   ------------------------------------------------
   CONCEPT: setInterval vs setTimeout
   - setTimeout(fn, ms)   → runs fn ONCE after ms milliseconds
   - setInterval(fn, ms)  → runs fn REPEATEDLY every ms milliseconds,
                            until you explicitly stop it

   Our countdown needs to tick every second, so setInterval
   is the right tool. Critically: setInterval returns an ID
   number, which we MUST save so we can later call
   clearInterval(thatId) to stop it. Forgetting to store and
   clear this ID is the #1 bug source in JS timers — you end
   up with multiple timers running simultaneously, each
   decrementing the same clock, making it count down too fast.
   ============================================ */

const SESSIONS_KEY = "studenthub_pomodoro_sessions";

const FOCUS_DURATION = 25 * 60; // 25 minutes, in seconds
const BREAK_DURATION = 5 * 60;   // 5 minutes, in seconds

// --- In-memory state (not persisted — a running timer shouldn't
//     survive a page refresh; only the session COUNT persists) ---
let secondsRemaining = FOCUS_DURATION;
let totalDuration = FOCUS_DURATION;
let isRunning = false;
let isBreak = false;
let intervalId = null; // holds the setInterval ID so we can clear it later

// --- DOM references ---
const timeDisplay = document.getElementById("pomodoro-time");
const modeLabel = document.getElementById("pomodoro-mode-label");
const startBtn = document.getElementById("pomodoro-start");
const pauseBtn = document.getElementById("pomodoro-pause");
const resetBtn = document.getElementById("pomodoro-reset");
const sessionCountEl = document.getElementById("session-count");
const ringProgress = document.getElementById("ring-progress");

// --- SVG ring math ---
// Circumference of a circle = 2 * π * radius. Our <circle> has r="90".
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// stroke-dasharray defines a repeating dash pattern along the circle's
// outline. Setting it to the FULL circumference means "one dash as
// long as the whole circle" — effectively a solid, unbroken ring.
ringProgress.style.strokeDasharray = `${CIRCUMFERENCE}`;

/**
 * Format seconds as "MM:SS", e.g. 1500 -> "25:00"
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // padStart(2, "0") ensures single digits show as "05" not "5"
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Update the countdown text and the SVG ring's visual progress.
 */
function updateDisplay() {
  timeDisplay.textContent = formatTime(secondsRemaining);

  // fraction of time REMAINING (1 = full, 0 = empty)
  const fraction = secondsRemaining / totalDuration;

  // stroke-dashoffset shifts the visible dash along the circle.
  // At offset 0, the full dash (whole circle) is visible.
  // At offset = CIRCUMFERENCE, the entire dash is "pushed off",
  // making the ring appear empty. So as time runs out, we
  // increase the offset proportionally.
  const offset = CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
}

/**
 * Called every second while running.
 */
function tick() {
  secondsRemaining--;
  updateDisplay();

  if (secondsRemaining <= 0) {
    handleSessionComplete();
  }
}

/**
 * Called when the countdown reaches zero — switches modes
 * (focus <-> break) and updates the persisted session count.
 */
function handleSessionComplete() {
  stopTimer(); // clear the interval so tick() stops firing

  if (!isBreak) {
    // A focus session just finished — increment the counter
    const currentCount = getFromStorage(SESSIONS_KEY, 0);
    saveToStorage(SESSIONS_KEY, currentCount + 1);
    renderSessionCount();
  }

  // Flip to the opposite mode
  isBreak = !isBreak;
  totalDuration = isBreak ? BREAK_DURATION : FOCUS_DURATION;
  secondsRemaining = totalDuration;

  updateModeLabel();
  updateDisplay();

  // Optional: a simple audio cue using the Web Audio-free
  // approach of just alerting — kept minimal here.
  // (We could extend this later with an <audio> tag + .play())
}

/**
 * Start (or resume) the countdown.
 */
function startTimer() {
  if (isRunning) return; // guard against double-starting if button is clicked twice fast

  isRunning = true;
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");

  // setInterval(tick, 1000) calls tick() every 1000ms (1 second).
  // We MUST store the returned ID in intervalId so pause/reset
  // can stop it later — otherwise it runs forever, even across
  // multiple "starts", stacking up multiple simultaneous timers.
  intervalId = setInterval(tick, 1000);
}

/**
 * Pause the countdown without resetting progress.
 */
function pauseTimer() {
  stopTimer();
  isRunning = false;
  pauseBtn.classList.add("hidden");
  startBtn.classList.remove("hidden");
}

/**
 * Internal helper: stop the interval if one is running.
 * Used by both pause and session-complete.
 */
function stopTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Reset back to a fresh 25-minute focus session.
 */
function resetTimer() {
  stopTimer();
  isRunning = false;
  isBreak = false;
  totalDuration = FOCUS_DURATION;
  secondsRemaining = FOCUS_DURATION;

  pauseBtn.classList.add("hidden");
  startBtn.classList.remove("hidden");

  updateModeLabel();
  updateDisplay();
}

function updateModeLabel() {
  if (isBreak) {
    modeLabel.textContent = "Break Time";
    modeLabel.className = "pomodoro-mode break";
  } else {
    modeLabel.textContent = "Focus Session";
    modeLabel.className = "pomodoro-mode focus";
  }
}

function renderSessionCount() {
  const count = getFromStorage(SESSIONS_KEY, 0);
  sessionCountEl.textContent = count;
}

// --- Event listeners ---
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

// --- Initial render on page load ---
updateDisplay();
renderSessionCount();
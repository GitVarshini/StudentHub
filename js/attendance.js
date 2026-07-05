/* ============================================
   ATTENDANCE.JS
   Pure calculation module — no localStorage needed,
   since this is a "check right now" tool rather than
   something with history to persist.
   ============================================ */

const attendanceForm = document.getElementById("attendance-form");
const attendedInput = document.getElementById("classes-attended");
const totalInput = document.getElementById("classes-total");
const targetInput = document.getElementById("target-percent");
const resultSection = document.getElementById("attendance-result");
const percentText = document.getElementById("attendance-percent-text");
const messageEl = document.getElementById("attendance-message");
const ringProgress = document.getElementById("attendance-ring-progress");

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
ringProgress.style.strokeDasharray = `${CIRCUMFERENCE}`;

/**
 * Core pure function: given attended/total/target, return
 * everything the UI needs to display. No DOM access inside
 * this function — it just computes and returns data. This
 * separation makes the math easy to reason about (and test)
 * independently of how it's displayed.
 */
function calculateAttendance(attended, total, targetPercent) {
  const target = targetPercent / 100; // convert "75" -> 0.75
  const currentPercent = total === 0 ? 0 : (attended / total) * 100;

  if (currentPercent >= targetPercent) {
    // CASE 1: at or above target — how many more can be skipped?
    // Formula derived above: x = (attended / target) - total
    const skippable = Math.floor(attended / target - total);

    return {
      percent: currentPercent,
      isAboveTarget: true,
      skippable,
      needed: 0
    };
  } else {
    // CASE 2: below target — how many more consecutive classes needed?
    // Formula derived above: y = (target*total - attended) / (1 - target)
    const needed = Math.ceil((target * total - attended) / (1 - target));

    return {
      percent: currentPercent,
      isAboveTarget: false,
      skippable: 0,
      needed
    };
  }
}

/**
 * Update the SVG ring + percentage text.
 */
function renderRing(percent) {
  // Clamp between 0 and 100 so a weird edge case (e.g. attended > total,
  // which shouldn't happen but we guard anyway) never breaks the ring math.
  const clamped = Math.max(0, Math.min(100, percent));
  const fraction = clamped / 100;
  const offset = CIRCUMFERENCE * (1 - fraction);

  ringProgress.style.strokeDashoffset = offset;
  percentText.textContent = `${clamped.toFixed(1)}%`;

  // Color the ring green if healthy, red if below target —
  // uses the same CSS variables as the rest of the design system.
  ringProgress.style.stroke = clamped >= 75
    ? "var(--color-success)"
    : "var(--color-danger)";
}

/**
 * Build the human-readable message based on the calculation result.
 */
function renderMessage(result, targetPercent) {
  messageEl.classList.remove("good", "bad");

  if (result.isAboveTarget) {
    messageEl.classList.add("good");
    if (result.skippable <= 0) {
      messageEl.textContent = `You're exactly at ${targetPercent}% — you can't skip any more classes without dropping below target.`;
    } else {
      messageEl.textContent = `You can skip up to ${result.skippable} more class${result.skippable !== 1 ? "es" : ""} and still stay at or above ${targetPercent}%.`;
    }
  } else {
    messageEl.classList.add("bad");
    messageEl.textContent = `You need to attend the next ${result.needed} class${result.needed !== 1 ? "es" : ""} in a row to reach ${targetPercent}%.`;
  }
}

attendanceForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const attended = Number(attendedInput.value);
  const total = Number(totalInput.value);
  const targetPercent = Number(targetInput.value);

  // --- Validation ---
  // We check these explicitly instead of trusting the HTML
  // `min`/`required` attributes alone, since a user can still
  // type a negative number, or attended > total, which the
  // HTML attributes don't catch.
  if (total <= 0) {
    alert("Total classes held must be greater than 0.");
    return;
  }
  if (attended < 0 || attended > total) {
    alert("Classes attended must be between 0 and the total classes held.");
    return;
  }
  if (targetPercent <= 0 || targetPercent > 100) {
    alert("Target percentage must be between 1 and 100.");
    return;
  }

  const result = calculateAttendance(attended, total, targetPercent);

  renderRing(result.percent);
  renderMessage(result, targetPercent);
  resultSection.classList.remove("hidden");
});
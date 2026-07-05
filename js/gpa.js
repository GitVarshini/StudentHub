/* ============================================
   GPA.JS
   Add/remove subjects (each with credits + grade),
   then calculate a credit-weighted GPA.
   Persisted in localStorage so a user's subject
   list survives a page refresh — genuinely useful
   here since building the list up is the main effort.

   DATA SHAPE:
   {
     id: 1720012345678,
     subject: "Data Structures",
     credits: 4,
     gradePoints: 9   // numeric value from the <select>, e.g. A = 9
   }
   ============================================ */

const GPA_KEY = "studenthub_gpa_subjects";

// Human-readable labels for display, keyed by grade point value.
// Keeping this separate from the <select> options means if we
// ever needed to re-render saved rows without the DOM's <select>
// text, we still know how to display "A" instead of just "9".
const GRADE_LABELS = {
  10: "A+", 9: "A", 8: "B+", 7: "B", 6: "C+", 5: "C", 4: "D", 0: "F"
};

// --- DOM references ---
const gpaForm = document.getElementById("gpa-form");
const subjectInput = document.getElementById("gpa-subject");
const creditsInput = document.getElementById("gpa-credits");
const gradeSelect = document.getElementById("gpa-grade");
const tableBody = document.getElementById("gpa-table-body");
const gpaEmpty = document.getElementById("gpa-empty");
const gpaResult = document.getElementById("gpa-result");
const gpaValueEl = document.getElementById("gpa-value");

function getSubjects() {
  return getFromStorage(GPA_KEY, []);
}

function setSubjects(subjects) {
  saveToStorage(GPA_KEY, subjects);
}

function addSubject(subject, credits, gradePoints) {
  const subjects = getSubjects();

  subjects.push({
    id: Date.now(),
    subject: subject.trim(),
    credits,
    gradePoints
  });

  setSubjects(subjects);
  renderAll();
}

function deleteSubject(id) {
  const subjects = getSubjects();
  const remaining = subjects.filter(s => s.id !== id);
  setSubjects(remaining);
  renderAll();
}

/**
 * PURE CALCULATION FUNCTION — same principle as attendance.js.
 * Takes an array of subjects, returns just a number (or null if
 * there's nothing to calculate). No DOM code inside.
 *
 * GPA = Σ(gradePoints × credits) / Σ(credits)
 */
function calculateGPA(subjects) {
  if (subjects.length === 0) return null;

  // .reduce() walks through an array, accumulating a single
  // result — here, running totals for the weighted sum and
  // the total credits. `acc` (the accumulator) carries both
  // values forward across each iteration.
  const totals = subjects.reduce(
    (acc, subject) => {
      acc.weightedSum += subject.gradePoints * subject.credits;
      acc.totalCredits += subject.credits;
      return acc;
    },
    { weightedSum: 0, totalCredits: 0 } // starting values
  );

  if (totals.totalCredits === 0) return null; // guard against divide-by-zero

  return totals.weightedSum / totals.totalCredits;
}

/**
 * Render the subject table rows.
 */
function renderTable(subjects) {
  tableBody.innerHTML = "";

  if (subjects.length === 0) {
    gpaEmpty.classList.remove("hidden");
  } else {
    gpaEmpty.classList.add("hidden");
  }

  subjects.forEach(subject => {
    const row = document.createElement("tr");

    const subjectCell = document.createElement("td");
    subjectCell.textContent = subject.subject; // textContent — user-typed, XSS-safe

    const creditsCell = document.createElement("td");
    creditsCell.textContent = subject.credits;

    const gradeCell = document.createElement("td");
    gradeCell.textContent = GRADE_LABELS[subject.gradePoints] ?? subject.gradePoints;

    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = `<i data-lucide="trash-2"></i>`;
    deleteBtn.setAttribute("aria-label", "Remove subject");
    deleteBtn.addEventListener("click", () => deleteSubject(subject.id));
    actionCell.appendChild(deleteBtn);

    row.appendChild(subjectCell);
    row.appendChild(creditsCell);
    row.appendChild(gradeCell);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Render the GPA result box (or hide it if there's nothing to show).
 */
function renderResult(subjects) {
  const gpa = calculateGPA(subjects);

  if (gpa === null) {
    gpaResult.classList.add("hidden");
    return;
  }

  gpaResult.classList.remove("hidden");
  // toFixed(2) formats to exactly 2 decimal places, e.g. 8.6 -> "8.60"
  gpaValueEl.textContent = gpa.toFixed(2);
}

/**
 * Single entry point that re-renders everything from current data —
 * same "render from data" habit as todo.js / assignments.js.
 */
function renderAll() {
  const subjects = getSubjects();
  renderTable(subjects);
  renderResult(subjects);
}

// --- Form submit handler ---
gpaForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const subject = subjectInput.value;
  const credits = Number(creditsInput.value);
  const gradePoints = Number(gradeSelect.value);

  if (subject.trim() === "") return;
  if (credits <= 0) {
    alert("Credits must be at least 1.");
    return;
  }

  addSubject(subject, credits, gradePoints);

  gpaForm.reset();
  creditsInput.value = 3; // re-apply sensible default, since reset() reverts to HTML defaults anyway (already 3) — kept explicit for clarity
  subjectInput.focus();
});

renderAll();
/* ============================================
   ASSIGNMENTS.JS
   Same CRUD + render-from-data pattern as todo.js,
   with two additions: due dates and priority, plus
   sorting so the most urgent assignments show first.

   DATA SHAPE:
   {
     id: 1720012345678,
     subject: "Physics",
     title: "Lab report 3",
     dueDate: "2026-07-10",   // string, from <input type="date">
     priority: "high",         // "low" | "medium" | "high"
     completed: false
   }
   ============================================ */

const ASSIGNMENTS_KEY = "studenthub_assignments";

// --- DOM references, grabbed once ---
const assignmentForm = document.getElementById("assignment-form");
const subjectInput = document.getElementById("assignment-subject");
const titleInput = document.getElementById("assignment-title");
const dueInput = document.getElementById("assignment-due");
const priorityInput = document.getElementById("assignment-priority");
const assignmentList = document.getElementById("assignment-list");
const assignmentEmpty = document.getElementById("assignment-empty");

function getAssignments() {
  return getFromStorage(ASSIGNMENTS_KEY, []);
}

function setAssignments(assignments) {
  saveToStorage(ASSIGNMENTS_KEY, assignments);
}

function addAssignment(subject, title, dueDate, priority) {
  const assignments = getAssignments();

  assignments.push({
    id: Date.now(),
    subject: subject.trim(),
    title: title.trim(),
    dueDate,   // already a clean "YYYY-MM-DD" string from the date input
    priority,
    completed: false
  });

  setAssignments(assignments);
  renderAssignments();
}

function toggleAssignment(id) {
  const assignments = getAssignments();
  const updated = assignments.map(a =>
    a.id === id ? { ...a, completed: !a.completed } : a
  );
  setAssignments(updated);
  renderAssignments();
}

function deleteAssignment(id) {
  const assignments = getAssignments();
  const remaining = assignments.filter(a => a.id !== id);
  setAssignments(remaining);
  renderAssignments();
}

/**
 * Sort assignments so the render order makes sense:
 * 1. Incomplete assignments before completed ones
 * 2. Within each group, earliest due date first
 *
 * Array.prototype.sort() takes a "comparator" function that
 * receives two items (a, b) and returns:
 *   - a negative number  → a comes first
 *   - a positive number  → b comes first
 *   - zero               → leave their order unchanged
 */
function sortAssignments(assignments) {
  // .sort() mutates the array it's called on, so we make a
  // shallow copy first with the spread operator — keeping with
  // our "don't mutate the original" habit from todo.js.
  return [...assignments].sort((a, b) => {
    // Completed items sink to the bottom regardless of date
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // "YYYY-MM-DD" strings sort correctly as plain strings
    // (unlike "MM/DD/YYYY"), but converting to real Date objects
    // is clearer and handles edge cases more safely.
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

/**
 * Figure out how to describe a due date relative to today:
 * "Overdue", "Due today", or "Due in N days".
 */
function formatDueDate(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // zero out the time so we compare dates only, not times

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((due - today) / msPerDay);

  const readableDate = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (diffDays < 0) {
    return { text: `Overdue · ${readableDate}`, overdue: true };
  }
  if (diffDays === 0) {
    return { text: `Due today`, overdue: false };
  }
  if (diffDays === 1) {
    return { text: `Due tomorrow`, overdue: false };
  }
  return { text: `Due in ${diffDays} days · ${readableDate}`, overdue: false };
}

function renderAssignments() {
  const assignments = sortAssignments(getAssignments());

  assignmentList.innerHTML = "";

  if (assignments.length === 0) {
    assignmentEmpty.classList.remove("hidden");
  } else {
    assignmentEmpty.classList.add("hidden");
  }

  assignments.forEach(assignment => {
    const dueInfo = formatDueDate(assignment.dueDate);

    const item = document.createElement("div");
    item.className = "assignment-item" + (assignment.completed ? " completed" : "");

    // Color the left border by priority using an inline CSS variable override —
    // simpler than adding a dozen priority-specific classes just for one property.
    const priorityColors = {
      low: "var(--color-success)",
      medium: "var(--color-warning)",
      high: "var(--color-danger)"
    };
    item.style.borderLeftColor = priorityColors[assignment.priority];

    const checkboxWrap = document.createElement("div");
    checkboxWrap.className = "assignment-checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = assignment.completed;
    checkbox.addEventListener("change", () => toggleAssignment(assignment.id));
    checkboxWrap.appendChild(checkbox);

    const details = document.createElement("div");
    details.className = "assignment-details";

    const titleEl = document.createElement("div");
    titleEl.className = "assignment-title";
    // Using textContent so subject/title are never treated as HTML —
    // same XSS-safety reasoning as todo.js.
    titleEl.textContent = `${assignment.title}`;

    const meta = document.createElement("div");
    meta.className = "assignment-meta";

    const subjectSpan = document.createElement("span");
    subjectSpan.textContent = assignment.subject;

    const dueSpan = document.createElement("span");
    dueSpan.textContent = dueInfo.text;
    if (dueInfo.overdue && !assignment.completed) {
      dueSpan.classList.add("due-overdue");
    }

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge ${assignment.priority}`;
    priorityBadge.textContent = assignment.priority;

    meta.appendChild(subjectSpan);
    meta.appendChild(dueSpan);
    meta.appendChild(priorityBadge);

    details.appendChild(titleEl);
    details.appendChild(meta);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = `<i data-lucide="trash-2"></i>`;
    deleteBtn.setAttribute("aria-label", "Delete assignment");
    deleteBtn.addEventListener("click", () => deleteAssignment(assignment.id));

    item.appendChild(checkboxWrap);
    item.appendChild(details);
    item.appendChild(deleteBtn);
    assignmentList.appendChild(item);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

// --- Form submit handler ---
assignmentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const subject = subjectInput.value;
  const title = titleInput.value;
  const due = dueInput.value;
  const priority = priorityInput.value;

  if (subject.trim() === "" || title.trim() === "" || due === "") return;

  addAssignment(subject, title, due, priority);

  assignmentForm.reset();
  priorityInput.value = "medium"; // form.reset() would clear this too, so we re-set the sensible default
  subjectInput.focus();
});

renderAssignments();
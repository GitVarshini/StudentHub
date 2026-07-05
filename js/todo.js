/* ============================================
   TODO.JS
   Add / complete / delete / filter tasks,
   persisted in localStorage.

   ------------------------------------------------
   DATA SHAPE — this is the "schema" we've decided on
   for a single task. Keeping it consistent matters:
   {
     id: 1720012345678,     // unique identifier (timestamp)
     text: "Finish essay",  // the task description
     completed: false        // boolean toggle
   }
   ============================================ */

const TODO_KEY = "studenthub_todos"; // centralized key — matches our storage.js pattern

// This variable holds our "current filter" state in memory.
// It's not saved to localStorage — filters reset on reload, by design.
let currentFilter = "all";

// --- Grab references to DOM elements ONCE, not on every render ---
// (Re-querying the DOM every time is wasteful; elements don't move.)
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoEmpty = document.getElementById("todo-empty");
const todoCount = document.getElementById("todo-count");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

/**
 * Load the current array of tasks from localStorage.
 * Defaults to an empty array if nothing is saved yet.
 */
function getTodos() {
  return getFromStorage(TODO_KEY, []);
}

/**
 * Save the given array of tasks back to localStorage.
 */
function setTodos(todos) {
  saveToStorage(TODO_KEY, todos);
}

/**
 * Add a new task to the list.
 */
function addTodo(text) {
  const todos = getTodos();

  const newTodo = {
    id: Date.now(),       // Date.now() returns milliseconds since 1970 —
                           // effectively unique for our purposes (a user
                           // can't add two tasks in the same millisecond by hand)
    text: text.trim(),     // trim() removes leading/trailing whitespace
    completed: false
  };

  todos.push(newTodo);
  setTodos(todos);
  renderTodos();
}

/**
 * Toggle a task's completed state by its id.
 */
function toggleTodo(id) {
  const todos = getTodos();

  // .map() creates a NEW array, transforming each item.
  // We only change the one whose id matches; everything
  // else is returned unchanged (spread with ...todo).
  const updated = todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );

  setTodos(updated);
  renderTodos();
}

/**
 * Delete a task by its id.
 */
function deleteTodo(id) {
  const todos = getTodos();

  // .filter() creates a NEW array containing only items
  // that pass the test — here, "keep everything EXCEPT
  // the one with this id".
  const remaining = todos.filter(todo => todo.id !== id);

  setTodos(remaining);
  renderTodos();
}

/**
 * Remove all completed tasks at once.
 */
function clearCompleted() {
  const todos = getTodos();
  const remaining = todos.filter(todo => !todo.completed);
  setTodos(remaining);
  renderTodos();
}

/**
 * Apply the current filter ("all" / "active" / "completed")
 * to the full task list, returning only what should be shown.
 */
function getFilteredTodos() {
  const todos = getTodos();

  if (currentFilter === "active") {
    return todos.filter(todo => !todo.completed);
  }
  if (currentFilter === "completed") {
    return todos.filter(todo => todo.completed);
  }
  return todos; // "all"
}

/**
 * THE RENDER FUNCTION.
 * This is the most important pattern in this file:
 * instead of trying to surgically update individual DOM
 * elements when data changes, we wipe the list and rebuild
 * it fresh from the current data every time. For a list this
 * size, this is simpler to reason about and fast enough —
 * "re-render from data" is the same core idea frameworks
 * like React are built around, just done manually here.
 */
function renderTodos() {
  const todos = getFilteredTodos();
  const allTodos = getTodos();

  // Clear the list before rebuilding it
  todoList.innerHTML = "";

  // Show/hide the empty state message
  if (todos.length === 0) {
    todoEmpty.classList.remove("hidden");
  } else {
    todoEmpty.classList.add("hidden");
  }

  // Build one <li> per task
  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    // We build the checkbox, text, and delete button as real
    // DOM elements (not innerHTML strings) so we can safely
    // attach event listeners directly, and so user-typed task
    // text is never interpreted as HTML (XSS-safe by default
    // when using textContent, unlike innerHTML).
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const span = document.createElement("span");
    span.textContent = todo.text; // textContent, NOT innerHTML — see note above

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = `<i data-lucide="trash-2"></i>`;
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });

  // Update the "X tasks left" counter — based on ALL todos,
  // not the filtered subset, since that's more useful info
  const activeCount = allTodos.filter(t => !t.completed).length;
  todoCount.textContent = `${activeCount} task${activeCount !== 1 ? "s" : ""} left`;

  // Re-render Lucide icons for the newly created delete buttons
  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Update which filter button looks "active" and re-render.
 */
function setFilter(filter) {
  currentFilter = filter;

  filterButtons.forEach(btn => {
    // btn.dataset.filter reads the data-filter="..." HTML attribute
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  renderTodos();
}

// --- EVENT LISTENERS ---

todoForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop page reload, same reasoning as the contact form

  const text = todoInput.value;

  // Guard against empty/whitespace-only input, even though
  // `required` on the input mostly prevents this already —
  // defense in depth, since JS validation can be bypassed
  // (e.g. by directly calling form.submit() in devtools).
  if (text.trim() === "") return;

  addTodo(text);
  todoInput.value = ""; // clear the input for the next task
  todoInput.focus();     // keep focus in the input for fast repeated entry
});

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

clearCompletedBtn.addEventListener("click", clearCompleted);

// --- INITIAL RENDER on page load ---
renderTodos();
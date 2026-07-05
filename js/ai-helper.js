/* ============================================
   AI-HELPER.JS
   Sends a prompt to the Gemini API based on which
   mode tab is selected, and displays the response.

   ------------------------------------------------
   WHY WE BUILD A DIFFERENT PROMPT PER MODE:
   Gemini doesn't inherently know "explain simply"
   vs "make a quiz" — from its point of view, it's
   ALWAYS just given a block of text and asked to
   continue/respond to it. The skill here is called
   "prompt engineering" — we wrap the user's raw
   input with instructions that steer the response
   toward what that mode should produce.
   ============================================ */

// Gemini's REST endpoint for text generation.
// The model name can change over time — check
// https://ai.google.dev/gemini-api/docs/models for current options.
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// --- DOM references ---
const modeButtons = document.querySelectorAll(".ai-mode-btn");
const modeHint = document.getElementById("ai-mode-hint");
const aiForm = document.getElementById("ai-form");
const aiInput = document.getElementById("ai-input");
const submitBtn = document.getElementById("ai-submit-btn");
const outputBox = document.getElementById("ai-output");
const outputContent = document.getElementById("ai-output-content");
const copyBtn = document.getElementById("ai-copy-btn");
const errorBox = document.getElementById("ai-error");

let currentMode = "explain";

// Configuration for each mode: the hint text shown to the user,
// the placeholder in the textarea, and — most importantly — the
// PROMPT TEMPLATE that wraps their input before sending to Gemini.
// {input} gets replaced with whatever the user typed.
const MODES = {
  explain: {
    hint: "Paste a concept you want explained simply.",
    placeholder: "e.g. Explain Newton's second law of motion",
    buildPrompt: (input) =>
      `Explain the following concept in simple, clear terms suitable for a student. Use short paragraphs and a concrete example if helpful. Concept: ${input}`
  },
  summarize: {
    hint: "Paste your notes or a passage to summarize.",
    placeholder: "Paste your notes here...",
    buildPrompt: (input) =>
      `Summarize the following study notes into concise bullet points, keeping only the key ideas. Notes: ${input}`
  },
  quiz: {
    hint: "Enter a topic and get quiz questions to test yourself.",
    placeholder: "e.g. Photosynthesis",
    buildPrompt: (input) =>
      `Generate 5 quiz questions (mix of multiple choice and short answer) to test understanding of the following topic. Include the correct answers at the end under an "Answers" heading. Topic: ${input}`
  },
  plan: {
    hint: "Describe what you need to study and by when.",
    placeholder: "e.g. I have a Chemistry exam in 5 days covering chapters 1-4",
    buildPrompt: (input) =>
      `Suggest a realistic, day-by-day study plan based on the following situation. Be specific about what to focus on each day. Situation: ${input}`
  }
};

/**
 * Switch the active mode tab, update the hint/placeholder.
 */
function setMode(mode) {
  currentMode = mode;

  modeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  modeHint.textContent = MODES[mode].hint;
  aiInput.placeholder = MODES[mode].placeholder;
}

/**
 * Toggle a simple loading state on the submit button.
 */
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.innerHTML = isLoading
    ? `<i data-lucide="loader-2"></i> Generating...`
    : `<i data-lucide="sparkles"></i> Generate`;

  if (isLoading) {
    submitBtn.classList.add("btn-loading");
  } else {
    submitBtn.classList.remove("btn-loading");
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Send the built prompt to Gemini and return the plain text response.
 * Marked async so we can use await for both the network call and
 * parsing the JSON body.
 */
async function callGemini(prompt) {
  // Gemini's request body shape: an array of "contents", each with
  // "parts" containing the actual text. This structure supports
  // multi-turn conversations and multiple content parts (like images),
  // but for our single-shot use case we just send one text part.
  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  // Same principle as weather.js: fetch() doesn't throw on
  // HTTP error codes (400, 403, 429, etc.) — only on true
  // network failures. We must check response.ok ourselves.
  if (!response.ok) {
    // Try to extract Gemini's own error message for a more
    // useful error than just the status code.
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();

  // Gemini's response shape nests the actual text several levels
  // deep: candidates[0].content.parts[0].text. We defensively
  // check each level exists, since a blocked/filtered response
  // can have a different (empty) shape.
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini didn't return a usable response. Try rephrasing your input.");
  }

  return text;
}

/**
 * Show an error message to the user.
 */
function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  outputBox.classList.add("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

// --- Mode tab clicks ---
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

// --- Form submit: build the prompt, call Gemini, render the result ---
aiForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userInput = aiInput.value.trim();
  if (userInput === "") return;

  // Basic safeguard: if the config file wasn't set up, fail
  // clearly instead of sending a request with a placeholder key.
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE" || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
    showError("No Gemini API key configured. Add your key to js/config.js.");
    return;
  }

  hideError();
  setLoading(true);
  outputBox.classList.add("hidden");

  try {
    const prompt = MODES[currentMode].buildPrompt(userInput);
    const responseText = await callGemini(prompt);

    outputContent.textContent = responseText; // textContent — never trust ANY external text as HTML
    outputBox.classList.remove("hidden");

  } catch (error) {
    console.error("Gemini request failed:", error);
    showError(`Something went wrong: ${error.message}`);
  } finally {
    // `finally` runs whether the try succeeded or failed —
    // guarantees the loading state always gets cleared, so the
    // button never gets stuck saying "Generating..." forever.
    setLoading(false);
  }
});

// --- Copy button ---
copyBtn.addEventListener("click", () => {
  // navigator.clipboard.writeText() is the modern clipboard API.
  // It also returns a promise (it can fail, e.g. if the page isn't
  // served over HTTPS, or clipboard permission is denied).
  navigator.clipboard.writeText(outputContent.textContent)
    .then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    })
    .catch(err => {
      console.error("Failed to copy:", err);
    });
});

// --- Initialize with the default mode ---
setMode("explain");
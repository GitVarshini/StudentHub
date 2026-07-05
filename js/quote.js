/* ============================================
   QUOTE.JS
   Fetches a large public-domain list of quotes
   (type.fit's open dataset) once, then picks a
   random one. This avoids relying on a single
   quote-of-the-day API that might be down or
   rate-limited during your hackathon demo.
   ============================================ */

const QUOTES_API_URL = "https://type.fit/api/quotes";

async function loadQuote() {
  const quoteEl = document.getElementById("quote-widget");

  try {
    const response = await fetch(QUOTES_API_URL);

    if (!response.ok) {
      throw new Error(`Quotes API responded with status ${response.status}`);
    }

    const quotes = await response.json(); // array of { text, author }

    // Math.random() gives a decimal between 0 (inclusive) and 1 (exclusive).
    // Multiplying by the array length and flooring it gives a random valid index.
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];

    // Some entries in this dataset have author: null — handle that gracefully
    const author = quote.author ? quote.author.replace(", type.fit", "") : "Unknown";

    quoteEl.innerHTML = `
      <p class="quote-text">"${quote.text}"</p>
      <p class="quote-author">— ${author}</p>
    `;

  } catch (error) {
    console.error("Failed to load quote:", error);

    // A hardcoded fallback quote so the widget never looks broken,
    // even if the API is fully unreachable during your demo.
    quoteEl.innerHTML = `
      <p class="quote-text">"The secret of getting ahead is getting started."</p>
      <p class="quote-author">— Mark Twain</p>
    `;
  }
}

loadQuote();
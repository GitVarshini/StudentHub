/* ============================================
   WEATHER.JS
   Fetches current weather using the free,
   keyless Open-Meteo API: https://open-meteo.com

   ------------------------------------------------
   CONCEPT: PROMISES
   A Promise is JavaScript's way of representing
   "a value that will exist in the future" — because
   network requests take time and we can't just pause
   the whole program waiting for them.

   A Promise is always in one of 3 states:
   - pending   → still waiting for the network
   - fulfilled → got the data successfully
   - rejected  → something went wrong (no internet, bad URL, etc.)

   CONCEPT: fetch()
   fetch(url) sends an HTTP request and RETURNS A PROMISE
   that resolves to a "Response" object. That Response
   object has a .json() method — which ALSO returns a
   promise — that parses the response body as JSON.

   CONCEPT: async/await
   Instead of chaining .then().then().then() (which gets
   messy), we mark a function as `async`, and inside it we
   can use `await` to "pause" until a promise resolves —
   without actually blocking the rest of the browser/page.
   It's syntactic sugar over promises, not a different thing.
   ============================================ */

/**
 * Get the user's current GPS coordinates using the
 * browser's built-in Geolocation API.
 * This ALSO returns a promise-like pattern, but the
 * native API uses callbacks, so we wrap it in a Promise
 * ourselves to be able to use await with it.
 */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Some browsers/contexts don't support geolocation at all
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success callback — resolve the promise with coordinates
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        // Error callback — e.g. user clicked "Block" on the permission prompt
        reject(error);
      }
    );
  });
}

/**
 * Convert Open-Meteo's numeric "weather code" into a
 * human-readable description + emoji.
 * (Open-Meteo docs list these codes: https://open-meteo.com/en/docs)
 */
function describeWeatherCode(code) {
  const map = {
    0: { text: "Clear sky", icon: "☀️" },
    1: { text: "Mainly clear", icon: "🌤️" },
    2: { text: "Partly cloudy", icon: "⛅" },
    3: { text: "Overcast", icon: "☁️" },
    45: { text: "Foggy", icon: "🌫️" },
    51: { text: "Light drizzle", icon: "🌦️" },
    61: { text: "Rain", icon: "🌧️" },
    71: { text: "Snow", icon: "🌨️" },
    80: { text: "Rain showers", icon: "🌧️" },
    95: { text: "Thunderstorm", icon: "⛈️" }
  };

  return map[code] || { text: "Weather update", icon: "🌡️" };
}

/**
 * Main function: get location, fetch weather, render it.
 * Marked `async` so we can use `await` inside.
 */
async function loadWeather() {
  const weatherEl = document.getElementById("weather-widget");

  try {
    // STEP 1: get coordinates (default to a fallback city if denied)
    let coords;
    try {
      coords = await getUserLocation();
    } catch (geoError) {
      // Permission denied or unsupported — fall back to a default location
      // instead of failing the whole widget.
      console.warn("Location access denied, using fallback city:", geoError.message);
      coords = { lat: 28.6139, lon: 77.2090 }; // New Delhi, as a neutral fallback
    }

    // STEP 2: build the API URL with our coordinates
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;

    // STEP 3: fetch() sends the request. `await` pauses this function
    // (NOT the browser) until the promise resolves into a Response object.
    const response = await fetch(url);

    // fetch() only rejects on NETWORK failures (no internet, DNS fails).
    // A 404 or 500 error still "succeeds" as far as fetch is concerned,
    // so we must manually check response.ok ourselves.
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }

    // STEP 4: .json() parses the response body — ALSO returns a promise
    const data = await response.json();

    // STEP 5: extract what we need
    const temp = Math.round(data.current_weather.temperature);
    const code = data.current_weather.weathercode;
    const { text, icon } = describeWeatherCode(code);

    // STEP 6: render it into the DOM
    weatherEl.innerHTML = `
      <div class="weather-main">
        <span style="font-size: 2.5rem;">${icon}</span>
        <div>
          <div class="weather-temp">${temp}°C</div>
          <div class="weather-desc">${text}</div>
        </div>
      </div>
    `;

  } catch (error) {
    // Any error anywhere in the try block above lands here —
    // one centralized place to handle failure instead of
    // scattering error checks everywhere.
    console.error("Failed to load weather:", error);
    weatherEl.innerHTML = `<p class="widget-error">Couldn't load weather right now.</p>`;
  }
}

loadWeather();
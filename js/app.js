// Todo List Life Dashboard - Application Logic
// Full implementation across tasks 2–10

const Dashboard = {};

// ============================================================
// StorageError — custom error class for localStorage failures
// ============================================================

class StorageError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "StorageError";
    this.cause = cause;
  }
}

// ============================================================
// Dashboard.Storage — thin wrapper around localStorage
// Requirements: 8.1, 8.2, 8.3, 8.4, 9.2, 9.7
// ============================================================

Dashboard.Storage = {
  /**
   * Serialize `data` to JSON and persist it under `key`.
   * Throws StorageError if localStorage is unavailable or quota is exceeded.
   * @param {string} key
   * @param {*} data
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (err) {
      // QuotaExceededError, SecurityError, or any other write failure
      throw new StorageError(
        `Gagal menyimpan data untuk kunci "${key}". Silakan coba lagi.`,
        err,
      );
    }
  },

  /**
   * Retrieve and deserialize the value stored under `key`.
   * Returns null if the key does not exist or the stored value is corrupt JSON.
   * Never throws — all errors are swallowed and null is returned.
   * @param {string} key
   * @returns {*|null}
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_err) {
      // JSON.parse failure — corrupt data treated as missing
      return null;
    }
  },

  /**
   * Remove the entry stored under `key`.
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(key);
  },
};

// ============================================================
// Dashboard.GreetingWidget — real-time clock, date, and contextual greeting
// Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
// ============================================================

Dashboard.GreetingWidget = {
  _DAYS: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],

  _MONTHS: [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ],

  /**
   * Format a Date object as HH:MM:SS with zero-padding.
   * @param {Date} date
   * @returns {string}
   */
  _formatTime(date) {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  },

  /**
   * Format a Date object as "Nama Hari, D Bulan YYYY" in Bahasa Indonesia.
   * Example: "Kamis, 2 Juli 2026"
   * @param {Date} date
   * @returns {string}
   */
  _formatDate(date) {
    const dayName = this._DAYS[date.getDay()];
    const day = date.getDate();
    const monthName = this._MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  },

  /**
   * Return the contextual greeting string based on the hour (0–23).
   * Time_of_Day mapping:
   *   05–11 → "Selamat Pagi"
   *   12–14 → "Selamat Siang"
   *   15–17 → "Selamat Sore"
   *   18–23, 00–04 → "Selamat Malam"
   * @param {number} hour  integer in [0, 23]
   * @returns {string}
   */
  _getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return "Selamat Pagi";
    if (hour >= 12 && hour <= 14) return "Selamat Siang";
    if (hour >= 15 && hour <= 17) return "Selamat Sore";
    return "Selamat Malam";
  },

  /**
   * Compute the current time/date/greeting and push them into the DOM.
   * Reads the current time via new Date() — no stored state.
   */
  _tick() {
    const now = new Date();

    const greetingEl = document.getElementById("greeting-text");
    const clockEl = document.getElementById("clock-display");
    const dateEl = document.getElementById("date-display");

    const timeStr = this._formatTime(now);
    const dateStr = this._formatDate(now);
    const greeting = this._getGreeting(now.getHours());

    if (greetingEl) greetingEl.textContent = greeting;
    if (clockEl) {
      clockEl.textContent = timeStr;
      clockEl.setAttribute("datetime", now.toISOString());
    }
    if (dateEl) dateEl.textContent = dateStr;
  },

  /**
   * Start the widget: render immediately, then update every second.
   */
  init() {
    this._tick();
    setInterval(() => this._tick(), 1000);
  },
};

// ============================================================
// Dashboard.FocusTimer — Pomodoro countdown timer (25 minutes)
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
// ============================================================

Dashboard.FocusTimer = {
  /** Seconds remaining in the countdown (default: 25 min = 1500 s). */
  _remaining: 1500,
  /** ID returned by setInterval, or null when idle. */
  _intervalId: null,
  /** Whether the timer is currently running. */
  _running: false,
  /** Date.now() value captured when start() was called (for drift-free elapsed calc). */
  _startTime: null,
  /** _remaining value captured when start() was called. */
  _startRemaining: null,

  // ----------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------

  /**
   * Format a total-seconds value as MM:SS with zero-padding.
   * Exposed on the object so tests can call it directly.
   * @param {number} s  integer seconds [0, ∞)
   * @returns {string}  e.g. "25:00", "04:59"
   */
  _formatSeconds(s) {
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  },

  /**
   * Write the current _remaining value to #timer-display.
   */
  _updateDisplay() {
    const el = document.getElementById("timer-display");
    if (el) el.textContent = this._formatSeconds(this._remaining);
  },

  /**
   * Enable/disable #btn-start and #btn-stop based on running state.
   * @param {boolean} running
   */
  _setButtonStates(running) {
    const btnStart = document.getElementById("btn-start");
    const btnStop = document.getElementById("btn-stop");
    if (btnStart) btnStart.disabled = running;
    if (btnStop) btnStop.disabled = !running;
  },

  /**
   * Called when countdown reaches 00:00.
   * Stops the interval, shows the completion message, resets running state.
   */
  _onComplete() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._running = false;

    const msg = document.getElementById("timer-complete-msg");
    if (msg) msg.hidden = false;

    this._setButtonStates(false);
  },

  /**
   * Interval callback — recalculates remaining using wall-clock elapsed time
   * to prevent cumulative drift (Requirement 3.2).
   */
  _tick() {
    const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
    this._remaining = Math.max(0, this._startRemaining - elapsed);
    this._updateDisplay();

    if (this._remaining === 0) {
      this._onComplete();
    }
  },

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  /**
   * Start the countdown.
   * No-op if already running (Requirement 3.9).
   */
  start() {
    if (this._running) return;

    this._startTime = Date.now();
    this._startRemaining = this._remaining;
    this._running = true;
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._setButtonStates(true);
  },

  /**
   * Pause the countdown, retaining the current remaining value (Requirement 3.4).
   */
  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._running = false;
    this._setButtonStates(false);
  },

  /**
   * Stop and reset to 25:00 (Requirement 3.5).
   */
  reset() {
    this.stop();
    this._remaining = 1500;
    const msg = document.getElementById("timer-complete-msg");
    if (msg) msg.hidden = true;
    this._updateDisplay();
  },

  /**
   * Initialise the widget: render initial display and bind button clicks.
   */
  init() {
    this._updateDisplay();
    this._setButtonStates(false);

    const btnStart = document.getElementById("btn-start");
    const btnStop = document.getElementById("btn-stop");
    const btnReset = document.getElementById("btn-reset");

    if (btnStart) btnStart.addEventListener("click", () => this.start());
    if (btnStop) btnStop.addEventListener("click", () => this.stop());
    if (btnReset) btnReset.addEventListener("click", () => this.reset());
  },
};

// ============================================================
// Export for testing (Node.js / Vitest environment)
// ============================================================

export { Dashboard, StorageError };

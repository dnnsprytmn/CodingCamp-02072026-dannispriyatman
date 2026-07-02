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
// Export for testing (Node.js / Vitest environment)
// ============================================================

export { Dashboard, StorageError };

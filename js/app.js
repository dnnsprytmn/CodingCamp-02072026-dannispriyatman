// Todo List Life Dashboard - Application Logic

const Dashboard = {};

// ============================================================
// StorageError
// ============================================================

class StorageError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "StorageError";
    this.cause = cause;
  }
}

// ============================================================
// Dashboard.Storage
// ============================================================

Dashboard.Storage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      throw new StorageError(
        `Gagal menyimpan data untuk kunci "${key}". Silakan coba lagi.`,
        err,
      );
    }
  },

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};

// ============================================================
// Dashboard.GreetingWidget
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

  _formatTime(date) {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  },

  _formatDate(date) {
    const dayName = this._DAYS[date.getDay()];
    const day = date.getDate();
    const monthName = this._MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  },

  _getGreeting(hour) {
    const name = "Dannis";
    if (hour >= 5 && hour <= 11) return `Selamat Pagi, ${name}`;
    if (hour >= 12 && hour <= 14) return `Selamat Siang, ${name}`;
    if (hour >= 15 && hour <= 17) return `Selamat Sore, ${name}`;
    return `Selamat Malam, ${name}`;
  },

  _tick() {
    const now = new Date();
    const greetingEl = document.getElementById("greeting-text");
    const clockEl = document.getElementById("clock-display");
    const dateEl = document.getElementById("date-display");

    if (clockEl) {
      clockEl.textContent = this._formatTime(now);
      clockEl.setAttribute("datetime", now.toISOString());
    }
    if (dateEl) dateEl.textContent = this._formatDate(now);
    if (greetingEl) greetingEl.textContent = this._getGreeting(now.getHours());
  },

  init() {
    this._tick();
    setInterval(() => this._tick(), 1000);
  },
};

// ============================================================
// Dashboard.FocusTimer
// ============================================================

Dashboard.FocusTimer = {
  _remaining: 1500,
  _intervalId: null,
  _running: false,
  _startTime: null,
  _startRemaining: null,

  _formatSeconds(s) {
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  },

  _updateDisplay() {
    const el = document.getElementById("timer-display");
    if (el) el.textContent = this._formatSeconds(this._remaining);
  },

  _setButtonStates(running) {
    const btnStart = document.getElementById("btn-start");
    const btnStop = document.getElementById("btn-stop");
    if (btnStart) btnStart.disabled = running;
    if (btnStop) btnStop.disabled = !running;
  },

  _onComplete() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._running = false;
    const msg = document.getElementById("timer-complete-msg");
    if (msg) msg.hidden = false;
    this._setButtonStates(false);
  },

  _tick() {
    const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
    this._remaining = Math.max(0, this._startRemaining - elapsed);
    this._updateDisplay();
    if (this._remaining === 0) this._onComplete();
  },

  start() {
    if (this._running) return;
    this._startTime = Date.now();
    this._startRemaining = this._remaining;
    this._running = true;
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._setButtonStates(true);
  },

  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._running = false;
    this._setButtonStates(false);
  },

  reset() {
    this.stop();
    this._remaining = 1500;
    const msg = document.getElementById("timer-complete-msg");
    if (msg) msg.hidden = true;
    this._updateDisplay();
  },

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
// Dashboard.TodoList
// ============================================================

Dashboard.TodoList = {
  _tasks: [],
  _sortMode: "createdAt",

  _generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  },

  _validateTaskText(text, maxLen) {
    if (text === null || text === undefined || text.length === 0) {
      return { valid: false, error: "Deskripsi tugas tidak boleh kosong." };
    }
    if (text.trim().length === 0) {
      return {
        valid: false,
        error: "Deskripsi tugas tidak boleh hanya berisi spasi.",
      };
    }
    if (text.length > maxLen) {
      return {
        valid: false,
        error: `Deskripsi tugas maksimal ${maxLen} karakter.`,
      };
    }
    return { valid: true, error: null };
  },

  _loadTasks() {
    const data = Dashboard.Storage.load("dashboard_tasks");
    if (!data || !Array.isArray(data.tasks)) {
      this._tasks = [];
      return;
    }
    this._tasks = data.tasks.slice().sort((a, b) => a.createdAt - b.createdAt);
  },

  _getSortedTasks() {
    const tasks = this._tasks.slice();
    switch (this._sortMode) {
      case "createdAtDesc":
        return tasks.sort((a, b) => b.createdAt - a.createdAt);
      case "status":
        return tasks.sort((a, b) => Number(a.completed) - Number(b.completed));
      case "alpha":
        return tasks.sort((a, b) => a.text.localeCompare(b.text, "id"));
      case "createdAt":
      default:
        return tasks.sort((a, b) => a.createdAt - b.createdAt);
    }
  },

  _saveTasks() {
    Dashboard.Storage.save("dashboard_tasks", {
      version: 1,
      tasks: this._tasks,
    });
  },

  _showError(element, message) {
    if (!element) return;
    element.textContent = message;
  },

  _clearError(element) {
    if (!element) return;
    element.textContent = "";
  },

  _showGlobalError(message) {
    let banner = document.getElementById("todo-global-error");
    if (!banner) {
      banner = document.createElement("p");
      banner.id = "todo-global-error";
      banner.setAttribute("role", "alert");
      banner.setAttribute("aria-live", "assertive");
      banner.className = "global-error-banner";
      const section = document.querySelector(
        'section[aria-labelledby="todo-heading"]',
      );
      if (section) section.insertBefore(banner, section.firstChild);
    }
    banner.textContent = message;
    banner.hidden = false;
  },

  _renderTask(task) {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.className = task.completed ? "task-item task-completed" : "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Tandai selesai: ${task.text}`);
    checkbox.addEventListener("change", () => this.toggleTask(task.id));

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;
    textSpan.addEventListener("dblclick", () => this._startEdit(li, task));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn-edit-task";
    editBtn.setAttribute("aria-label", `Edit tugas: ${task.text}`);
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => this._startEdit(li, task));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete-task";
    deleteBtn.setAttribute("aria-label", `Hapus tugas: ${task.text}`);
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => this.deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    return li;
  },

  _render() {
    const list = document.getElementById("task-list");
    if (!list) return;
    list.innerHTML = "";
    this._getSortedTasks().forEach((task) =>
      list.appendChild(this._renderTask(task)),
    );
  },

  _startEdit(li, task) {
    if (li.querySelector(".task-edit-input")) return;

    const textSpan = li.querySelector(".task-text");
    const editBtn = li.querySelector(".btn-edit-task");
    const deleteBtn = li.querySelector(".btn-delete-task");

    textSpan.hidden = true;
    editBtn.hidden = true;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "task-edit-input";
    input.value = task.text;
    input.maxLength = 255;
    input.setAttribute("aria-label", "Edit teks tugas");

    const errorP = document.createElement("p");
    errorP.className = "task-edit-error";
    errorP.setAttribute("role", "alert");

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn-save-edit";
    saveBtn.textContent = "Simpan";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn-cancel-edit";
    cancelBtn.textContent = "Batal";

    const save = () => {
      const result = this.editTask(task.id, input.value, errorP);
      if (result)
        this._endEdit(li, textSpan, editBtn, input, errorP, saveBtn, cancelBtn);
    };

    const cancel = () => {
      this._endEdit(li, textSpan, editBtn, input, errorP, saveBtn, cancelBtn);
    };

    saveBtn.addEventListener("click", save);
    cancelBtn.addEventListener("click", cancel);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") cancel();
    });

    li.insertBefore(input, deleteBtn);
    li.insertBefore(errorP, deleteBtn);
    li.insertBefore(saveBtn, deleteBtn);
    li.insertBefore(cancelBtn, deleteBtn);
    input.focus();
    input.select();
  },

  _endEdit(li, textSpan, editBtn, input, errorP, saveBtn, cancelBtn) {
    textSpan.hidden = false;
    editBtn.hidden = false;
    [input, errorP, saveBtn, cancelBtn].forEach((el) => el.remove());
  },

  addTask(text) {
    const errorEl = document.getElementById("task-input-error");
    const validation = this._validateTaskText(text, 500);
    if (!validation.valid) {
      this._showError(errorEl, validation.error);
      return false;
    }
    this._clearError(errorEl);

    const task = {
      id: this._generateId(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    const prevTasks = this._tasks.slice();
    this._tasks.push(task);

    try {
      this._saveTasks();
      this._render();
      const inputEl = document.getElementById("task-input");
      if (inputEl) inputEl.value = "";
      return true;
    } catch (e) {
      if (e instanceof StorageError) {
        this._tasks = prevTasks;
        this._showGlobalError("Gagal menyimpan data. Silakan coba lagi.");
      }
      return false;
    }
  },

  editTask(id, newText, errorEl) {
    const validation = this._validateTaskText(newText, 255);
    if (!validation.valid) {
      if (errorEl) this._showError(errorEl, validation.error);
      return false;
    }

    const task = this._tasks.find((t) => t.id === id);
    if (!task) return false;

    const prevText = task.text;
    task.text = newText.trim();

    try {
      this._saveTasks();
      this._render();
      return true;
    } catch (e) {
      if (e instanceof StorageError) {
        task.text = prevText;
        this._showGlobalError("Gagal menyimpan data. Silakan coba lagi.");
      }
      return false;
    }
  },

  toggleTask(id) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;

    const prevCompleted = task.completed;
    task.completed = !task.completed;

    try {
      this._saveTasks();
      this._render();
    } catch (e) {
      if (e instanceof StorageError) {
        task.completed = prevCompleted;
        this._showGlobalError("Gagal menyimpan data. Silakan coba lagi.");
      }
    }
  },

  deleteTask(id) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;

    if (!window.confirm(`Hapus tugas "${task.text}"?`)) return;

    const prevTasks = this._tasks.slice();
    this._tasks = this._tasks.filter((t) => t.id !== id);

    try {
      this._saveTasks();
      this._render();
    } catch (e) {
      if (e instanceof StorageError) {
        this._tasks = prevTasks;
        this._showGlobalError("Gagal menyimpan data. Silakan coba lagi.");
      }
    }
  },

  init() {
    this._loadTasks();
    this._render();

    const form = document.getElementById("task-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputEl = document.getElementById("task-input");
        if (inputEl) this.addTask(inputEl.value);
      });
    }

    const sortSelect = document.getElementById("task-sort-select");
    if (sortSelect) {
      sortSelect.value = this._sortMode;
      sortSelect.addEventListener("change", (e) => {
        this._sortMode = e.target.value;
        this._render();
      });
    }
  },
};

// ============================================================
// Dashboard.QuickLinks
// ============================================================

Dashboard.QuickLinks = {
  _links: [],

  _generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  },

  _validateLink(label, url) {
    const errors = {};
    if (!label || label.trim().length === 0) {
      errors.label = "Label tidak boleh kosong.";
    } else if (label.trim().length > 100) {
      errors.label = "Label maksimal 100 karakter.";
    }

    if (!url || url.trim().length === 0) {
      errors.url = "URL harus dimulai dengan http:// atau https://.";
    } else {
      try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          errors.url = "URL harus dimulai dengan http:// atau https://.";
        }
      } catch (_) {
        errors.url = "URL harus dimulai dengan http:// atau https://.";
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  },

  _loadLinks() {
    const data = Dashboard.Storage.load("dashboard_links");
    if (!data || !Array.isArray(data.links)) {
      this._links = [];
      return;
    }
    this._links = data.links.slice().sort((a, b) => a.createdAt - b.createdAt);
  },

  _saveLinks() {
    Dashboard.Storage.save("dashboard_links", {
      version: 1,
      links: this._links,
    });
  },

  _showFieldError(fieldId, message) {
    const el = document.getElementById(fieldId);
    if (el) el.textContent = message;
  },

  _clearFieldErrors() {
    ["link-label-error", "link-url-error"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });
  },

  _showGlobalError(message) {
    let banner = document.getElementById("links-global-error");
    if (!banner) {
      banner = document.createElement("p");
      banner.id = "links-global-error";
      banner.setAttribute("role", "alert");
      banner.className = "global-error-banner";
      const section = document.querySelector(
        'section[aria-labelledby="links-heading"]',
      );
      if (section) section.insertBefore(banner, section.firstChild);
    }
    banner.textContent = message;
    banner.hidden = false;
  },

  _updateCapacityUI() {
    const btn = document.getElementById("btn-add-link");
    const msg = document.getElementById("link-limit-msg");
    const atLimit = this._links.length >= 50;
    if (btn) btn.disabled = atLimit;
    if (msg)
      msg.textContent = atLimit
        ? "Anda sudah mencapai batas maksimum 50 tautan."
        : "";
  },

  _renderLink(link) {
    const li = document.createElement("li");
    li.className = "link-item";
    li.dataset.id = link.id;

    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.label;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete-link";
    deleteBtn.setAttribute("aria-label", `Hapus tautan: ${link.label}`);
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => this.deleteLink(link.id));

    li.appendChild(anchor);
    li.appendChild(deleteBtn);
    return li;
  },

  _render() {
    const list = document.getElementById("link-list");
    if (!list) return;
    list.innerHTML = "";
    this._links.forEach((link) => list.appendChild(this._renderLink(link)));
    this._updateCapacityUI();
  },

  addLink(label, url) {
    if (this._links.length >= 50) {
      const msg = document.getElementById("link-limit-msg");
      if (msg)
        msg.textContent = "Anda sudah mencapai batas maksimum 50 tautan.";
      return false;
    }

    const { valid, errors } = this._validateLink(label, url);
    this._clearFieldErrors();

    if (!valid) {
      if (errors.label) this._showFieldError("link-label-error", errors.label);
      if (errors.url) this._showFieldError("link-url-error", errors.url);
      return false;
    }

    const link = {
      id: this._generateId(),
      label: label.trim(),
      url: url.trim(),
      createdAt: Date.now(),
    };

    const prevLinks = this._links.slice();
    this._links.push(link);

    try {
      this._saveLinks();
      this._render();
      const labelInput = document.getElementById("link-label-input");
      const urlInput = document.getElementById("link-url-input");
      if (labelInput) labelInput.value = "";
      if (urlInput) urlInput.value = "";
      return true;
    } catch (e) {
      if (e instanceof StorageError) {
        this._links = prevLinks;
        this._showGlobalError("Gagal menyimpan data. Silakan coba lagi.");
      }
      return false;
    }
  },

  deleteLink(id) {
    const prevLinks = this._links.slice();
    this._links = this._links.filter((l) => l.id !== id);

    try {
      this._saveLinks();
      this._render();
    } catch (e) {
      if (e instanceof StorageError) {
        this._links = prevLinks;
        this._showGlobalError("Gagal menyimpan data. Silakan coba lagi.");
      }
    }
  },

  init() {
    this._loadLinks();
    this._render();

    const form = document.getElementById("link-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const label = document.getElementById("link-label-input")?.value ?? "";
        const url = document.getElementById("link-url-input")?.value ?? "";
        this.addLink(label, url);
      });
    }
  },
};

// ============================================================
// Dashboard.ThemeToggle — light/dark mode with localStorage persistence
// ============================================================

Dashboard.ThemeToggle = {
  _STORAGE_KEY: "dashboard_theme",

  _apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("btn-theme-toggle");
    if (btn) {
      btn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      );
    }
  },

  toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    this._apply(next);
    try {
      localStorage.setItem(this._STORAGE_KEY, next);
    } catch (_) {
      // storage unavailable — ignore, visual still applied
    }
  },

  init() {
    // Load saved preference, fallback to system preference
    let saved = null;
    try {
      saved = localStorage.getItem(this._STORAGE_KEY);
    } catch (_) {}
    const preferred =
      saved ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    this._apply(preferred);

    const btn = document.getElementById("btn-theme-toggle");
    if (btn) btn.addEventListener("click", () => this.toggle());
  },
};

// ============================================================
// DOMContentLoaded entry point
// ============================================================

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    Dashboard.ThemeToggle.init();
    Dashboard.GreetingWidget.init();
    Dashboard.FocusTimer.init();
    Dashboard.TodoList.init();
    Dashboard.QuickLinks.init();
  });
}

// ============================================================
// Export for testing
// ============================================================

export { Dashboard, StorageError };

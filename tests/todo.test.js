/**
 * Tests for Dashboard.TodoList
 * Covers: Properties 5, 6, 7, 8, 9, 10, 11
 * Validates: Requirements 4.x, 5.x, 6.x, 7.x, 8.x
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { Dashboard, StorageError } from "../js/app.js";

// ---------------------------------------------------------------------------
// DOM setup helpers
// ---------------------------------------------------------------------------

function setupDOM() {
  [
    "task-form",
    "task-input",
    "btn-add-task",
    "task-input-error",
    "task-list",
    "todo-global-error",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  document.body.innerHTML = `
    <section aria-labelledby="todo-heading">
      <h2 id="todo-heading">Todo List</h2>
      <form id="task-form" aria-label="Tambah tugas baru">
        <label for="task-input">Deskripsi tugas</label>
        <input type="text" id="task-input" />
        <button type="submit" id="btn-add-task">Tambah</button>
      </form>
      <p id="task-input-error" role="alert" aria-live="assertive"></p>
      <ul id="task-list" aria-label="Daftar tugas"></ul>
    </section>
  `;
}

function resetTodoList() {
  Dashboard.TodoList._tasks = [];
  localStorage.clear();
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe("TodoList — unit tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupDOM();
    resetTodoList();
    Dashboard.TodoList.init();
  });

  // Requirement 4.3 — input cleared after successful add
  test("addTask clears input after successful add (Requirement 4.3)", () => {
    const input = document.getElementById("task-input");
    input.value = "Belajar vitest";
    Dashboard.TodoList.addTask("Belajar vitest");
    expect(input.value).toBe("");
  });

  // Requirement 4.2 — task starts with completed = false
  test("addTask creates task with completed=false", () => {
    Dashboard.TodoList.addTask("Task baru");
    expect(Dashboard.TodoList._tasks[0].completed).toBe(false);
  });

  // Requirement 4.5 — task persisted to localStorage
  test("addTask saves to localStorage", () => {
    Dashboard.TodoList.addTask("Persistent task");
    const stored = Dashboard.Storage.load("dashboard_tasks");
    expect(stored).not.toBeNull();
    expect(stored.tasks.length).toBe(1);
    expect(stored.tasks[0].text).toBe("Persistent task");
  });

  // Requirement 6.2, 6.3 — toggleTask flips completed
  test("toggleTask flips completed state", () => {
    Dashboard.TodoList.addTask("Toggle me");
    const id = Dashboard.TodoList._tasks[0].id;
    expect(Dashboard.TodoList._tasks[0].completed).toBe(false);
    Dashboard.TodoList.toggleTask(id);
    expect(Dashboard.TodoList._tasks[0].completed).toBe(true);
  });

  // Requirement 7.3 — deleteTask removes task (mock confirm = true)
  test("deleteTask removes task when confirmed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    Dashboard.TodoList.addTask("Da hapus");
    const id = Dashboard.TodoList._tasks[0].id;
    Dashboard.TodoList.deleteTask(id);
    expect(Dashboard.TodoList._tasks.length).toBe(0);
  });

  // deleteTask no-op when cancelled
  test("deleteTask does nothing when confirm cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    Dashboard.TodoList.addTask("Jangan hapus");
    const id = Dashboard.TodoList._tasks[0].id;
    Dashboard.TodoList.deleteTask(id);
    expect(Dashboard.TodoList._tasks.length).toBe(1);
  });

  // Requirement 8.3 — corrupt localStorage → empty list
  test("renders empty list if localStorage has corrupt JSON (Requirement 8.3)", () => {
    localStorage.setItem("dashboard_tasks", "{invalid json!!}");
    resetTodoList();
    setupDOM();
    Dashboard.TodoList.init();
    const list = document.getElementById("task-list");
    expect(list.children.length).toBe(0);
    expect(Dashboard.TodoList._tasks.length).toBe(0);
  });

  // Requirement 5.2 — edit pre-fills existing text
  test("edit mode pre-fills existing task text", () => {
    Dashboard.TodoList.addTask("Teks asli");
    const li = document.querySelector(".task-item");
    const task = Dashboard.TodoList._tasks[0];
    Dashboard.TodoList._startEdit(li, task);
    const editInput = li.querySelector(".task-edit-input");
    expect(editInput).not.toBeNull();
    expect(editInput.value).toBe("Teks asli");
  });
});

// ---------------------------------------------------------------------------
// Property 5: addTask valid text creates new task with completed=false
// Feature: todo-list-life-dashboard, Property 5: Penambahan task valid
// Validates: Requirements 4.2, 4.3
// ---------------------------------------------------------------------------

describe("TodoList — Property 5: addTask valid creates task with completed=false", () => {
  beforeEach(() => {
    setupDOM();
    resetTodoList();
    Dashboard.TodoList.init();
  });

  test("addTask valid text creates new task with completed=false (Property 5)", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 500 })
          .filter((s) => s.trim().length > 0),
        (text) => {
          resetTodoList();
          Dashboard.TodoList._tasks = [];
          Dashboard.TodoList.addTask(text);
          expect(Dashboard.TodoList._tasks.length).toBe(1);
          expect(Dashboard.TodoList._tasks[0].completed).toBe(false);
          expect(Dashboard.TodoList._tasks[0].text).toBe(text.trim());
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: empty/whitespace input rejected
// Feature: todo-list-life-dashboard, Property 6: Input kosong atau hanya spasi ditolak
// Validates: Requirements 4.4
// ---------------------------------------------------------------------------

describe("TodoList — Property 6: addTask rejects empty or whitespace-only input", () => {
  beforeEach(() => {
    setupDOM();
    resetTodoList();
    Dashboard.TodoList.init();
  });

  test("addTask rejects empty or whitespace-only input (Property 6)", () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(" ", "\t", "\n", "\r")),
        (whitespaceText) => {
          const initialLength = Dashboard.TodoList._tasks.length;
          Dashboard.TodoList.addTask(whitespaceText);
          expect(Dashboard.TodoList._tasks.length).toBe(initialLength);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: round-trip save/load preserves all task data
// Feature: todo-list-life-dashboard, Property 7: Round-trip penyimpanan task
// Validates: Requirements 4.5, 6.4, 8.2
// ---------------------------------------------------------------------------

describe("TodoList — Property 7: round-trip save/load preserves task data", () => {
  beforeEach(() => {
    setupDOM();
    resetTodoList();
  });

  test("round-trip save/load preserves all task data (Property 7)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            text: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => s.trim().length > 0),
            completed: fc.boolean(),
            createdAt: fc.integer({ min: 1000000, max: 9999999999 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (tasks) => {
          localStorage.clear();
          Dashboard.Storage.save("dashboard_tasks", { version: 1, tasks });
          Dashboard.TodoList._tasks = [];
          Dashboard.TodoList._loadTasks();

          const sorted = tasks
            .slice()
            .sort((a, b) => a.createdAt - b.createdAt);
          expect(Dashboard.TodoList._tasks.length).toBe(sorted.length);
          Dashboard.TodoList._tasks.forEach((t, i) => {
            expect(t.id).toBe(sorted[i].id);
            expect(t.text).toBe(sorted[i].text);
            expect(t.completed).toBe(sorted[i].completed);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: editTask valid updates; invalid rejects
// Feature: todo-list-life-dashboard, Property 9: Validasi edit task
// Validates: Requirements 5.3, 5.4, 5.6
// ---------------------------------------------------------------------------

describe("TodoList — Property 9: editTask validation", () => {
  beforeEach(() => {
    setupDOM();
    resetTodoList();
    Dashboard.TodoList.init();
  });

  test("editTask valid text updates task (Property 9 — valid path)", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 255 })
          .filter((s) => s.trim().length > 0),
        (newText) => {
          Dashboard.TodoList._tasks = [
            {
              id: "test-edit-id",
              text: "Teks lama",
              completed: false,
              createdAt: Date.now(),
            },
          ];
          const result = Dashboard.TodoList.editTask(
            "test-edit-id",
            newText,
            null,
          );
          expect(result).toBe(true);
          expect(Dashboard.TodoList._tasks[0].text).toBe(newText.trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  test("editTask rejects empty/whitespace/over-255 chars (Property 9 — invalid path)", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.stringOf(fc.constantFrom(" ", "\t", "\n")),
          fc.string({ minLength: 256, maxLength: 600 }),
        ),
        (invalidText) => {
          const originalText = "Teks asli tidak berubah";
          Dashboard.TodoList._tasks = [
            {
              id: "test-edit-invalid",
              text: originalText,
              completed: false,
              createdAt: Date.now(),
            },
          ];
          const result = Dashboard.TodoList.editTask(
            "test-edit-invalid",
            invalidText,
            null,
          );
          expect(result).toBe(false);
          expect(Dashboard.TodoList._tasks[0].text).toBe(originalText);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: toggleTask twice = round-trip
// Feature: todo-list-life-dashboard, Property 10: Toggle task adalah operasi round-trip
// Validates: Requirements 6.2, 6.3
// ---------------------------------------------------------------------------

describe("TodoList — Property 10: toggleTask twice returns to original state", () => {
  beforeEach(() => {
    setupDOM();
    resetTodoList();
    Dashboard.TodoList.init();
  });

  test("toggleTask twice returns to original completed state (Property 10)", () => {
    fc.assert(
      fc.property(fc.boolean(), (initialCompleted) => {
        Dashboard.TodoList._tasks = [
          {
            id: "toggle-test-id",
            text: "Toggle task",
            completed: initialCompleted,
            createdAt: Date.now(),
          },
        ];
        Dashboard.TodoList.toggleTask("toggle-test-id");
        Dashboard.TodoList.toggleTask("toggle-test-id");
        expect(Dashboard.TodoList._tasks[0].completed).toBe(initialCompleted);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: deleteTask removes task and leaves others intact
// Feature: todo-list-life-dashboard, Property 11: Penghapusan task
// Validates: Requirements 7.3
// ---------------------------------------------------------------------------

describe("TodoList — Property 11: deleteTask removes only targeted task", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    setupDOM();
    resetTodoList();
    Dashboard.TodoList.init();
  });

  test("deleteTask removes task from list and storage (Property 11)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            text: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            completed: fc.boolean(),
            createdAt: fc.integer({ min: 1, max: 9999999 }),
          }),
          { minLength: 2, maxLength: 8 },
        ),
        (tasks) => {
          // Ensure unique IDs
          const uniqueTasks = tasks.filter(
            (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i,
          );
          if (uniqueTasks.length < 2) return;

          Dashboard.TodoList._tasks = uniqueTasks.slice();
          const targetId = uniqueTasks[0].id;
          Dashboard.TodoList.deleteTask(targetId);

          expect(
            Dashboard.TodoList._tasks.find((t) => t.id === targetId),
          ).toBeUndefined();
          expect(Dashboard.TodoList._tasks.length).toBe(uniqueTasks.length - 1);

          const stored = Dashboard.Storage.load("dashboard_tasks");
          expect(stored.tasks.find((t) => t.id === targetId)).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

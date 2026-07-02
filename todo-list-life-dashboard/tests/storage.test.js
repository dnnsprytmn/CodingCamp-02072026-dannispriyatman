/**
 * Tests for Dashboard.Storage
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 9.7
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { Dashboard, StorageError } from "../app.js";

const { Storage } = Dashboard;

// Clear localStorage before each test to ensure isolation
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ============================================================
// Unit Tests
// ============================================================

describe("Storage.save / Storage.load round-trip", () => {
  test("save and load round-trip preserves primitive values", () => {
    Storage.save("key_num", 42);
    expect(Storage.load("key_num")).toBe(42);

    Storage.save("key_str", "hello");
    expect(Storage.load("key_str")).toBe("hello");

    Storage.save("key_bool", true);
    expect(Storage.load("key_bool")).toBe(true);
  });

  test("save and load round-trip preserves a plain object", () => {
    const data = {
      version: 1,
      tasks: [{ id: "abc", text: "test", completed: false, createdAt: 1000 }],
    };
    Storage.save("dashboard_tasks", data);
    const result = Storage.load("dashboard_tasks");
    expect(result).toEqual(data);
  });

  test("save and load round-trip preserves an array", () => {
    const arr = [1, "two", { three: 3 }];
    Storage.save("arr_key", arr);
    expect(Storage.load("arr_key")).toEqual(arr);
  });

  test("save and load round-trip preserves null value", () => {
    Storage.save("null_key", null);
    // JSON.stringify(null) === "null", JSON.parse("null") === null
    expect(Storage.load("null_key")).toBeNull();
  });
});

describe("Storage.load — missing or corrupt data", () => {
  test("load returns null for a key that was never set", () => {
    expect(Storage.load("nonexistent_key")).toBeNull();
  });

  test("load returns null for corrupt JSON stored directly in localStorage", () => {
    localStorage.setItem("corrupt_key", "{invalid json!!}");
    expect(Storage.load("corrupt_key")).toBeNull();
  });

  test("load returns null for an empty string stored in localStorage", () => {
    localStorage.setItem("empty_key", "");
    expect(Storage.load("empty_key")).toBeNull();
  });

  test("load returns null for a truncated JSON string", () => {
    localStorage.setItem("truncated_key", '{"version":1,"tasks":[{');
    expect(Storage.load("truncated_key")).toBeNull();
  });
});

describe("Storage.remove", () => {
  test("remove deletes the stored key so subsequent load returns null", () => {
    Storage.save("to_remove", { data: "some value" });
    expect(Storage.load("to_remove")).not.toBeNull(); // confirm it was saved
    Storage.remove("to_remove");
    expect(Storage.load("to_remove")).toBeNull();
  });

  test("remove on a non-existent key does not throw", () => {
    expect(() => Storage.remove("does_not_exist")).not.toThrow();
  });

  test("remove only deletes the targeted key, leaving others intact", () => {
    Storage.save("keep_this", "preserved");
    Storage.save("delete_this", "gone");
    Storage.remove("delete_this");
    expect(Storage.load("keep_this")).toBe("preserved");
    expect(Storage.load("delete_this")).toBeNull();
  });
});

describe("Storage.save — error handling", () => {
  test("save throws StorageError when localStorage.setItem throws QuotaExceededError", () => {
    const quotaError = new DOMException(
      "QuotaExceededError",
      "QuotaExceededError",
    );
    vi.spyOn(
      Storage.prototype !== undefined
        ? Storage.prototype
        : Object.getPrototypeOf(localStorage),
      "setItem",
    ).mockImplementation(() => {
      throw quotaError;
    });

    // Spy directly on the localStorage object used by jsdom
    const setItemSpy = vi
      .spyOn(localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      });

    expect(() => Storage.save("quota_key", { data: "large" })).toThrow(
      StorageError,
    );
    setItemSpy.mockRestore();
  });

  test("StorageError has the correct name property", () => {
    const setItemSpy = vi
      .spyOn(localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });

    let caughtError;
    try {
      Storage.save("security_key", "data");
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(StorageError);
    expect(caughtError.name).toBe("StorageError");
    setItemSpy.mockRestore();
  });

  test("StorageError is an instance of Error", () => {
    const err = new StorageError("test message", new Error("cause"));
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(StorageError);
    expect(err.message).toBe("test message");
    expect(err.name).toBe("StorageError");
  });

  test("save does NOT throw for normal data (happy path)", () => {
    expect(() => Storage.save("happy_key", { tasks: [] })).not.toThrow();
  });
});

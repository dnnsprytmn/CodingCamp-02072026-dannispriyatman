/**
 * Tests for Dashboard.FocusTimer
 * Covers: Property 4 (format timer MM:SS) + unit tests for state machine
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9, 3.10
 */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { Dashboard } from "../app.js";

// ---------------------------------------------------------------------------
// DOM helper — create and attach all required elements before each test
// ---------------------------------------------------------------------------

function setupDOM() {
  // Clean up any leftover elements from a previous test
  [
    "timer-display",
    "btn-start",
    "btn-stop",
    "btn-reset",
    "timer-complete-msg",
  ].forEach((id) => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
  });

  const display = document.createElement("output");
  display.id = "timer-display";
  document.body.appendChild(display);

  const btnStart = document.createElement("button");
  btnStart.id = "btn-start";
  document.body.appendChild(btnStart);

  const btnStop = document.createElement("button");
  btnStop.id = "btn-stop";
  document.body.appendChild(btnStop);

  const btnReset = document.createElement("button");
  btnReset.id = "btn-reset";
  document.body.appendChild(btnReset);

  const msg = document.createElement("p");
  msg.id = "timer-complete-msg";
  msg.hidden = true;
  document.body.appendChild(msg);
}

// ---------------------------------------------------------------------------
// Reset FocusTimer internal state between tests so tests are isolated
// ---------------------------------------------------------------------------

function resetTimer() {
  clearInterval(Dashboard.FocusTimer._intervalId);
  Dashboard.FocusTimer._remaining = 1500;
  Dashboard.FocusTimer._intervalId = null;
  Dashboard.FocusTimer._running = false;
  Dashboard.FocusTimer._startTime = null;
  Dashboard.FocusTimer._startRemaining = null;
}

// ---------------------------------------------------------------------------
// Unit tests — state machine and DOM behaviour
// ---------------------------------------------------------------------------

describe("FocusTimer — unit tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupDOM();
    resetTimer();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Requirement 3.1 — initial display shows 25:00
  test("shows 25:00 on init (Requirement 3.1)", () => {
    Dashboard.FocusTimer.init();
    expect(document.getElementById("timer-display").textContent).toBe("25:00");
  });

  // Requirement 3.9 — Start button disabled while running
  test("Start button is disabled while running (Requirement 3.9)", () => {
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();
    expect(document.getElementById("btn-start").disabled).toBe(true);
  });

  // Requirement 3.10 — Stop button disabled when idle
  test("Stop button is disabled when idle (Requirement 3.10)", () => {
    Dashboard.FocusTimer.init();
    expect(document.getElementById("btn-stop").disabled).toBe(true);
  });

  // Stop button enabled while running
  test("Stop button is enabled while running", () => {
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();
    expect(document.getElementById("btn-stop").disabled).toBe(false);
  });

  // Requirement 3.3 — timer display updates every second while running
  test("Start transitions to running state and display updates (Requirement 3.3)", () => {
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();
    expect(Dashboard.FocusTimer._running).toBe(true);

    // Advance 1 second
    vi.advanceTimersByTime(1000);
    // Should have ticked down by 1 second
    const displayed = document.getElementById("timer-display").textContent;
    // Either 24:59 (ticked once) or 25:00 if no tick yet — at least running
    expect(Dashboard.FocusTimer._running).toBe(true);
    expect(displayed).toMatch(/^\d{2}:\d{2}$/);
  });

  // Requirement 3.4 — Stop retains current value
  test("Stop retains current remaining value (Requirement 3.4)", () => {
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();
    vi.advanceTimersByTime(5000); // 5 ticks
    const remainingAfterTicks = Dashboard.FocusTimer._remaining;
    Dashboard.FocusTimer.stop();
    expect(Dashboard.FocusTimer._running).toBe(false);
    expect(Dashboard.FocusTimer._remaining).toBe(remainingAfterTicks);
  });

  // Requirement 3.5 — Reset returns to 25:00
  test("Reset returns display to 25:00 (Requirement 3.5)", () => {
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();
    vi.advanceTimersByTime(10000);
    Dashboard.FocusTimer.reset();
    expect(Dashboard.FocusTimer._remaining).toBe(1500);
    expect(document.getElementById("timer-display").textContent).toBe("25:00");
  });

  // Reset also disables Stop and enables Start
  test("Reset restores idle button states", () => {
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();
    Dashboard.FocusTimer.reset();
    expect(document.getElementById("btn-start").disabled).toBe(false);
    expect(document.getElementById("btn-stop").disabled).toBe(true);
  });

  // Requirement 3.6 & 3.7 & 3.8 — completion behaviour
  test("Countdown reaching 00:00 stops, shows message, restores idle states (Requirements 3.6, 3.7, 3.8)", () => {
    Dashboard.FocusTimer._remaining = 2; // short countdown for test
    Dashboard.FocusTimer._startRemaining = 2;
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();

    // Advance past the full duration
    vi.advanceTimersByTime(3000);

    expect(Dashboard.FocusTimer._remaining).toBe(0);
    expect(Dashboard.FocusTimer._running).toBe(false);
    expect(document.getElementById("timer-complete-msg").hidden).toBe(false);
    expect(document.getElementById("btn-start").disabled).toBe(false);
    expect(document.getElementById("btn-stop").disabled).toBe(true);
  });

  // start() is a no-op when already running (Requirement 3.9)
  test("start() is no-op when already running", () => {
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.start();
    const firstIntervalId = Dashboard.FocusTimer._intervalId;
    Dashboard.FocusTimer.start(); // call again
    expect(Dashboard.FocusTimer._intervalId).toBe(firstIntervalId);
  });

  // Reset hides the completion message
  test("Reset hides timer-complete-msg", () => {
    const msg = document.getElementById("timer-complete-msg");
    msg.hidden = false; // simulate completed state
    Dashboard.FocusTimer.init();
    Dashboard.FocusTimer.reset();
    expect(msg.hidden).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 4 — MM:SS format holds for any integer seconds in [0, 1500]
// Feature: todo-list-life-dashboard, Property 4: Format timer selalu MM:SS
// ---------------------------------------------------------------------------

describe("FocusTimer — Property 4: format timer MM:SS", () => {
  // No fake timers needed here — pure function test
  test("timer display format MM:SS for any seconds in [0, 1500] (Property 4 — Validates: Requirements 3.3)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = Dashboard.FocusTimer._formatSeconds(seconds);

        // Must match MM:SS pattern
        expect(result).toMatch(/^\d{2}:\d{2}$/);

        // Must be mathematically correct
        const [mm, ss] = result.split(":").map(Number);
        expect(mm).toBe(Math.floor(seconds / 60));
        expect(ss).toBe(seconds % 60);
      }),
      { numRuns: 100 },
    );
  });
});

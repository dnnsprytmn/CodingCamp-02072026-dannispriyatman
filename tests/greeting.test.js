/**
 * Tests for Dashboard.GreetingWidget
 * Covers: Properties 1, 2, 3 (format waktu, tanggal, sapaan)
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4
 */
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import { Dashboard } from "../app.js";

const GW = Dashboard.GreetingWidget;

// ─── Indonesian locale fixtures ──────────────────────────────────────────────

const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const INDONESIAN_MONTHS = [
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
];

// ─── Property 1: _formatTime returns HH:MM:SS for any date ───────────────────
// Feature: todo-list-life-dashboard, Property 1: Format waktu selalu HH:MM:SS
// Validates: Requirements 1.1

describe("GreetingWidget", () => {
  test("Property 1: _formatTime returns HH:MM:SS for any date", () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date(2000, 0, 1),
          max: new Date(2099, 11, 31, 23, 59, 59),
        }),
        (date) => {
          const result = GW._formatTime(date);

          // Must match pattern HH:MM:SS
          expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);

          // Values must exactly match the Date object
          const [h, m, s] = result.split(":").map(Number);
          expect(h).toBe(date.getHours());
          expect(m).toBe(date.getMinutes());
          expect(s).toBe(date.getSeconds());
        },
      ),
      { numRuns: 100 },
    );
  });

  // ─── Property 2: _formatDate returns Indonesian date string for any date ───
  // Feature: todo-list-life-dashboard, Property 2: Format tanggal dalam Bahasa Indonesia
  // Validates: Requirements 1.2

  test("Property 2: _formatDate returns Indonesian date string for any date", () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date(2000, 0, 1),
          max: new Date(2099, 11, 31),
        }),
        (date) => {
          const result = GW._formatDate(date);

          // Must contain the correct Indonesian day name
          const expectedDay = INDONESIAN_DAYS[date.getDay()];
          expect(result).toContain(expectedDay);

          // Must contain the correct day-of-month number (not zero-padded)
          const expectedDayNum = String(date.getDate());
          expect(result).toContain(expectedDayNum);

          // Must contain the correct Indonesian month name
          const expectedMonth = INDONESIAN_MONTHS[date.getMonth()];
          expect(result).toContain(expectedMonth);

          // Must contain the correct 4-digit year
          const expectedYear = String(date.getFullYear());
          expect(result).toContain(expectedYear);
        },
      ),
      { numRuns: 100 },
    );
  });

  // ─── Property 3: _getGreeting returns correct greeting for all hours 0–23 ──
  // Feature: todo-list-life-dashboard, Property 3: Pemetaan sapaan mencakup semua jam (0–23)
  // Validates: Requirements 2.1, 2.2, 2.3, 2.4

  test("Property 3: _getGreeting returns correct greeting for all hours 0-23", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        const greeting = GW._getGreeting(hour);

        if (hour >= 5 && hour <= 11) {
          expect(greeting).toBe("Selamat Pagi");
        } else if (hour >= 12 && hour <= 14) {
          expect(greeting).toBe("Selamat Siang");
        } else if (hour >= 15 && hour <= 17) {
          expect(greeting).toBe("Selamat Sore");
        } else {
          // hours 0–4 and 18–23
          expect(greeting).toBe("Selamat Malam");
        }

        // Must be one of exactly four valid greetings
        const validGreetings = [
          "Selamat Pagi",
          "Selamat Siang",
          "Selamat Sore",
          "Selamat Malam",
        ];
        expect(validGreetings).toContain(greeting);
      }),
      { numRuns: 100 },
    );
  });
});

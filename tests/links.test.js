/**
 * Tests for Dashboard.QuickLinks
 * Covers: Properties 12, 13, 14, 15, 16
 * Validates: Requirements 9.x
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { Dashboard, StorageError } from "../js/app.js";

// ---------------------------------------------------------------------------
// DOM setup helpers
// ---------------------------------------------------------------------------

function setupDOM() {
  document.body.innerHTML = `
    <section aria-labelledby="links-heading">
      <h2 id="links-heading">Quick Links</h2>
      <form id="link-form" aria-label="Tambah quick link baru">
        <div>
          <label for="link-label-input">Label</label>
          <input type="text" id="link-label-input" />
          <p id="link-label-error" role="alert"></p>
        </div>
        <div>
          <label for="link-url-input">URL</label>
          <input type="url" id="link-url-input" />
          <p id="link-url-error" role="alert"></p>
        </div>
        <button type="submit" id="btn-add-link">Tambah Tautan</button>
      </form>
      <p id="link-limit-msg" aria-live="polite"></p>
      <ul id="link-list" aria-label="Daftar quick links"></ul>
    </section>
  `;
}

function resetQuickLinks() {
  Dashboard.QuickLinks._links = [];
  localStorage.clear();
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe("QuickLinks — unit tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupDOM();
    resetQuickLinks();
    Dashboard.QuickLinks.init();
  });

  test("addLink valid saves to storage (Requirement 9.2)", () => {
    Dashboard.QuickLinks.addLink("Google", "https://google.com");
    const stored = Dashboard.Storage.load("dashboard_links");
    expect(stored).not.toBeNull();
    expect(stored.links.length).toBe(1);
    expect(stored.links[0].label).toBe("Google");
    expect(stored.links[0].url).toBe("https://google.com");
  });

  test("addLink clears form after successful add", () => {
    document.getElementById("link-label-input").value = "Test";
    document.getElementById("link-url-input").value = "https://test.com";
    Dashboard.QuickLinks.addLink("Test", "https://test.com");
    expect(document.getElementById("link-label-input").value).toBe("");
    expect(document.getElementById("link-url-input").value).toBe("");
  });

  test("shows error for empty label (Requirement 9.3)", () => {
    Dashboard.QuickLinks.addLink("", "https://google.com");
    expect(
      document.getElementById("link-label-error").textContent,
    ).toBeTruthy();
    expect(Dashboard.QuickLinks._links.length).toBe(0);
  });

  test("shows error for invalid URL (Requirement 9.3)", () => {
    Dashboard.QuickLinks.addLink("Test", "not-a-url");
    expect(document.getElementById("link-url-error").textContent).toBeTruthy();
    expect(Dashboard.QuickLinks._links.length).toBe(0);
  });

  test("rejects add when 50 links already exist (Requirement 9.2 / 9.9)", () => {
    for (let i = 0; i < 50; i++) {
      Dashboard.QuickLinks._links.push({
        id: `id-${i}`,
        label: `Link ${i}`,
        url: `https://example${i}.com`,
        createdAt: i,
      });
    }
    const result = Dashboard.QuickLinks.addLink(
      "One more",
      "https://extra.com",
    );
    expect(result).toBe(false);
    expect(Dashboard.QuickLinks._links.length).toBe(50);
  });

  test("btn-add-link disabled when 50 links exist", () => {
    for (let i = 0; i < 50; i++) {
      Dashboard.QuickLinks._links.push({
        id: `id-${i}`,
        label: `Link ${i}`,
        url: `https://example${i}.com`,
        createdAt: i,
      });
    }
    Dashboard.QuickLinks._render();
    expect(document.getElementById("btn-add-link").disabled).toBe(true);
  });

  test("renders empty area if no links in storage (Requirement 9.8)", () => {
    resetQuickLinks();
    setupDOM();
    Dashboard.QuickLinks.init();
    const list = document.getElementById("link-list");
    expect(list.children.length).toBe(0);
  });

  test("deleteLink removes item from list and storage (Requirement 9.6)", () => {
    Dashboard.QuickLinks.addLink("Del me", "https://delete.com");
    const id = Dashboard.QuickLinks._links[0].id;
    Dashboard.QuickLinks.deleteLink(id);
    expect(Dashboard.QuickLinks._links.length).toBe(0);
    const stored = Dashboard.Storage.load("dashboard_links");
    expect(stored.links.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Property 12: addLink valid saves to storage
// Feature: todo-list-life-dashboard, Property 12: Penambahan Quick Link valid
// Validates: Requirements 9.2
// ---------------------------------------------------------------------------

describe("QuickLinks — Property 12: addLink valid saves to storage", () => {
  beforeEach(() => {
    setupDOM();
    resetQuickLinks();
    Dashboard.QuickLinks.init();
  });

  test("addLink valid label+url saves to storage (Property 12)", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => s.trim().length > 0),
        fc.oneof(
          fc.webUrl({ withQueryParameters: false, withFragments: false }),
          fc.constantFrom(
            "https://example.com",
            "http://test.org",
            "https://sub.domain.co",
          ),
        ),
        (label, url) => {
          resetQuickLinks();
          const result = Dashboard.QuickLinks.addLink(label, url);
          if (result) {
            expect(Dashboard.QuickLinks._links.length).toBe(1);
            expect(Dashboard.QuickLinks._links[0].label).toBe(label.trim());
            const stored = Dashboard.Storage.load("dashboard_links");
            expect(stored.links.length).toBe(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: _validateLink accepts only http/https absolute URLs
// Feature: todo-list-life-dashboard, Property 13: Validasi URL Quick Links
// Validates: Requirements 9.3
// ---------------------------------------------------------------------------

describe("QuickLinks — Property 13: _validateLink accepts only http/https URLs", () => {
  test("_validateLink accepts only http/https absolute URLs (Property 13)", () => {
    // Valid: http and https
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(
            "https://example.com",
            "http://test.org",
            "https://a.b.c/path",
          ),
        ),
        (validUrl) => {
          const result = Dashboard.QuickLinks._validateLink("Label", validUrl);
          expect(result.valid).toBe(true);
        },
      ),
      { numRuns: 30 },
    );

    // Invalid: non-absolute, ftp, empty
    const invalidUrls = [
      "ftp://example.com",
      "relative/path",
      "//example.com",
      "",
      "javascript:alert(1)",
      "data:text/html,<h1>test</h1>",
    ];
    invalidUrls.forEach((url) => {
      const result = Dashboard.QuickLinks._validateLink("Label", url);
      expect(result.valid).toBe(false);
      expect(result.errors.url).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Property 14: _renderLink produces anchor with correct href and target=_blank
// Feature: todo-list-life-dashboard, Property 14: Setiap Quick Link dirender sebagai tautan
// Validates: Requirements 9.4
// ---------------------------------------------------------------------------

describe("QuickLinks — Property 14: _renderLink produces anchor with href and target=_blank", () => {
  test("_renderLink produces anchor with correct href and target=_blank (Property 14)", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          label: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          url: fc.constantFrom(
            "https://example.com",
            "http://test.org",
            "https://foo.bar",
          ),
          createdAt: fc.integer({ min: 1, max: 9999999 }),
        }),
        (link) => {
          const li = Dashboard.QuickLinks._renderLink(link);
          const anchor = li.querySelector("a");
          expect(anchor).not.toBeNull();
          // jsdom normalizes href (e.g. adds trailing slash), compare via URL object
          expect(new URL(anchor.href).href).toBe(new URL(link.url).href);
          expect(anchor.target).toBe("_blank");
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: deleteLink removes item from list and storage
// Feature: todo-list-life-dashboard, Property 15: Penghapusan Quick Link
// Validates: Requirements 9.6
// ---------------------------------------------------------------------------

describe("QuickLinks — Property 15: deleteLink removes only targeted link", () => {
  beforeEach(() => {
    setupDOM();
    resetQuickLinks();
    Dashboard.QuickLinks.init();
  });

  test("deleteLink removes item from list and storage (Property 15)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            label: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            url: fc.constantFrom(
              "https://a.com",
              "https://b.com",
              "http://c.com",
            ),
            createdAt: fc.integer({ min: 1, max: 9999999 }),
          }),
          { minLength: 2, maxLength: 8 },
        ),
        (links) => {
          const uniqueLinks = links.filter(
            (l, i, arr) => arr.findIndex((x) => x.id === l.id) === i,
          );
          if (uniqueLinks.length < 2) return;

          Dashboard.QuickLinks._links = uniqueLinks.slice();
          const targetId = uniqueLinks[0].id;
          Dashboard.QuickLinks.deleteLink(targetId);

          expect(
            Dashboard.QuickLinks._links.find((l) => l.id === targetId),
          ).toBeUndefined();
          expect(Dashboard.QuickLinks._links.length).toBe(
            uniqueLinks.length - 1,
          );

          const stored = Dashboard.Storage.load("dashboard_links");
          expect(stored.links.find((l) => l.id === targetId)).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: round-trip save/load preserves all link data
// Feature: todo-list-life-dashboard, Property 16: Round-trip penyimpanan Quick Links
// Validates: Requirements 9.7
// ---------------------------------------------------------------------------

describe("QuickLinks — Property 16: round-trip save/load preserves link data", () => {
  beforeEach(() => {
    setupDOM();
    resetQuickLinks();
  });

  test("round-trip save/load preserves all link data (Property 16)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            label: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            url: fc.constantFrom(
              "https://a.com",
              "https://b.com",
              "http://c.org",
            ),
            createdAt: fc.integer({ min: 1000, max: 9999999 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (links) => {
          localStorage.clear();
          Dashboard.Storage.save("dashboard_links", { version: 1, links });
          Dashboard.QuickLinks._links = [];
          Dashboard.QuickLinks._loadLinks();

          const sorted = links
            .slice()
            .sort((a, b) => a.createdAt - b.createdAt);
          expect(Dashboard.QuickLinks._links.length).toBe(sorted.length);
          Dashboard.QuickLinks._links.forEach((l, i) => {
            expect(l.id).toBe(sorted[i].id);
            expect(l.label).toBe(sorted[i].label);
            expect(l.url).toBe(sorted[i].url);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

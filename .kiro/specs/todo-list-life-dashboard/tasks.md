# Implementation Plan: Todo List Life Dashboard

## Overview

Implementasi aplikasi web produktivitas single-page berbasis Vanilla JS/HTML/CSS. Semua logika dikemas dalam tiga file (`index.html`, `style.css`, `app.js`) tanpa dependensi eksternal. Pengujian menggunakan **Vitest** + **fast-check** dalam environment Node.js/jsdom.

---

## Tasks

- [x] 1. Scaffolding project dan setup testing
  - [x] 1.1 Buat struktur file proyek dan konfigurasi testing
    - Buat direktori `todo-list-life-dashboard/` dengan file `index.html`, `style.css`, dan `app.js` (kosong/stub)
    - Inisialisasi `package.json` dengan `vitest`, `jsdom`, dan `fast-check` sebagai `devDependencies`
    - Buat `vitest.config.js` dengan environment jsdom
    - Buat `tests/` directory dengan `greeting.test.js`, `timer.test.js`, `todo.test.js`, `links.test.js`, `storage.test.js`
    - _Requirements: 10.1, 10.3, 10.5_
  - [x] 1.2 Buat semantic HTML skeleton di `index.html`
    - Gunakan `<header>` untuk GreetingWidget (role landmark header halaman)
    - Gunakan `<main>` sebagai wrapper seluruh konten dashboard
    - Gunakan `<section aria-labelledby>` untuk setiap widget: GreetingWidget, FocusTimer, TodoList, QuickLinks
    - Setiap `<section>` memiliki `<h2 id="...">` sebagai heading judul widget (dipakai oleh `aria-labelledby`)
    - Gunakan `<ul>` untuk `#task-list` dan `#link-list`; setiap item task/link adalah `<li>`
    - Gunakan `<form>` untuk form tambah task dan form tambah quick link, dengan atribut `aria-label`
    - Tambahkan `lang="id"` pada `<html>` dan `<meta charset="UTF-8">`, `<meta name="viewport">`
    - _Requirements: 10.1, 10.3_

- [ ] 2. Implement Storage Module
  - [-] 2.1 Tulis Storage module di `app.js`
    - Implementasi `Dashboard.Storage.save(key, data)` — JSON.stringify + localStorage.setItem, lempar `StorageError` saat QuotaExceededError/SecurityError
    - Implementasi `Dashboard.Storage.load(key)` — JSON.parse + localStorage.getItem, kembalikan `null` jika data hilang atau corrupt (try-catch)
    - Implementasi `Dashboard.Storage.remove(key)` — localStorage.removeItem
    - Definisikan class `StorageError extends Error`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.2, 9.7_

- [ ] 3. Implement GreetingWidget
  - [~] 3.1 Tulis markup HTML dan struktur DOM untuk GreetingWidget di `index.html`
    - Gunakan `<header>` sebagai wrapper GreetingWidget dengan `role="banner"`
    - Tambahkan `<h2 id="greeting-heading">` sebagai judul widget, dipakai oleh `aria-labelledby` pada `<section>`
    - Tambahkan elemen: `#greeting-text` (`<p>`), `#clock-display` (`<time>` dengan `datetime` diupdate tiap detik), `#date-display` (`<p>`)
    - Gunakan `aria-live="polite"` pada `#clock-display` agar screen reader mengumumkan perubahan waktu
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  - [~] 3.2 Implementasi `Dashboard.GreetingWidget` di `app.js`
    - Implementasi `_formatTime(date)` — kembalikan string `HH:MM:SS` dengan zero-padding
    - Implementasi `_formatDate(date)` — kembalikan string "Nama Hari, D Bulan YYYY" dalam Bahasa Indonesia menggunakan array hari dan bulan
    - Implementasi `_getGreeting(hour)` — peta jam ke salah satu dari empat string sapaan sesuai Time_of_Day
    - Implementasi `_tick()` — panggil `new Date()`, update elemen DOM `#greeting-text`, `#clock-display`, `#date-display`
    - Implementasi `init()` — panggil `_tick()` sekali langsung, lalu `setInterval(_tick, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 4. Implement FocusTimer
  - [~] 4.1 Tulis markup HTML dan struktur DOM untuk FocusTimer di `index.html`
    - Gunakan `<section aria-labelledby="timer-heading">` sebagai wrapper
    - Tambahkan `<h2 id="timer-heading">Focus Timer</h2>`
    - Gunakan `<output id="timer-display" aria-live="off" aria-atomic="true">` untuk tampilan MM:SS (diupdate via JS, `aria-live` diubah ke `"assertive"` hanya saat countdown selesai)
    - Tombol `#btn-start`, `#btn-stop`, `#btn-reset` menggunakan `<button type="button">` dengan `aria-label` deskriptif
    - Gunakan `role="status"` dan `aria-live="assertive"` pada `#timer-complete-msg`
    - _Requirements: 3.1, 3.7_
  - [~] 4.2 Implementasi `Dashboard.FocusTimer` di `app.js`
    - Definisikan state internal: `_remaining = 1500`, `_intervalId = null`, `_running = false`, `_startTime = null`, `_startRemaining = null`
    - Implementasi `_updateDisplay()` — format `_remaining` ke MM:SS (zero-padded), tulis ke `#timer-display`
    - Implementasi `_setButtonStates(running)` — enable/disable `#btn-start` dan `#btn-stop` sesuai state
    - Implementasi `_onComplete()` — stop interval, tampilkan `#timer-complete-msg`, set state Idle, panggil `_setButtonStates(false)`
    - Implementasi `_tick()` — hitung elapsed via `Date.now() - _startTime`, kurangi `_remaining = _startRemaining - elapsed_seconds`, clamp ke 0, panggil `_updateDisplay()`, cek complete
    - Implementasi `start()` — validasi tidak sedang running, simpan `_startTime = Date.now()` dan `_startRemaining = _remaining`, set `_running = true`, jalankan `setInterval(_tick, 1000)`, panggil `_setButtonStates(true)`
    - Implementasi `stop()` — clear interval, set `_running = false`, panggil `_setButtonStates(false)`
    - Implementasi `reset()` — panggil `stop()`, set `_remaining = 1500`, sembunyikan `#timer-complete-msg`, panggil `_updateDisplay()`
    - Implementasi `init()` — panggil `_updateDisplay()`, bind click events untuk ketiga tombol
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [ ] 5. Implement TodoList — Core dan Data Layer
  - [~] 5.1 Tulis markup HTML dan struktur DOM untuk TodoList di `index.html`
    - Gunakan `<section aria-labelledby="todo-heading">` sebagai wrapper
    - Tambahkan `<h2 id="todo-heading">Todo List</h2>`
    - Gunakan `<form id="task-form" aria-label="Tambah tugas baru">` untuk input area; `<label for="task-input">` terhubung ke `<input type="text" id="task-input">`
    - Gunakan `<button type="submit" id="btn-add-task">` di dalam form
    - Gunakan `<ul id="task-list" aria-label="Daftar tugas">` — setiap task adalah `<li>`
    - Tambahkan `<p id="task-input-error" role="alert" aria-live="assertive">` untuk error message
    - _Requirements: 4.1, 4.2_
  - [~] 5.2 Implementasi data layer dan validasi `Dashboard.TodoList` di `app.js`
    - Definisikan `_tasks = []`
    - Implementasi `_validateTaskText(text, maxLen)` — kembalikan `{ valid, error }` untuk empty/whitespace/over-length
    - Implementasi `_loadTasks()` — panggil `Storage.load('dashboard_tasks')`, populate `_tasks`, handle null (empty array), sort by `createdAt` ascending
    - Implementasi `_saveTasks()` — panggil `Storage.save('dashboard_tasks', { version: 1, tasks: _tasks })`
    - Implementasi UUID generation helper (gunakan `crypto.randomUUID()` dengan fallback `Math.random()`)
    - _Requirements: 4.2, 4.4, 4.5, 8.1, 8.2, 8.3_
  - [~] 5.3 Implementasi render dan operasi CRUD `Dashboard.TodoList` di `app.js`
    - Implementasi `_renderTask(task)` — buat `<li>` dengan checkbox, teks (strikethrough jika completed), tombol edit, tombol hapus; bind event handlers per elemen
    - Implementasi `_render()` — kosongkan `#task-list`, loop `_tasks`, append tiap `_renderTask(task)`
    - Implementasi `addTask(text)` — validasi maxLen=500, buat task baru `{ id, text, completed: false, createdAt: Date.now() }`, push ke `_tasks`, save, render, kosongkan input
    - Implementasi `toggleTask(id)` — temukan task by id, flip `completed`, save, render
    - Implementasi `deleteTask(id)` — tampilkan `window.confirm`, jika dikonfirmasi filter `_tasks`, save, render
    - Implementasi `init()` — panggil `_loadTasks()`, `_render()`, bind event listeners (tombol tambah, Enter pada input)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2_

- [ ] 6. Implement TodoList — Edit Inline dan Error Handling
  - [~] 6.1 Implementasi mode edit inline untuk `Dashboard.TodoList` di `app.js`
    - Implementasi `editTask(id, newText)` — validasi maxLen=255, update teks jika valid, save, render; jika invalid tampilkan error inline, jangan update
    - Modifikasi `_renderTask(task)` agar tombol edit dan double-click pada teks memicu mode edit: ganti elemen teks dengan `<input>` pre-filled, tampilkan tombol simpan/batal
    - Bind event `keydown` pada input edit: Enter → simpan (`editTask`), Escape → batal (restore teks lama, tutup mode edit)
    - Implementasi `_showError(element, message)` — tampilkan pesan error di dekat elemen yang relevan
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [~] 6.2 Implementasi penanganan StorageError di TodoList
    - Bungkus semua pemanggilan `_saveTasks()` dalam try-catch untuk `StorageError`
    - Jika gagal: jangan ubah `_tasks` dan jangan panggil `_render()`, tampilkan pesan "Gagal menyimpan data. Silakan coba lagi." menggunakan `_showGlobalError()`
    - Implementasi `_showGlobalError(message)` — tampilkan banner error di atas daftar tugas
    - _Requirements: 8.4, 7.5, 6.5_

- [~] 7. Checkpoint — Verifikasi TodoList dan GreetingWidget
  - Pastikan semua tes yang diimplementasi lulus, jalankan `vitest --run`
  - Verifikasi secara manual di browser: GreetingWidget update tiap detik, TodoList CRUD bekerja dengan persistensi
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan.

- [ ] 8. Implement QuickLinks
  - [~] 8.1 Tulis markup HTML dan struktur DOM untuk QuickLinks di `index.html`
    - Gunakan `<section aria-labelledby="links-heading">` sebagai wrapper
    - Tambahkan `<h2 id="links-heading">Quick Links</h2>`
    - Gunakan `<form id="link-form" aria-label="Tambah quick link baru">` — setiap field punya `<label for>` terhubung ke input-nya
    - `<input type="text" id="link-label-input">` dengan `<label for="link-label-input">Label</label>`
    - `<input type="url" id="link-url-input">` dengan `<label for="link-url-input">URL</label>`
    - `<button type="submit" id="btn-add-link">`
    - Gunakan `<ul id="link-list" aria-label="Daftar quick links">` — setiap link adalah `<li>` berisi `<a>` dan tombol hapus
    - Error elements: `<p id="link-label-error" role="alert">`, `<p id="link-url-error" role="alert">`, `<p id="link-limit-msg" aria-live="polite">`
    - _Requirements: 9.1, 9.2, 9.3_
  - [~] 8.2 Implementasi data layer dan validasi `Dashboard.QuickLinks` di `app.js`
    - Definisikan `_links = []`
    - Implementasi `_validateLink(label, url)` — cek label 1–100 karakter, parse URL dengan `new URL(url)`, cek `protocol === 'http:' || 'https:'`, kembalikan `{ valid, errors: { label?, url? } }`
    - Implementasi `_loadLinks()` — panggil `Storage.load('dashboard_links')`, populate `_links`, handle null, sort by `createdAt` ascending
    - Implementasi `_saveLinks()` — panggil `Storage.save('dashboard_links', { version: 1, links: _links })`
    - _Requirements: 9.2, 9.3, 9.7, 9.8_
  - [~] 8.3 Implementasi render dan operasi CRUD `Dashboard.QuickLinks` di `app.js`
    - Implementasi `_renderLink(link)` — buat elemen anchor `<a href=link.url target="_blank">` dengan label dan tombol hapus
    - Implementasi `_render()` — kosongkan `#link-list`, loop `_links`, append tiap `_renderLink(link)`
    - Implementasi `addLink(label, url)` — validasi, cek batas 50 item, buat `{ id, label, url, createdAt }`, push ke `_links`, save, render, kosongkan form
    - Implementasi `deleteLink(id)` — filter `_links`, save, render
    - Implementasi `_showFieldError(field, message)` — tampilkan error di bawah field yang gagal
    - Implementasi `init()` — panggil `_loadLinks()`, `_render()`, bind event listeners (submit form, tombol hapus)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  - [~] 8.4 Implementasi penanganan StorageError dan batas kapasitas QuickLinks
    - Nonaktifkan `#btn-add-link` dan tampilkan `#link-limit-msg` jika `_links.length >= 50`
    - Bungkus `_saveLinks()` dalam try-catch untuk `StorageError`, tampilkan error jika gagal, rollback state
    - _Requirements: 9.3, 9.9_

- [ ] 9. Implement Responsive Layout di `style.css`
  - [~] 9.1 Implementasi base styles dan layout grid/flexbox
    - Tulis CSS reset/normalize minimal
    - Implementasi layout grid 2-kolom untuk desktop (GreetingWidget + FocusTimer di atas, TodoList + QuickLinks di bawah)
    - Definisikan CSS custom properties (variables) untuk warna, spacing, typography
    - Pastikan tidak ada horizontal scrollbar pada lebar 320px–1920px
    - _Requirements: 10.7_
  - [~] 9.2 Implementasi responsive breakpoints
    - Breakpoint mobile: `max-width: 640px` → layout single-column, widget stack vertikal
    - Breakpoint tablet: `641px–1024px` → layout 2-kolom adaptif
    - Breakpoint desktop: `1025px–1920px` → layout 2-kolom penuh
    - Test visual di `320px`, `768px`, `1024px`, `1440px`, `1920px`
    - _Requirements: 10.7_
  - [~] 9.3 Implementasi styling widget dan komponen interaktif
    - Style untuk task completed: strikethrough teks, warna berbeda
    - Style untuk error messages (inline field errors dan global error banner)
    - Style untuk tombol state (disabled, active, hover)
    - Style untuk edit-inline input field
    - Style untuk `#timer-complete-msg` (visually distinct)
    - _Requirements: 6.2, 6.3, 5.2, 7.2_

- [ ] 10. Wiring — Integrasi semua modul di `app.js`
  - [~] 10.1 Implementasi DOMContentLoaded entry point dan inisialisasi semua widget
    - Tambahkan satu `DOMContentLoaded` listener di akhir `app.js`
    - Di dalam listener: panggil `Dashboard.GreetingWidget.init()`, `Dashboard.FocusTimer.init()`, `Dashboard.TodoList.init()`, `Dashboard.QuickLinks.init()`
    - Pastikan semua modul menggunakan namespace `Dashboard` yang konsisten
    - _Requirements: 1.3, 3.1, 4.5, 9.7, 10.1, 10.4_
  - [~] 10.2 Verifikasi performance — response time < 100ms per aksi
    - Tambahkan test menggunakan `performance.now()` untuk mengukur waktu antara event dan perubahan DOM pada operasi kritis: `addTask`, `toggleTask`, `deleteTask`, `addLink`, `deleteLink`
    - Assert: selisih < 100ms
    - _Requirements: 10.6_

- [~] 11. Final Checkpoint — Semua tes dan verifikasi akhir
  - Jalankan `vitest --run` dan pastikan semua test lulus (termasuk semua 16 property tests)
  - Verifikasi manual di browser: buka `index.html` via `file://`, test semua widget di viewport 320px dan 1920px
  - Verifikasi tidak ada dependensi eksternal di `index.html` (tidak ada CDN links)
  - Tanyakan kepada user jika ada pertanyaan sebelum dianggap selesai.

---

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceabilitas
- 16 correctness properties di design.md semuanya diimplementasikan sebagai property-based tests (fast-check)
- Unit tests melengkapi property tests dengan fokus pada state machine dan error paths
- Storage module diuji secara terpisah agar widget tests dapat menggunakan mock
- Semua pesan error ditulis dalam Bahasa Indonesia sesuai design
- UUID menggunakan `crypto.randomUUID()` dengan fallback ke `Math.random()`-based UUID

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1", "4.1", "5.1", "8.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "5.2", "8.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "4.3", "4.4", "5.3", "8.3"] },
    { "id": 5, "tasks": ["5.4", "5.5", "5.6", "6.1", "8.4"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "8.5", "8.6", "8.7", "8.8", "8.9", "8.10"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["10.2"] },
    { "id": 11, "tasks": ["10.3"] }
  ]
}
```

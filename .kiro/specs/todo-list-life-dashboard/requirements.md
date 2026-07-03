# Requirements Document

## Introduction

Todo List Life Dashboard adalah sebuah website dashboard produktivitas pribadi berbasis web yang menyediakan tampilan terpadu untuk manajemen tugas harian, timer fokus bergaya Pomodoro, sapaan kontekstual berdasarkan waktu, dan akses cepat ke tautan favorit. Aplikasi ini dibangun sepenuhnya dengan HTML, CSS, dan Vanilla JavaScript tanpa framework atau backend — semua data disimpan di sisi klien menggunakan Browser Local Storage API. Aplikasi dapat digunakan sebagai standalone web app maupun browser extension.

---

## Glossary

- **Dashboard**: Halaman utama yang menampilkan semua fitur secara terpadu dalam satu layar.
- **Greeting_Widget**: Komponen UI yang menampilkan tanggal, waktu saat ini, dan sapaan berdasarkan waktu hari.
- **Focus_Timer**: Komponen countdown timer 25 menit bergaya Pomodoro untuk sesi fokus bekerja.
- **Todo_List**: Komponen manajemen daftar tugas yang mendukung operasi tambah, edit, selesai, dan hapus.
- **Quick_Links**: Komponen yang menyimpan dan menampilkan daftar tautan favorit pengguna sebagai tombol pintasan.
- **Task**: Satu item pekerjaan dalam Todo_List yang memiliki teks deskripsi dan status selesai (completed/incomplete).
- **Link_Item**: Satu entri dalam Quick_Links yang terdiri dari label dan URL tujuan.
- **Local_Storage**: Browser Local Storage API yang digunakan untuk menyimpan data Task dan Link_Item secara persisten di sisi klien.
- **Session**: Satu siklus Focus_Timer dari 25:00 hingga 00:00.
- **Time_of_Day**: Kategori waktu berdasarkan jam lokal perangkat pengguna — Pagi (05:00:00–11:59:59), Siang (12:00:00–14:59:59), Sore (15:00:00–17:59:59), Malam (18:00:00–04:59:59).

---

## Requirements

### Requirement 1: Tampilan Waktu dan Tanggal Real-Time

**User Story:** Sebagai pengguna, saya ingin melihat waktu dan tanggal saat ini secara real-time, sehingga saya selalu mengetahui konteks waktu tanpa perlu meninggalkan halaman.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL menampilkan jam, menit, dan detik saat ini dalam format HH:MM:SS berdasarkan jam lokal perangkat pengguna, diperbarui setiap satu detik.
2. THE Greeting_Widget SHALL menampilkan nama hari, tanggal, bulan, dan tahun saat ini dalam format Bahasa Indonesia yang terbaca (contoh: "Kamis, 2 Juli 2026").
3. WHEN halaman pertama kali dimuat, THE Greeting_Widget SHALL langsung menampilkan waktu dan tanggal yang akurat tanpa memerlukan interaksi pengguna.
4. WHEN interval satu detik berlalu, THE Greeting_Widget SHALL memperbarui tampilan waktu tanpa me-reload halaman.

---

### Requirement 2: Sapaan Kontekstual Berdasarkan Waktu Hari

**User Story:** Sebagai pengguna, saya ingin mendapatkan sapaan yang sesuai dengan waktu hari ini, sehingga dashboard terasa lebih personal dan ramah.

#### Acceptance Criteria

1. WHEN jam lokal perangkat pengguna berada di antara 05:00:00 dan 11:59:59, THE Greeting_Widget SHALL menampilkan teks sapaan "Selamat Pagi".
2. WHEN jam lokal perangkat pengguna berada di antara 12:00:00 dan 14:59:59, THE Greeting_Widget SHALL menampilkan teks sapaan "Selamat Siang".
3. WHEN jam lokal perangkat pengguna berada di antara 15:00:00 dan 17:59:59, THE Greeting_Widget SHALL menampilkan teks sapaan "Selamat Sore".
4. WHEN jam lokal perangkat pengguna berada di antara 18:00:00 dan 04:59:59, THE Greeting_Widget SHALL menampilkan teks sapaan "Selamat Malam".
5. WHEN halaman pertama kali dimuat, THE Greeting_Widget SHALL menampilkan sapaan yang sesuai dengan Time_of_Day saat itu tanpa interaksi pengguna.
6. WHEN kategori Time_of_Day berubah (melintasi batas rentang waktu), THE Greeting_Widget SHALL memperbarui teks sapaan dalam waktu maksimal 60 detik tanpa interaksi pengguna.

---

### Requirement 3: Countdown Timer Fokus (Focus Timer)

**User Story:** Sebagai pengguna, saya ingin menggunakan timer 25 menit bergaya Pomodoro, sehingga saya dapat mengelola sesi kerja fokus dengan efektif.

#### Acceptance Criteria

1. THE Focus_Timer SHALL menampilkan nilai awal countdown sebesar 25:00 saat halaman pertama kali dimuat atau setelah Reset dilakukan.
2. WHEN pengguna menekan tombol Start, THE Focus_Timer SHALL memulai countdown yang berkurang satu detik setiap satu detik dengan toleransi presisi ±0.1 detik per tick.
3. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL menampilkan nilai sisa waktu yang diperbarui setiap detik dalam format MM:SS.
4. WHEN pengguna menekan tombol Stop, THE Focus_Timer SHALL menghentikan countdown dan mempertahankan nilai sisa waktu saat ini.
5. WHEN pengguna menekan tombol Reset, THE Focus_Timer SHALL menghentikan countdown dan mengembalikan nilai tampilan ke 25:00.
6. WHEN countdown mencapai 00:00, THE Focus_Timer SHALL menghentikan countdown secara otomatis.
7. WHEN countdown mencapai 00:00, THE Focus_Timer SHALL menampilkan pesan visual yang mengindikasikan bahwa sesi fokus telah selesai.
8. WHEN countdown mencapai 00:00, THE Focus_Timer SHALL mengembalikan tombol Start ke kondisi aktif dan menonaktifkan tombol Stop.
9. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL menonaktifkan tombol Start agar pengguna tidak dapat memulai timer yang sudah berjalan.
10. WHILE Focus_Timer dalam keadaan berhenti atau direset, THE Focus_Timer SHALL menonaktifkan tombol Stop.

---

### Requirement 4: Menambah Tugas

**User Story:** Sebagai pengguna, saya ingin menambahkan tugas baru ke daftar, sehingga saya dapat mencatat hal-hal yang perlu dikerjakan.

#### Acceptance Criteria

1. THE Todo_List SHALL menyediakan input field teks dan tombol tambah untuk memasukkan tugas baru.
2. WHEN pengguna memasukkan teks tugas yang tidak kosong (maksimal 500 karakter) dan menekan tombol tambah atau menekan tombol Enter, THE Todo_List SHALL menambahkan Task baru dengan status "belum selesai" ke dalam daftar dan menyimpannya ke Local_Storage.
3. WHEN Task baru berhasil ditambahkan, THE Todo_List SHALL mengosongkan input field secara otomatis.
4. IF pengguna menekan tombol tambah atau menekan Enter saat input field kosong atau hanya berisi spasi, THEN THE Todo_List SHALL tidak menambahkan Task dan SHALL menampilkan pesan kesalahan yang menginformasikan alasan penolakan.
5. THE Todo_List SHALL menampilkan semua Task yang tersimpan di Local_Storage saat halaman dimuat ulang, diurutkan sesuai mode urutan yang aktif.
6. THE Todo_List SHALL menyediakan kontrol pemilihan mode urutan (sort) dengan pilihan: terlama (`createdAt` ascending), terbaru (`createdAt` descending), status aktif dulu (incomplete sebelum completed), dan alfabet A–Z.
7. WHEN pengguna mengubah mode urutan, THE Todo_List SHALL langsung merender ulang daftar sesuai mode urutan baru tanpa mengubah data Task yang tersimpan.

---

### Requirement 5: Mengedit Tugas

**User Story:** Sebagai pengguna, saya ingin dapat mengedit teks tugas yang sudah ada, sehingga saya dapat memperbarui deskripsi tugas tanpa harus menghapus dan membuat ulang.

#### Acceptance Criteria

1. THE Todo_List SHALL menyediakan mekanisme edit melalui tombol edit dan double-click pada teks Task, termasuk untuk Task yang berstatus completed.
2. WHEN pengguna memulai edit sebuah Task, THE Todo_List SHALL menampilkan input field yang telah terisi teks Task tersebut.
3. WHEN pengguna mengonfirmasi perubahan dengan menekan Enter atau tombol simpan, THE Todo_List SHALL memperbarui teks Task dengan nilai baru yang tidak kosong dan tidak melebihi 255 karakter, lalu menyimpan perubahan ke Local_Storage.
4. IF pengguna mengonfirmasi edit dengan teks yang kosong atau hanya berisi spasi, THEN THE Todo_List SHALL membatalkan perubahan dan mempertahankan teks Task yang lama.
5. WHEN pengguna membatalkan edit (menekan Escape atau tombol batal), THE Todo_List SHALL menutup mode edit dan mempertahankan teks Task yang lama tanpa menyimpan perubahan apapun.
6. IF pengguna mencoba mengonfirmasi edit dengan teks yang melebihi 255 karakter, THEN THE Todo_List SHALL tidak menyimpan perubahan dan SHALL menampilkan pesan kesalahan yang menginformasikan batas maksimum karakter.

---

### Requirement 6: Menandai Tugas sebagai Selesai

**User Story:** Sebagai pengguna, saya ingin menandai tugas yang telah dikerjakan sebagai selesai, sehingga saya dapat melacak progres pekerjaan saya.

#### Acceptance Criteria

1. THE Todo_List SHALL menyediakan checkbox atau tombol toggle untuk setiap Task.
2. WHEN pengguna menandai sebuah Task sebagai selesai, THE Todo_List SHALL mengubah status Task menjadi completed, menampilkan teks Task dengan strikethrough dan warna yang berbeda dari Task aktif, serta menyimpan status tersebut ke Local_Storage.
3. WHEN pengguna menandai sebuah Task yang sudah selesai, THE Todo_List SHALL mengubah status Task kembali menjadi incomplete, menghapus tampilan strikethrough dan warna khusus, serta menyimpan status tersebut ke Local_Storage.
4. WHEN halaman dimuat ulang, THE Todo_List SHALL memulihkan status completed atau incomplete setiap Task sesuai data yang tersimpan di Local_Storage.
5. IF penulisan status ke Local_Storage gagal, THEN THE Todo_List SHALL mempertahankan tampilan status yang baru ditampilkan dan menampilkan pesan kesalahan kepada pengguna.

---

### Requirement 7: Menghapus Tugas

**User Story:** Sebagai pengguna, saya ingin menghapus tugas yang sudah tidak relevan, sehingga daftar tugas tetap bersih dan terfokus.

#### Acceptance Criteria

1. THE Todo_List SHALL menyediakan tombol hapus untuk setiap Task dalam daftar.
2. WHEN pengguna menekan tombol hapus sebuah Task, THE Todo_List SHALL menampilkan konfirmasi penghapusan sebelum melanjutkan aksi permanen.
3. WHEN pengguna mengonfirmasi penghapusan, THE Todo_List SHALL menghapus Task tersebut dari Local_Storage secara permanen.
4. WHEN pengguna mengonfirmasi penghapusan, THE Todo_List SHALL memperbarui tampilan daftar dalam waktu maksimal 500ms tanpa memerlukan reload halaman.
5. IF penulisan perubahan ke Local_Storage gagal saat penghapusan, THEN THE Todo_List SHALL mempertahankan Task dalam tampilan dan menampilkan pesan kesalahan kepada pengguna.

---

### Requirement 8: Persistensi Data Tugas

**User Story:** Sebagai pengguna, saya ingin data tugas saya tersimpan secara otomatis, sehingga daftar tugas tetap ada meskipun browser ditutup dan dibuka kembali.

#### Acceptance Criteria

1. WHEN pengguna menambah, mengedit, menandai selesai, atau menghapus sebuah Task, THE Todo_List SHALL menyimpan keseluruhan daftar Task terbaru ke Local_Storage sebelum perubahan ditampilkan pada UI.
2. WHEN halaman Dashboard dimuat, THE Todo_List SHALL membaca data Task dari Local_Storage dan merender seluruh daftar Task beserta status selesai atau belum selesai masing-masing.
3. IF Local_Storage tidak mengandung data Task atau data Task tidak dapat dibaca (korup/tidak valid), THEN THE Todo_List SHALL menampilkan daftar kosong tanpa pesan error dan tanpa menghentikan eksekusi aplikasi.
4. IF penulisan ke Local_Storage gagal saat operasi mutasi Task, THEN THE Todo_List SHALL membatalkan perubahan tampilan dan menampilkan pesan kesalahan kepada pengguna.

---

### Requirement 9: Menambah dan Mengelola Quick Links

**User Story:** Sebagai pengguna, saya ingin menyimpan tautan ke website favorit saya dan mengaksesnya dengan satu klik, sehingga saya dapat berpindah ke sumber daya yang sering digunakan dengan cepat.

#### Acceptance Criteria

1. THE Quick_Links SHALL menyediakan form untuk menambahkan Link_Item baru yang terdiri dari input label (maksimal 100 karakter) dan input URL (maksimal 2048 karakter).
2. WHEN pengguna mengisi label yang tidak kosong dan URL absolut yang valid dengan skema http atau https, dan total Link_Item belum mencapai 50 item, THE Quick_Links SHALL menambahkan Link_Item baru ke tampilan dan menyimpannya ke Local_Storage.
3. IF pengguna mengonfirmasi form dengan label yang kosong atau URL yang tidak merupakan URL absolut dengan skema http/https, THEN THE Quick_Links SHALL tidak menambahkan Link_Item dan SHALL menampilkan pesan kesalahan di bawah field yang gagal validasi yang menjelaskan field mana yang salah dan alasannya.
4. THE Quick_Links SHALL menampilkan setiap Link_Item sebagai tombol atau tautan yang ketika diklik akan membuka URL tujuan di tab baru.
5. THE Quick_Links SHALL menyediakan tombol hapus untuk setiap Link_Item.
6. WHEN pengguna menekan tombol hapus sebuah Link_Item, THE Quick_Links SHALL menghapus Link_Item tersebut dari tampilan dan dari Local_Storage.
7. WHEN halaman Dashboard dimuat, THE Quick_Links SHALL membaca data Link_Item dari Local_Storage dan merender seluruh daftar tautan yang tersimpan.
8. IF Local_Storage tidak mengandung data Link_Item, THEN THE Quick_Links SHALL menampilkan area Quick Links kosong tanpa pesan error.
9. IF penulisan ke Local_Storage gagal saat menambah atau menghapus Link_Item, THEN THE Quick_Links SHALL tidak mengubah tampilan yang sudah ada dan SHALL menampilkan pesan kesalahan kepada pengguna.

---

### Requirement 10: Arsitektur dan Batasan Teknis

**User Story:** Sebagai developer, saya ingin memastikan aplikasi dibangun dengan stack yang sederhana dan terstruktur, sehingga mudah dipelihara dan tidak memerlukan setup yang kompleks.

#### Acceptance Criteria

1. THE Dashboard SHALL diimplementasikan menggunakan HTML, CSS, dan Vanilla JavaScript tanpa framework JavaScript eksternal apapun.
2. THE Dashboard SHALL menyimpan seluruh data pengguna secara eksklusif menggunakan Browser Local Storage API tanpa komunikasi ke server eksternal.
3. THE Dashboard SHALL dapat dijalankan dengan membuka satu file HTML di browser modern yang dirilis pada tahun 2020 atau setelahnya (Chrome, Firefox, Edge, Safari) tanpa proses build atau server lokal.
4. THE Dashboard SHALL memuat dan merender semua widget dalam waktu kurang dari 2 detik pada koneksi jaringan lokal (file://).
5. THE Dashboard SHALL menggunakan tepat satu file CSS dan tepat satu file JavaScript sebagai satu-satunya file styling dan logika aplikasi.
6. WHILE pengguna berinteraksi dengan widget manapun, THE Dashboard SHALL merespons setiap aksi pengguna dalam waktu kurang dari 100 milidetik yang terukur dari event hingga perubahan DOM.
7. THE Dashboard SHALL menampilkan layout yang dapat digunakan secara fungsional pada viewport dengan lebar minimum 320px hingga 1920px tanpa horizontal scrollbar yang tidak disengaja.

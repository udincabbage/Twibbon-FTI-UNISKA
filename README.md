# Twibbon Generator FTI UNISKA

Aplikasi web static berbasis HTML5, CSS3, dan Vanilla JavaScript untuk membuat twibbon langsung di browser. Proyek ini siap di-host di GitHub Pages tanpa backend.

## Struktur proyek

- `index.html`
- `css/style.css`
- `js/api.js`
- `js/app.js`
- `js/editor.js`
- `js/templates.js`
- `api/templates.json`
- `assets/logo-placeholder.svg`

## Upload ke GitHub

### Opsi 1: Upload lewat website GitHub

1. Login ke GitHub.
2. Klik **New repository**.
3. Isi nama repository, misalnya `twibbon-generator-fti-uniska`.
4. Pilih **Public**.
5. Klik **Create repository**.
6. Di halaman repository, klik **uploading an existing file**.
7. Drag semua isi folder proyek ini ke halaman upload GitHub.
8. Tulis commit message, misalnya `Initial twibbon generator website`.
9. Klik **Commit changes**.

### Opsi 2: Upload lewat Git command line

```bash
git init
git branch -M main
git add .
git commit -m "Initial twibbon generator website"
git remote add origin https://github.com/USERNAME/twibbon-generator-fti-uniska.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub Anda.

## Deploy ke GitHub Pages

1. Buka repository di GitHub.
2. Masuk ke **Settings**.
3. Klik menu **Pages**.
4. Pada bagian **Build and deployment**, pilih:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Klik **Save**.
6. Tunggu proses deploy 1 sampai 3 menit.

## URL hasil publish

Setelah aktif, website akan tersedia di URL berikut:

```text
https://USERNAME.github.io/twibbon-generator-fti-uniska/
```

Jika nama repository berbeda, maka format URL menjadi:

```text
https://USERNAME.github.io/NAMA-REPOSITORY/
```

## Agar langsung online tanpa error path

Karena proyek ini menggunakan path relatif seperti `./css/style.css` dan `./api/templates.json`, maka aman untuk GitHub Pages selama struktur folder tidak diubah.

## Catatan penting GitHub Pages

- Repository harus **Public** jika memakai GitHub Pages pada paket gratis standar.
- File `index.html` harus tetap berada di root proyek.
- Jangan memindahkan folder `api`, `css`, `js`, atau `assets` dari struktur aslinya.
- Setelah deploy pertama, kadang perlu refresh 1 sampai 2 kali sampai file JSON ikut aktif dari CDN GitHub Pages.

## Update website setelah publish

Setiap kali Anda mengubah file lalu push ulang ke branch `main`, GitHub Pages akan otomatis mem-publish versi terbaru.

## Custom domain opsional

Jika nanti ingin domain sendiri seperti `twibbon.ftiuniska.ac.id`, buka **Settings > Pages > Custom domain**, lalu isi domain Anda dan arahkan DNS domain ke GitHub Pages.

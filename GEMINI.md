# Instruksi untuk AI (Gemini)

Sebelum melakukan apa pun di repository ini, baca **seluruh** `docs/PLAN-2026-10.md`, terutama **Bagian A (Aturan Wajib)**. Aturan di sana mengikat untuk setiap perubahan kode.

Ringkasnya:
- Kerjakan **satu tugas** dari Bagian B per giliran, lalu laporkan dengan format A7 dan berhenti.
- Baca kode sekitar dan tiru polanya; TDD untuk logika; diff kecil dan fokus.
- Jalankan verifikasi (`php artisan test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`) dan tempel hasilnya.
- Berhenti dan tanya jika ambigu, butuh dependensi baru, butuh hapus file/data, atau mengubah migrasi lama.
- Next.js di project ini versi 16 dengan breaking changes: baca `dojang-hub-web/node_modules/next/dist/docs/` sebelum memakai API Next.
- Stack tetap Laravel + Next.js. Jangan usulkan ganti stack.
- Balas dalam Bahasa Indonesia.

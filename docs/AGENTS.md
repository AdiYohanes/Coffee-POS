# Agent Instructions for Coffee POS

## Operating Rules

1. Phase-Locked: Hanya kerjakan fase yang diminta. Jangan generate kode fase lain.
2. Contract-First: Validasi shape request/response sebelum integrasi UI.
3. Test Mandate: Setiap endpoint/server action harus disertai contoh `fetch` atau `curl`.
4. No Assumptions: Jika env/dependensi/konfigurasi kurang, tanya. Jangan tebak.
5. Output Format: Hanya kembalikan file yang diminta + instruksi run. Tanpa basa-basi.

## Validation Checklist per Fase

- [ ] Zero TypeScript errors (`tsc --noEmit`)
- [ ] Response selalu `{ success: boolean, data?: any, error?: string }`
- [ ] Loading, error, empty state sudah ditangani di UI
- [ ] Git commit per fase dengan pesan konvensional

## Model Routing (User will specify)

- @Pro: Arsitektur, DB schema, kontrak API, debug error, review kode
- @Flash: Generate komponen, server actions, store, styling, fix lint/TS, test script

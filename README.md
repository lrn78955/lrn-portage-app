# LRN PORTAGE APP V5.8 RESET CLEAN

Version repartie de zéro pour éviter les bugs empilés.

## Fichiers principaux

- `src/App.jsx`
- `supabase-documents.sql`
- `supabase-cra.sql`
- `supabase-invoices.sql`

## Installation

```bash
npm install
npm run dev
```

## Supabase

Relancer dans SQL Editor, dans cet ordre :

1. `supabase-documents.sql`
2. `supabase-cra.sql`
3. `supabase-invoices.sql`

## Modules

- Auth Supabase
- Profils
- Documents
- CRA avec validation/refus
- Suppression CRA admin/consultant
- Factures depuis CRA validé

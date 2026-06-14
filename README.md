# LRN PORTAGE APP

Application connectée pour LRN PORTAGE.

## Installation

```bash
npm install
npm run dev
```

## Supabase

1. Va dans Supabase > SQL Editor
2. Exécute le fichier `supabase-schema.sql`
3. Va dans Project Settings > API
4. Copie :
   - Project URL
   - anon public key

## Vercel

Ajoute ces variables dans Settings > Environment Variables :

```bash
VITE_SUPABASE_URL=ton_project_url
VITE_SUPABASE_ANON_KEY=ta_anon_public_key
```

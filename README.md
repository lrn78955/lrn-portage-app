# LRN PORTAGE APP V2

Application connectée LRN PORTAGE.

## Nouveautés V2

- dashboard admin amélioré
- gestion des profils
- filtres consultants / clients / admin
- changement de rôle depuis l'interface admin
- compteurs dynamiques

## Important Supabase

Après avoir déployé cette V2, exécuter dans Supabase > SQL Editor :

`supabase-admin-policies.sql`

Cela permet à l'administrateur de voir et gérer les profils.

## Vercel

Variables nécessaires :

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

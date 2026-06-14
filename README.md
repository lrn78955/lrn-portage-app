# LRN PORTAGE APP V3 - Documents

## Nouveautés

- Module documents fonctionnel
- Dépôt de fichiers dans Supabase Storage
- Choix du propriétaire côté admin
- Liste des documents
- Ouverture via URL signée
- Admin voit tous les documents
- Consultant/client voit ses documents

## À faire après upload GitHub

1. Remplacer `src/App.jsx`
2. Ajouter `supabase-documents.sql` à la racine
3. Commit changes
4. Vercel redéploie
5. Dans Supabase > SQL Editor, exécuter `supabase-documents.sql`


## V3.1

- Le consultant/client ne voit plus le formulaire de dépôt de document.
- L'admin garde le dépôt de documents.
- Corrections d'affichage mobile.


## V3.2
- Suppression des documents côté admin.
- Bouton Supprimer dans l'onglet Documents admin.
- Les consultants/clients restent en lecture seule dans Mes documents.
- Si la suppression est bloquée, relance le script `supabase-documents.sql` pour ajouter la policy DELETE sur `documents`.

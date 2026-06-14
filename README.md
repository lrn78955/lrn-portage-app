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


## V4 - Module CRA

- Consultant : soumission d'un CRA mensuel avec jours travaillés et commentaire facultatif.
- Client : validation ou refus avec commentaire facultatif.
- Le client choisit la visibilité du commentaire : admin uniquement ou admin + consultant.
- Admin : vue complète, création optionnelle, validation/refus et suivi des statuts.

À exécuter dans Supabase > SQL Editor : `supabase-cra.sql`.

## V5 - Factures depuis CRA

- Onglet admin Factures
- Génération uniquement depuis CRA validé
- Formulaire de facture prérempli depuis CRA
- Aperçu facture
- Export via impression PDF navigateur
- Enregistrement en table `invoices`

À exécuter dans Supabase > SQL Editor :
- `supabase-cra.sql`
- `supabase-invoices.sql`

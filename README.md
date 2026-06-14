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

## V5.1 - Correction CRA client

- Côté admin, dans la liste CRA, possibilité de rattacher/modifier le client d’un CRA existant.
- Utile si un CRA a été créé avec `Aucun client`.
- Dès qu’un client est rattaché, il pourra voir le CRA dans son espace et le valider/refuser.

## V5.2 - Heures supplémentaires dans le CRA

- Déclaration des heures supplémentaires directement dans le CRA.
- Taux HT des heures supplémentaires.
- Déclaration des samedis travaillés directement dans le CRA.
- Taux HT du samedi travaillé.
- Le client valide/refuse ces données dans le CRA.
- La facture reprend automatiquement ces montants validés depuis le CRA.

À exécuter dans Supabase > SQL Editor :
`supabase-cra.sql`

## V5.3 - Suppression CRA

- Admin : peut supprimer tous les CRA.
- Consultant : peut supprimer ses propres CRA.
- Client : ne peut pas supprimer les CRA.
- Confirmation avant suppression.
- Relancer `supabase-cra.sql` dans Supabase pour mettre à jour la policy DELETE.

## V5.4 - Fix onglet Factures

- L’onglet Factures affiche toujours un contenu.
- Message clair si aucun CRA validé n’est disponible.
- Sélection automatique du premier CRA validé.
- Correction d’affichage si le CRA validé existe mais que le formulaire ne chargeait pas.

## V5.5 - Final fix CRA + Factures

- Correction définitive bouton Supprimer CRA côté admin.
- Correction bouton Supprimer CRA côté consultant.
- Correction affichage onglet Factures côté admin.
- Conservation des scripts Supabase CRA et invoices.

À remplacer dans GitHub :
- src/App.jsx
- supabase-cra.sql
- supabase-invoices.sql

À relancer dans Supabase :
- supabase-cra.sql
- supabase-invoices.sql

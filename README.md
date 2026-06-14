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


## V5.8.2
- Facture : bon de commande obligatoire.
- Facture : la référence client correspond au nom du client.
- Aperçu facture : libellé "Bon de commande".


## V5.8.3
- Factures : suppression possible depuis l’onglet Factures.
- Factures : l’enregistrement crée automatiquement un document de type Facture.
- Le document facture est rattaché au client du CRA si présent, sinon au consultant.


## V5.8.4
- CRA : les consultants ne voient plus les taux ni les prix.
- CRA : les consultants déclarent uniquement jours, heures supplémentaires et samedis.
- CRA : l’admin peut modifier les taux et informations de facturation via “Tarifs admin”.


## V5.8.5
- CRA consultant : saisie limitée au nombre d’heures supplémentaires uniquement.
- CRA admin : gestion des jours et du taux d’heures supplémentaires.
- Retrait de la logique samedi côté interface et facture.


## V5.8.6
- CRA consultant : saisie limitée aux jours travaillés et aux heures supplémentaires du mois.
- Facture : le document est enregistré directement dans les documents du client du CRA.
- Facture : nom de document par défaut “Facture mois année nom prénom consultant”, modifiable avant enregistrement.


## V5.8.7
- Admin : ajout du module “Affiliations consultants / clients” dans Gestion des profils.
- Consultant : le champ Client du CRA n’est plus facultatif.
- Consultant : la liste des clients affichée dans le CRA est limitée aux clients affiliés par l’admin.
- SQL : ajouter et lancer `supabase-affiliations.sql` après les scripts existants.


## V5.8.8
- Facture : logo/titre corrigé en LRN PORTAGE.
- Facture : affichage du consultant concerné.
- Facture : prix journalier HT et prix heure supp HT séparés.
- Bons de commande : préenregistrement admin avec client, référence, conditions, TJM, taux heure supp et TVA.
- Génération facture : sélection du bon de commande pour préremplir les champs.
- Nouveau script SQL : supabase-purchase-orders.sql.


## V5.8.10
- Bons de commande : non visibles par les consultants.
- Documents : blocage sécurité des bons de commande pour les consultants, même si une ancienne ligne était partagée.
- Factures : préenregistrement BDC déplacé sous “Générer une facture”, replié par défaut.
- Factures : ouverture du document facture en HTML rendu, avec encodage UTF-8 correct.

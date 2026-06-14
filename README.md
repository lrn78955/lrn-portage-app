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

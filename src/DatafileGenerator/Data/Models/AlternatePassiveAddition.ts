// DatafileGenerator/Data/Models/AlternatePassiveAddition.ts
// Porté depuis le fichier C# du même nom
// Utilise les types natifs de TypeScript + des interfaces pour la désérialisation JSON

/**
 * Représente un ajout alternatif à un nœud passif (stats supplémentaires).
 * Correspond exactement à la structure du JSON `alternate_passive_additions.json`.
 */
export interface AlternatePassiveAddition {
  /** Index unique de cet ajout (correspond à `_rid` dans le JSON) */
  readonly Index: number;

  /** Version de l'arbre alternatif auquel cet ajout appartient */
  readonly AlternateTreeVersionIndex: number;

  /** Liste des indices de stats (référencés dans une table globale de stats) */
  readonly StatIndices: readonly number[];

  /** Valeur minimale de la première stat */
  readonly StatAMinimumValue: number;

  /** Valeur maximale de la première stat */
  readonly StatAMaximumValue: number;

  /** Valeur minimale de la deuxième stat (Unknown7 dans le dump) */
  readonly StatBMinimumValue: number;

  /** Valeur maximale de la deuxième stat (Unknown8 dans le dump) */
  readonly StatBMaximumValue: number;

  /** Types de passifs auxquels cet ajout peut s'appliquer */
  readonly ApplicablePassiveTypes: readonly number[];

  /** Poids de spawn (utilisé pour la pondération lors du tirage aléatoire) */
  readonly SpawnWeight: number;
}

/* -------------------------------------------------------------------------- */
/*  Utilisation typique avec `fs` + `JSON.parse` (exemple Node.js)            */
/* -------------------------------------------------------------------------- */

// import { readFileSync } from 'node:fs';
// import { resolve } from 'node:path';
//
// const raw = readFileSync(
//   resolve(__dirname, '../../data/alternate_passive_additions.json'),
//   'utf-8'
// );
// const additions: AlternatePassiveAddition[] = JSON.parse(raw);

/* -------------------------------------------------------------------------- */
/*  Note sur le mapping des noms                                            */
/* -------------------------------------------------------------------------- */
// - `_rid`                     → `Index`
// - `AlternateTreeVersionsKey` → `AlternateTreeVersionIndex`
// - `StatsKeys`                → `StatIndices`
// - `Stat1Min` / `Stat1Max`    → `StatAMinimumValue` / `StatAMaximumValue`
// - `Unknown7` / `Unknown8`    → `StatBMinimumValue` / `StatBMaximumValue`
// - `PassiveType`              → `ApplicablePassiveTypes`
// - `SpawnWeight`              → `SpawnWeight`

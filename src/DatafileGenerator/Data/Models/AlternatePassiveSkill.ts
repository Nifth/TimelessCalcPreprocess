// DatafileGenerator/Data/Models/AlternatePassiveSkill.ts
// Porté depuis le fichier C# du même nom
// Correspond à la structure du JSON `alternate_passive_skills.json`

/**
 * Représente un remplacement complet d’un nœud passif (nouvelle compétence notable).
 * Peut inclure plusieurs stats avec des valeurs min/max, ainsi qu’un nombre aléatoire d’ajouts.
 */
export interface AlternatePassiveSkill {
  readonly Name: string;
  /** Index unique de cette compétence (correspond à `_rid` dans le JSON) */
  readonly _rid: number;

  /** Version de l’arbre alternatif auquel cette compétence appartient */
  readonly AlternateTreeVersionsKey: number;

  /** Liste des indices de stats associées à cette compétence */
  readonly StatsKeys: readonly number[];

  /** Valeur minimale de la première stat */
  readonly Stat1Min: number;

  /** Valeur maximale de la première stat */
  readonly Stat1Max: number;

  /** Valeur minimale de la deuxième stat */
  readonly Stat2Min: number;

  /** Valeur maximale de la deuxième stat */
  readonly Stat2Max: number;

  /** Valeur minimale de la troisième stat (Unknown10) */
  readonly Unknown10: number;

  /** Valeur maximale de la troisième stat (Unknown11) */
  readonly Unknown11: number;

  /** Valeur minimale de la quatrième stat (Unknown12) */
  readonly Unknown12: number;

  /** Valeur maximale de la quatrième stat (Unknown13) */
  readonly Unknown13: number;

  /** Types de passifs auxquels cette compétence peut s’appliquer */
  readonly PassiveType: readonly number[];

  /** Poids de spawn (pondération pour le tirage aléatoire) */
  readonly SpawnWeight: number;

  /** Nombre minimum d’ajouts aléatoires (additions) à appliquer */
  readonly RandomMin: number;

  /** Nombre maximum d’ajouts aléatoires à appliquer */
  readonly RandomMax: number;
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’utilisation avec Node.js (fs + JSON.parse)                      */
/* -------------------------------------------------------------------------- */

// import { readFileSync } from 'node:fs';
// import { resolve } from 'node:path';
//
// const raw = readFileSync(
//   resolve(__dirname, '../../data/alternate_passive_skills.json'),
//   'utf-8'
// );
// const skills: AlternatePassiveSkill[] = JSON.parse(raw);

/* -------------------------------------------------------------------------- */
/*  Correspondance des noms JSON → TS                                         */
/* -------------------------------------------------------------------------- */
// _rid                     → Index
// AlternateTreeVersionsKey → AlternateTreeVersionIndex
// StatsKeys                → StatIndices
// Stat1Min / Stat1Max      → StatAMinimumValue / StatAMaximumValue
// Stat2Min / Stat2Max      → StatBMinimumValue / StatBMaximumValue
// Unknown10 / Unknown11    → StatCMinimumValue / StatCMaximumValue
// Unknown12 / Unknown13    → StatDMinimumValue / StatDMaximumValue
// PassiveType              → ApplicablePassiveTypes
// SpawnWeight              → SpawnWeight
// RandomMin / RandomMax    → MinimumAdditions / MaximumAdditions

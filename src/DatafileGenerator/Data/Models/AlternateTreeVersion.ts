// DatafileGenerator/Data/Models/AlternateTreeVersion.ts
// Porté depuis le fichier C# du même nom
// Représente une version d’arbre alternatif (utilisée par les Timeless Jewels)

/**
 * Version d’arbre alternatif.
 * Chaque version détermine :
 *   - si les petits nœuds d’attributs / normaux sont remplacés
 *   - le nombre d’ajouts aléatoires (min/max)
 *   - le poids de spawn pour les remplacements notables
 */
export class AlternateTreeVersion {
  /** Index unique de la version (1 à 5 dans les données actuelles) */
  public readonly Index: number;

  constructor(index: number) {
    this.Index = index;
  }

  /** Les petits nœuds d’attributs sont-ils remplacés ? */
  public get AreSmallAttributePassiveSkillsReplaced(): boolean {
    return this.Index === 1 || this.Index === 4 || this.Index === 5;
  }

  /** Les petits nœuds normaux sont-ils remplacés ? */
  public get AreSmallNormalPassiveSkillsReplaced(): boolean {
    return this.Index === 1 || this.Index === 5;
  }

  /** Nombre minimum d’ajouts aléatoires */
  public get MinimumAdditions(): number {
    return this.Index >= 2 && this.Index <= 4 ? 1 : 0;
  }

  /** Nombre maximum d’ajouts aléatoires */
  public get MaximumAdditions(): number {
    return this.MinimumAdditions; // identique dans toutes les versions
  }

  /** Poids de spawn pour les remplacements de notables */
  public get NotableReplacementSpawnWeight(): number {
    switch (this.Index) {
      case 1: return 100;
      case 4: return 20;
      case 5: return 100;
      default: return 0;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’utilisation                                                    */
/* -------------------------------------------------------------------------- */

// const version = new AlternateTreeVersion(1);
// console.log(version.AreSmallAttributePassiveSkillsReplaced); // true
// console.log(version.NotableReplacementSpawnWeight);         // 100

/* -------------------------------------------------------------------------- */
/*  Correspondance C# → TS                                                   */
/* -------------------------------------------------------------------------- */
// - `uint` → `number`
// - `init` → `readonly`
// - `=> Index switch { ... }` → getter + `switch` ou logique conditionnelle
// - Constructeur explicite conservé

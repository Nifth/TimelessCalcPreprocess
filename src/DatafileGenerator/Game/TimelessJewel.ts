// DatafileGenerator/Game/TimelessJewel.ts
// Port direct du fichier C# TimelessJewel.cs
// Représente un bijou Timeless avec sa version d’arbre alternatif et sa seed (modifiée si version 5)

import { AlternateTreeVersion } from '../Data/Models/AlternateTreeVersion';

/**
 * Représente un Timeless Jewel.
 * La seed est modifiée (divisée par 20) si la version d’arbre est la 5 (Elegant Hubris).
 */
export class TimelessJewel {
  /** Version d’arbre alternatif appliquée par ce bijou */
  public readonly AlternateTreeVersion: AlternateTreeVersion;

  /** Seed du bijou (peut être modifiée selon la version) */
  public readonly Seed: number;

  /**
   * Constructeur.
   * @param alternateTreeVersion Version d’arbre alternatif (1 à 5)
   * @param seed Seed brute du bijou
   */
  constructor(alternateTreeVersion: AlternateTreeVersion, seed: number) {
    if (!alternateTreeVersion) {
      throw new Error('alternateTreeVersion is required');
    }

    this.AlternateTreeVersion = alternateTreeVersion;

    // Elegant Hubris (version 5) : seed /= 20
    this.Seed = alternateTreeVersion.Index === 5 ? Math.floor(seed / 20) : seed;
  }
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’utilisation                                                    */
/* -------------------------------------------------------------------------- */

// import { AlternateTreeVersion } from '../Data/Models/AlternateTreeVersion';
// import { TimelessJewel } from './TimelessJewel';
//
// const version = new AlternateTreeVersion(5);
// const jewel = new TimelessJewel(version, 123456);
// console.log(jewel.Seed); // → 6172 (123456 / 20 = 6172.8 → floor)

/* -------------------------------------------------------------------------- */
/*  Correspondance C# → TS                                                   */
/* -------------------------------------------------------------------------- */
// uint                    → number
// ArgumentNullException   → throw new Error()
// private set             → readonly
// seed /= 20              → Math.floor(seed / 20)

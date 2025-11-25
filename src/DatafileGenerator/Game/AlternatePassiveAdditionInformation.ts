// DatafileGenerator/Game/AlternatePassiveAdditionInformation.ts
// Port direct du fichier C# AlternatePassiveAdditionInformation.cs
// Représente un ajout aléatoire appliqué à un nœud (avec ses stats roulées)

import { AlternatePassiveAddition } from '../Data/Models/AlternatePassiveAddition';

/**
 * Informations sur un ajout alternatif appliqué à un nœud.
 * Contient :
 *   - L'ajout de base (AlternatePassiveAddition)
 *   - Les valeurs roulées pour ses stats (0 ou 1)
 */
export class AlternatePassiveAdditionInformation {
  /** Ajout alternatif (ex: +X% Fire Damage) */
  public readonly AlternatePassiveAddition: AlternatePassiveAddition;

  /** Map des indices de stat → valeur roulée (ex: 0 → 15) */
  public readonly StatRolls: Readonly<Record<number, number>>;

  constructor(
    alternatePassiveAddition: AlternatePassiveAddition,
    statRolls: Record<number, number>
  ) {
    if (!alternatePassiveAddition) {
      throw new Error('alternatePassiveAddition is required');
    }

    this.AlternatePassiveAddition = alternatePassiveAddition;
    this.StatRolls = Object.freeze({ ...statRolls });
  }
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’utilisation                                                    */
/* -------------------------------------------------------------------------- */

// import { AlternateTreeManager } from './AlternateTreeManager';
// import { TimelessJewel } from './TimelessJewel';
// import { PassiveSkillNode } from '../Data/Models/PassiveSkill';
//
// const manager = new AlternateTreeManager(node, jewel);
// const additions = manager.AugmentPassiveSkill();
//
// additions.forEach(add => {
//   console.log(`+ ${add.AlternatePassiveAddition.StatIndices[0]}: ${add.StatRolls[0]}`);
// });

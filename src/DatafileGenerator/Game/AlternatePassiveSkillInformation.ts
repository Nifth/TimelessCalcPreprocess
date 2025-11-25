// DatafileGenerator/Game/AlternatePassiveSkillInformation.ts
// Port direct du fichier C# AlternatePassiveSkillInformation.cs
// Représente le résultat complet du remplacement d’un nœud par un Timeless Jewel

import { AlternatePassiveSkill } from '../Data/Models/AlternatePassiveSkill';
import { AlternatePassiveAdditionInformation } from './AlternatePassiveAdditionInformation';

/**
 * Informations sur un remplacement de compétence passive.
 * Contient :
 *   - La nouvelle compétence (AlternatePassiveSkill)
 *   - Les valeurs roulées pour ses stats principales
 *   - Les ajouts aléatoires (AlternatePassiveAdditionInformation[])
 */
export class AlternatePassiveSkillInformation {
  /** Compétence passive alternative appliquée */
  public readonly AlternatePassiveSkill: AlternatePassiveSkill;

  /** Map des indices de stat → valeur roulée (ex: 0 → 25) */
  public readonly StatRolls: Readonly<Record<number, number>>;

  /** Liste des ajouts aléatoires appliqués (stats supplémentaires) */
  public readonly AlternatePassiveAdditionInformations: readonly AlternatePassiveAdditionInformation[];

  constructor(
    alternatePassiveSkill: AlternatePassiveSkill,
    statRolls: Record<number, number>,
    alternatePassiveAdditionInformations: readonly AlternatePassiveAdditionInformation[]
  ) {
    if (!alternatePassiveSkill) {
      throw new Error('alternatePassiveSkill is required');
    }
    if (!statRolls) {
      throw new Error('statRolls is required');
    }
    if (!alternatePassiveAdditionInformations) {
      throw new Error('alternatePassiveAdditionInformations is required');
    }

    this.AlternatePassiveSkill = alternatePassiveSkill;
    this.StatRolls = Object.freeze({ ...statRolls });
    this.AlternatePassiveAdditionInformations = Object.freeze([...alternatePassiveAdditionInformations]);
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
// const result = manager.ReplacePassiveSkill();
//
// console.log(result.AlternatePassiveSkill.Name);
// console.log(result.StatRolls[0]); // première stat
// result.AlternatePassiveAdditionInformations.forEach(add => {
//   console.log(`+ ${add.addition.StatIndices[0]}: ${add.statRolls[0]}`);
// });

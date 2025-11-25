// DatafileGenerator/Game/PassiveSkillType.ts
// Port direct de l’enum C# PassiveSkillType
// Représente les différents types de nœuds passifs dans l’arbre de PoE

/**
 * Types de nœuds passifs dans l’arbre de compétences.
 * Utilisé pour filtrer les modifications des Timeless Jewels.
 */
export enum PassiveSkillType {
  /** Aucun type (valeur par défaut) */
  None = 0,

  /** Petit nœud d’attribut (+10 Str/Dex/Int) */
  SmallAttribute = 1,

  /** Petit nœud normal (autres stats) */
  SmallNormal = 2,

  /** Nœud notable */
  Notable = 3,

  /** Nœud keystone */
  KeyStone = 4,

  /** Socket de bijou */
  JewelSocket = 5,
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’utilisation                                                    */
/* -------------------------------------------------------------------------- */

// import { PassiveSkillType } from './PassiveSkillType';
// import { DataManager } from '../Data/DataManager';
//
// const type = DataManager.GetPassiveSkillType(somePassiveSkill);
// if (type === PassiveSkillType.Notable) {
//   console.log('Ce nœud est un notable !');
// }

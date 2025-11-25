// DatafileGenerator/Game/AlternateTreeManager.ts
// Port complet du fichier C# AlternateTreeManager.cs
// Gère la logique de remplacement/augmentation des nœuds passifs par les Timeless Jewels
// Utilise un RNG déterministe (basé sur seed + position du nœud) pour simuler les "rolls"

import { DataManager, PassiveSkillType } from '../Data/DataManager';
import { AlternatePassiveAddition } from '../Data/Models/AlternatePassiveAddition'; // Ajuste les imports selon structure
import { AlternatePassiveSkill } from '../Data/Models/AlternatePassiveSkill';
import { PassiveSkillNode } from '../Data/Models/PassiveSkill';
import { TimelessJewel } from './TimelessJewel';
import { RandomNumberGenerator } from '../Random/RandomNumberGenerator';

/* -------------------------------------------------------------------------- */
/*  Interfaces/Classes pour les résultats (équivalent aux records C#)         */
/* -------------------------------------------------------------------------- */
export class AlternatePassiveAdditionInformation {
  public readonly addition: AlternatePassiveAddition;
  public readonly statRolls: Readonly<Record<number, number>>;

  constructor(addition: AlternatePassiveAddition, statRolls: Record<number, number>) {
    this.addition = addition;
    this.statRolls = Object.freeze({ ...statRolls });
  }
}

export class AlternatePassiveSkillInformation {
  public readonly skill: AlternatePassiveSkill;
  public readonly statRolls: Readonly<Record<number, number>>;
  public readonly additions: readonly AlternatePassiveAdditionInformation[];

  constructor(
    skill: AlternatePassiveSkill,
    statRolls: Record<number, number>,
    additions: AlternatePassiveAdditionInformation[]
  ) {
    this.skill = skill;
    this.statRolls = Object.freeze({ ...statRolls });
    this.additions = Object.freeze(additions);
  }
}

/* -------------------------------------------------------------------------- */
/*  Classe principale                                                         */
/* -------------------------------------------------------------------------- */
export class AlternateTreeManager {
  public readonly PassiveSkill: PassiveSkillNode;
  public readonly TimelessJewel: TimelessJewel;

  constructor(passiveSkill: PassiveSkillNode, timelessJewel: TimelessJewel) {
    if (!passiveSkill) throw new Error('passiveSkill is required');
    if (!timelessJewel) throw new Error('timelessJewel is required');

    this.PassiveSkill = passiveSkill;
    this.TimelessJewel = timelessJewel;
  }

  /** Détermine si le nœud doit être remplacé (dépend du type et de la version) */
  public IsPassiveSkillReplaced(): boolean {
    if (this.PassiveSkill.IsKeyStone) return true;

    if (this.PassiveSkill.IsNotable) {
      if (this.TimelessJewel.AlternateTreeVersion.NotableReplacementSpawnWeight >= 100) return true;

      const rng = new RandomNumberGenerator(this.PassiveSkill, this.TimelessJewel);
      return rng.generateRange(0, 100) < this.TimelessJewel.AlternateTreeVersion.NotableReplacementSpawnWeight;
    }

    if (DataManager.GetPassiveSkillType(this.PassiveSkill) === PassiveSkillType.SmallAttribute) {
      return this.TimelessJewel.AlternateTreeVersion.AreSmallAttributePassiveSkillsReplaced;
    }

    return this.TimelessJewel.AlternateTreeVersion.AreSmallNormalPassiveSkillsReplaced;
  }

  /** Remplace le nœud : sélectionne une nouvelle skill + rolls + additions optionnelles */
  public ReplacePassiveSkill(): AlternatePassiveSkillInformation {
    if (this.PassiveSkill.IsKeyStone) {
      const skill = DataManager.GetAlternatePassiveSkillKeyStone(this.TimelessJewel);
      if (!skill) throw new Error('Keystone replacement not found'); // Assume exists

      const statRolls: Record<number, number> = {
        0: skill.StatAMinimumValue, // Fixed to minimum
      };

      return new AlternatePassiveSkillInformation(skill, statRolls, []);
    }

    // Remplacement normal (notable/small)
    const applicableSkills = DataManager.GetApplicableAlternatePassiveSkills(this.PassiveSkill, this.TimelessJewel);
    const rng = new RandomNumberGenerator(this.PassiveSkill, this.TimelessJewel);

    const type = DataManager.GetPassiveSkillType(this.PassiveSkill);
    if (type === PassiveSkillType.Notable) {
      rng.generateRange(0, 100); // Dummy roll pour seed l'état RNG (déterministe)
    }

    let rolledSkill: AlternatePassiveSkill | null = null;
    let currentSpawnWeight = 0;

    for (const skill of applicableSkills) {
      currentSpawnWeight += skill.SpawnWeight;
      const roll = rng.generate(currentSpawnWeight);
      if (roll < skill.SpawnWeight) {
        rolledSkill = skill;
      }
    }

    if (!rolledSkill) throw new Error('No skill rolled'); // Assume data ensures one

    // Roll des stats de la skill (0-3 max)
    const statRollRanges: Record<number, { minimumRoll: number; maximumRoll: number }> = {
      0: { minimumRoll: rolledSkill.StatAMinimumValue, maximumRoll: rolledSkill.StatAMaximumValue },
      1: { minimumRoll: rolledSkill.StatBMinimumValue, maximumRoll: rolledSkill.StatBMaximumValue },
      2: { minimumRoll: rolledSkill.StatCMinimumValue, maximumRoll: rolledSkill.StatCMaximumValue },
      3: { minimumRoll: rolledSkill.StatDMinimumValue, maximumRoll: rolledSkill.StatDMaximumValue },
    };

    const statRolls: Record<number, number> = {};
    for (let i = 0; i < Math.min(rolledSkill.StatIndices.length, 4); i++) {
      let rollValue = statRollRanges[i].minimumRoll;
      if (statRollRanges[i].maximumRoll > statRollRanges[i].minimumRoll) {
        rollValue = rng.generateRange(statRollRanges[i].minimumRoll, statRollRanges[i].maximumRoll);
      }
      statRolls[i] = rollValue;
    }

    // Additions optionnelles
    if (rolledSkill.MinimumAdditions === 0 && rolledSkill.MaximumAdditions === 0) {
      return new AlternatePassiveSkillInformation(rolledSkill, statRolls, []);
    }

    const minAdditions = this.TimelessJewel.AlternateTreeVersion.MinimumAdditions + rolledSkill.MinimumAdditions;
    const maxAdditions = this.TimelessJewel.AlternateTreeVersion.MaximumAdditions + rolledSkill.MaximumAdditions;

    let additionCount = minAdditions;
    if (maxAdditions > minAdditions) {
      additionCount = rng.generateRange(minAdditions, maxAdditions);
    }

    const additions: AlternatePassiveAdditionInformation[] = [];
    for (let i = 0; i < additionCount; i++) {
      let rolledAddition: AlternatePassiveAddition | null = null;
      while (!rolledAddition) {
        rolledAddition = this.rollAlternatePassiveAddition(rng);
      }

      // Roll stats addition (0-1 max)
      const addStatRanges: Record<number, { minimumRoll: number; maximumRoll: number }> = {
        0: { minimumRoll: rolledAddition.StatAMinimumValue, maximumRoll: rolledAddition.StatAMaximumValue },
        1: { minimumRoll: rolledAddition.StatBMinimumValue, maximumRoll: rolledAddition.StatBMaximumValue },
      };

      const addStatRolls: Record<number, number> = {};
      for (let j = 0; j < Math.min(rolledAddition.StatIndices.length, 2); j++) {
        let rollValue = addStatRanges[j].minimumRoll;
        if (addStatRanges[j].maximumRoll > addStatRanges[j].minimumRoll) {
          rollValue = rng.generateRange(addStatRanges[j].minimumRoll, addStatRanges[j].maximumRoll);
        }
        addStatRolls[j] = rollValue;
      }

      additions.push(new AlternatePassiveAdditionInformation(rolledAddition, addStatRolls));
    }

    return new AlternatePassiveSkillInformation(rolledSkill, statRolls, additions);
  }

  /** Augmente un nœud existant avec des additions (sans remplacement) */
  public AugmentPassiveSkill(): readonly AlternatePassiveAdditionInformation[] {
    const rng = new RandomNumberGenerator(this.PassiveSkill, this.TimelessJewel);

    const type = DataManager.GetPassiveSkillType(this.PassiveSkill);
    if (type === PassiveSkillType.Notable) {
      rng.generateRange(0, 100); // Dummy pour cohérence RNG
    }

    const minAdditions = this.TimelessJewel.AlternateTreeVersion.MinimumAdditions;
    const maxAdditions = this.TimelessJewel.AlternateTreeVersion.MaximumAdditions;

    let additionCount = minAdditions;
    if (maxAdditions > minAdditions) {
      additionCount = rng.generateRange(minAdditions, maxAdditions);
    }

    const additions: AlternatePassiveAdditionInformation[] = [];
    for (let i = 0; i < additionCount; i++) {
      let rolledAddition: AlternatePassiveAddition | null = null;
      while (!rolledAddition) {
        rolledAddition = this.rollAlternatePassiveAddition(rng);
      }

      // Roll stats (identique à Replace)
      const addStatRanges: Record<number, { minimumRoll: number; maximumRoll: number }> = {
        0: { minimumRoll: rolledAddition.StatAMinimumValue, maximumRoll: rolledAddition.StatAMaximumValue },
        1: { minimumRoll: rolledAddition.StatBMinimumValue, maximumRoll: rolledAddition.StatBMaximumValue },
      };

      const addStatRolls: Record<number, number> = {};
      for (let j = 0; j < Math.min(rolledAddition.StatIndices.length, 2); j++) {
        let rollValue = addStatRanges[j].minimumRoll;
        if (addStatRanges[j].maximumRoll > addStatRanges[j].minimumRoll) {
          rollValue = rng.generateRange(addStatRanges[j].minimumRoll, addStatRanges[j].maximumRoll);
        }
        addStatRolls[j] = rollValue;
      }

      additions.push(new AlternatePassiveAdditionInformation(rolledAddition, addStatRolls));
    }

    return Object.freeze(additions);
  }

  /** Sélection pondérée déterministe d'une addition */
  private rollAlternatePassiveAddition(rng: RandomNumberGenerator): AlternatePassiveAddition | null {
    if (!rng) throw new Error('randomNumberGenerator is required');

    const applicable = DataManager.GetApplicableAlternatePassiveAdditions(this.PassiveSkill, this.TimelessJewel);
    const totalSpawnWeight = applicable.reduce((sum, a) => sum + a.SpawnWeight, 0);

    const additionRoll = rng.generate(totalSpawnWeight);

    let roll = additionRoll;
    for (const addition of applicable) {
      if (addition.SpawnWeight > roll) {
        return addition;
      }
      roll -= addition.SpawnWeight;
    }

    return null;
  }
}
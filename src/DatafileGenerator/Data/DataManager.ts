// DatafileGenerator/Data/DataManager.ts
// Port complet du fichier C# DataManager.cs
// Gère le chargement des données JSON et les filtres pour les Timeless Jewels

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AlternatePassiveAddition } from './Models/AlternatePassiveAddition';
import { AlternatePassiveSkill } from './Models/AlternatePassiveSkill';
import { AlternateTreeVersion } from './Models/AlternateTreeVersion';
import { PassiveSkill, PassiveSkillNode } from './Models/PassiveSkill';
import { TreeDataFile } from './Models/TreeDataFile';
import { TimelessJewel } from '../Game/TimelessJewel';
import { GeneratorSettings } from '../GeneratorSettings';

// --------------------------------------------------------------------------
// Énumération des types de nœuds passifs (équivalent à PassiveSkillType en C#)
// --------------------------------------------------------------------------
export enum PassiveSkillType {
  JewelSocket = 0,
  KeyStone = 1,
  Notable = 2,
  SmallAttribute = 3,
  SmallNormal = 4,
}

// --------------------------------------------------------------------------
// Classe DataManager (statique)
// --------------------------------------------------------------------------
export class DataManager {
  // Collections immuables chargées une fois
  private static _alternatePassiveAdditions: readonly AlternatePassiveAddition[] | null = null;
  private static _alternatePassiveSkills: readonly AlternatePassiveSkill[] | null = null;
  private static _alternateTreeVersions: readonly AlternateTreeVersion[] | null = null;
  private static _passiveSkills: readonly PassiveSkill[] | null = null;

  // Getters publics (lecture seule)
  public static get AlternatePassiveAdditions(): readonly AlternatePassiveAddition[] | null {
    return this._alternatePassiveAdditions;
  }

  public static get AlternatePassiveSkills(): readonly AlternatePassiveSkill[] | null {
    return this._alternatePassiveSkills;
  }

  public static get AlternateTreeVersions(): readonly AlternateTreeVersion[] | null {
    return this._alternateTreeVersions;
  }

  public static get PassiveSkills(): readonly PassiveSkill[] | null {
    return this._passiveSkills;
  }

  // ----------------------------------------------------------------------
  // Initialisation (appelée une fois au démarrage)
  // ----------------------------------------------------------------------
  public static Initialize(): boolean {
    this._alternatePassiveAdditions = this.loadFromFile<AlternatePassiveAddition>(
      GeneratorSettings.AlternatePassiveAdditionsFilePath
    );
    this._alternatePassiveSkills = this.loadFromFile<AlternatePassiveSkill>(
      GeneratorSettings.AlternatePassiveSkillsFilePath
    );
    this._alternateTreeVersions = this.getAlternateTrees();

    const treeData = this.loadSingleFromFile<TreeDataFile>(GeneratorSettings.PassiveSkillsFilePath);
    if (!treeData) {
      this._passiveSkills = null;
    } else {
      // Supprime la racine et extrait les valeurs
      const { root, ...nodes } = treeData.nodes;
      this._passiveSkills = Object.values(nodes);
    }

    return !!(
      this._alternatePassiveAdditions &&
      this._alternatePassiveSkills &&
      this._alternateTreeVersions &&
      this._passiveSkills
    );
  }

  // ----------------------------------------------------------------------
  // Génère les 5 versions d’arbre alternatif (1 à 5)
  // ----------------------------------------------------------------------
  private static getAlternateTrees(): readonly AlternateTreeVersion[] {
    return [
      new AlternateTreeVersion(1),
      new AlternateTreeVersion(2),
      new AlternateTreeVersion(3),
      new AlternateTreeVersion(4),
      new AlternateTreeVersion(5),
    ];
  }

  // ----------------------------------------------------------------------
  // Récupère les ajouts applicables pour un nœud + bijou
  // ----------------------------------------------------------------------
  public static GetApplicableAlternatePassiveAdditions(
    passiveSkill: PassiveSkillNode,
    timelessJewel: TimelessJewel
  ): AlternatePassiveAddition[] {
    if (!passiveSkill) throw new Error('passiveSkill is required');
    if (!timelessJewel) throw new Error('timelessJewel is required');

    const result: AlternatePassiveAddition[] = [];

    for (const addition of this._alternatePassiveAdditions ?? []) {
      const type = this.GetPassiveSkillType(passiveSkill);

      if (
        addition.AlternateTreeVersionIndex !== timelessJewel.AlternateTreeVersion.Index ||
        !addition.ApplicablePassiveTypes.includes(type as unknown as number)
      ) {
        continue;
      }

      result.push(addition);
    }

    return result;
  }

  // ----------------------------------------------------------------------
  // Récupère le remplacement Keystone (s’il existe)
  // ----------------------------------------------------------------------
  public static GetAlternatePassiveSkillKeyStone(timelessJewel: TimelessJewel): AlternatePassiveSkill | null {
    if (!timelessJewel) throw new Error('timelessJewel is required');

    const candidate = (this._alternatePassiveSkills ?? []).find(
      (s) => s.AlternateTreeVersionIndex === timelessJewel.AlternateTreeVersion.Index
    );

    if (
      !candidate ||
      !candidate.ApplicablePassiveTypes.includes(PassiveSkillType.KeyStone as unknown as number)
    ) {
      return null;
    }

    return candidate;
  }

  // ----------------------------------------------------------------------
  // Récupère les remplacements applicables pour un nœud + bijou
  // ----------------------------------------------------------------------
  public static GetApplicableAlternatePassiveSkills(
    passiveSkill: PassiveSkillNode,
    timelessJewel: TimelessJewel
  ): AlternatePassiveSkill[] {
    if (!passiveSkill) throw new Error('passiveSkill is required');
    if (!timelessJewel) throw new Error('timelessJewel is required');

    const result: AlternatePassiveSkill[] = [];

    for (const skill of this._alternatePassiveSkills ?? []) {
      const type = this.GetPassiveSkillType(passiveSkill);

      if (
        skill.AlternateTreeVersionIndex !== timelessJewel.AlternateTreeVersion.Index ||
        !skill.ApplicablePassiveTypes.includes(type as unknown as number)
      ) {
        continue;
      }

      result.push(skill);
    }

    return result;
  }

  // ----------------------------------------------------------------------
  // Détermine le type de nœud
  // ----------------------------------------------------------------------
  public static GetPassiveSkillType(passiveSkill: PassiveSkillNode): PassiveSkillType {
    if (!passiveSkill) throw new Error('passiveSkill is required');

    if (passiveSkill.IsJewelSocket) return PassiveSkillType.JewelSocket;
    if (passiveSkill.IsKeyStone) return PassiveSkillType.KeyStone;
    if (passiveSkill.IsNotable) return PassiveSkillType.Notable;
    if (passiveSkill.IsAttribute) return PassiveSkillType.SmallAttribute; // via getter
    return PassiveSkillType.SmallNormal;
  }

  // ----------------------------------------------------------------------
  // Chargement d’un tableau depuis un fichier JSON
  // ----------------------------------------------------------------------
  private static loadFromFile<T>(filePath: string): readonly T[] | null {
    if (!filePath) throw new Error('filePath is required');

    try {
      const fullPath = resolve(filePath);
      const raw = readFileSync(fullPath, 'utf-8');
      const data = JSON.parse(raw) as T[];
      return Object.freeze(data);
    } catch (err) {
      console.error(`Failed to load ${filePath}:`, err);
      return null;
    }
  }

  // ----------------------------------------------------------------------
  // Chargement d’un objet unique depuis un fichier JSON
  // ----------------------------------------------------------------------
  private static loadSingleFromFile<T>(filePath: string): T | null {
    if (!filePath) throw new Error('filePath is required');

    try {
      const fullPath = resolve(filePath);
      const raw = readFileSync(fullPath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Failed to load ${filePath}:`, err);
      return null;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’initialisation                                                  */
/* -------------------------------------------------------------------------- */

// if (DataManager.Initialize()) {
//   console.log('Data loaded successfully');
//   console.log(`Notables: ${DataManager.PassiveSkills?.filter(s => s.IsNotable).length}`);
// }
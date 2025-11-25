// DatafileGenerator/Data/Models/PassiveSkill.ts
// Porté depuis le fichier C# du même nom
// Représente un nœud de l’arbre de passifs (chargé depuis le skill tree JSON)

export interface PassiveSkill {
  /** Identifiant unique dans le graphe de l’arbre (clé "skill") */
  readonly GraphIdentifier: number;

  /** Nom du nœud */
  readonly Name: string;

  /** Liste des stats en texte brut (ex: "+10 to Strength") */
  readonly StatStrings: readonly string[];

  /** Est-ce un nœud Blight ? */
  readonly IsBlight: boolean;

  /** Est-ce un socket de bijou ? */
  readonly IsJewelSocket: boolean;

  /** Est-ce un nœud notable ? */
  readonly IsNotable: boolean;

  /** Est-ce un keystone ? */
  readonly IsKeyStone: boolean;

  /** Est-ce un nœud de maîtrise (mastery) ? */
  readonly IsMastery: boolean;

  /** Est-ce un proxy (nœud virtuel) ? */
  readonly IsProxy: boolean;

  /** Nom de l’ascendance (si applicable) */
  readonly AscName: string;

  /** Orbite (0-6 pour petits/grands, null pour clusters) */
  readonly Orbit: number | null;
}

/* -------------------------------------------------------------------------- */
/*  Classe utilitaire avec getters calculés (comme en C#)                      */
/* -------------------------------------------------------------------------- */

export class PassiveSkillNode implements PassiveSkill {
  // --- Propriétés du JSON ---
  public readonly GraphIdentifier: number;
  public readonly Name: string;
  public readonly StatStrings: readonly string[];
  public readonly IsBlight: boolean;
  public readonly IsJewelSocket: boolean;
  public readonly IsNotable: boolean;
  public readonly IsKeyStone: boolean;
  public readonly IsMastery: boolean;
  public readonly IsProxy: boolean;
  public readonly AscName: string;
  public readonly Orbit: number | null;

  constructor(data: PassiveSkill) {
    Object.assign(this, data);
  }

  /** Est-ce un nœud d’ascendance ? */
  get IsAscendancy(): boolean {
    return this.AscName !== null && this.AscName !== '';
  }

  /** Est-ce un cluster jewel ? */
  get IsCluster(): boolean {
    return this.Orbit === null;
  }

  /** Est-ce un nœud d’attribut (+10 Str/Dex/Int) ? */
  get IsAttribute(): boolean {
    return (
      this.StatStrings.length === 1 &&
      (
        this.StatStrings[0] === '+10 to Strength' ||
        this.StatStrings[0] === '+10 to Dexterity' ||
        this.StatStrings[0] === '+10 to Intelligence'
      )
    );
  }

  /** Peut-il être modifié par un Timeless Jewel ? */
  get IsModifiable(): boolean {
    return !(
      this.IsCluster ||
      this.IsAscendancy ||
      this.IsProxy ||
      this.IsMastery ||
      this.IsKeyStone ||
      this.IsJewelSocket ||
      this.IsBlight
    );
  }

  /** Comparaison par GraphIdentifier (pour tri) */
  compareTo(other: PassiveSkillNode | null): number {
    if (other === null) return -1;
    return this.GraphIdentifier - other.GraphIdentifier;
  }
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’utilisation (chargement depuis JSON)                            */
/* -------------------------------------------------------------------------- */

// import { readFileSync } from 'node:fs';
// import { resolve } from 'node:path';
//
// const raw = readFileSync(resolve(__dirname, '../../data/passive_skill_tree.json'), 'utf-8');
// const tree: PassiveSkill[] = JSON.parse(raw);
// const nodes = tree.map(data => new PassiveSkillNode(data));
//
// const notables = nodes.filter(n => n.IsNotable && n.IsModifiable);
// console.log(`Nœuds notables modifiables : ${notables.length}`);

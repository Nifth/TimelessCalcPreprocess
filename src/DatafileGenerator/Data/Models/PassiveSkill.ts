// DatafileGenerator/Data/Models/PassiveSkill.ts
// Porté depuis le fichier C# du même nom
// Représente un nœud de l’arbre de passifs (chargé depuis le skill tree JSON)

export interface PassiveSkill {
  /** Identifiant unique dans le graphe de l’arbre (clé "skill") */
  readonly skill: number;

  /** Nom du nœud */
  readonly name: string;

  /** Liste des stats en texte brut (ex: "+10 to Strength") */
  readonly stats: readonly string[];

  /** Est-ce un nœud Blight ? */
  readonly isBlight: boolean;

  /** Est-ce un socket de bijou ? */
  readonly isJewelSocket: boolean;

  /** Est-ce un nœud notable ? */
  readonly isNotable: boolean;

  /** Est-ce un keystone ? */
  readonly isKeystone: boolean;

  /** Est-ce un nœud de maîtrise (mastery) ? */
  readonly isMastery: boolean;

  /** Est-ce un proxy (nœud virtuel) ? */
  readonly isProxy: boolean;

  /** Nom de l’ascendance (si applicable) */
  readonly ascendancyName: string;

  /** Orbite (0-6 pour petits/grands, null pour clusters) */
  readonly orbit: number | null;
}

/* -------------------------------------------------------------------------- */
/*  Classe utilitaire avec getters calculés (comme en C#)                      */
/* -------------------------------------------------------------------------- */

export class PassiveSkillNode implements PassiveSkill {
  // --- Propriétés du JSON ---
  public readonly skill: number;
  public readonly name: string;
  public readonly stats: readonly string[];
  
  public readonly isBlight: boolean;
  public readonly isJewelSocket: boolean;
  public readonly isNotable: boolean;
  public readonly isKeystone: boolean;
  public readonly isMastery: boolean;
  public readonly isProxy: boolean;
  public readonly ascendancyName: string;
  public readonly orbit: number | null;

  constructor(data: PassiveSkill) {
    Object.assign(this, data);
  }

  get GraphIdentifier(): number { return this.skill; }

  get Name(): string { return this.name; }
  get IsBlight(): boolean { return this.isBlight; }
  get IsJewelSocket(): boolean { return this.isJewelSocket; }
  get IsNotable(): boolean { return this.isNotable; }
  get IsKeyStone(): boolean { return this.isKeystone; }
  get IsMastery(): boolean { return this.isMastery; }
  get IsProxy(): boolean { return this.isProxy; }

  get IsAscendancy(): boolean {
    return this.ascendancyName !== null && this.ascendancyName !== '' && this.ascendancyName !== undefined;
  }

  get IsCluster(): boolean {
    return this.orbit === null;
  }
  get StatStrings(): readonly string[] {
    return this.stats;
  }

  get IsAttribute(): boolean {
    return (
      this.StatStrings.length === 1 &&
      ['+10 to Strength', '+10 to Dexterity', '+10 to Intelligence'].includes(this.StatStrings[0])
    );
  }

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

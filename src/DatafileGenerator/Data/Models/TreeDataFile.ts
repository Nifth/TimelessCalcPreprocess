// DatafileGenerator/Data/Models/TreeDataFile.ts
// Porté depuis le fichier C# du même nom
// Représente le conteneur principal du fichier skill tree JSON (ex: passive_skill_tree.json)

import { PassiveSkill } from './PassiveSkill';

/**
 * Structure racine du fichier de données de l’arbre de passifs.
 * Contient une map des nœuds indexés par leur clé string (souvent le GraphIdentifier en string).
 */
export interface TreeDataFile {
  /** Map des nœuds passifs : clé string → PassiveSkill */
  readonly nodes: Readonly<Record<string, PassiveSkill>>;
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’utilisation (chargement depuis JSON avec Node.js)               */
/* -------------------------------------------------------------------------- */

// import { readFileSync } from 'node:fs';
// import { resolve } from 'node:path';
//
// const raw = readFileSync(
//   resolve(__dirname, '../../data/passive_skill_tree.json'),
//   'utf-8'
// );
// const treeData: TreeDataFile = JSON.parse(raw);
//
// // Accès à un nœud spécifique
// const node = treeData.nodes['12345']; // clé string
// console.log(node?.Name);

/* -------------------------------------------------------------------------- */
/*  Correspondance C# → TS                                                   */
/* -------------------------------------------------------------------------- */
// Dictionary<string, PassiveSkill>  →  Record<string, PassiveSkill>
// get; set;                        →  readonly (car les données sont immuables après chargement)
// [JsonPropertyName("nodes")]      →  pas nécessaire : la clé JSON est "nodes"

// DatafileGenerator/GeneratorSettings.ts
// Port direct du fichier C# GeneratorSettings.cs
// Contient les chemins des fichiers de données et métadonnées de l’application

/**
 * Configuration globale du générateur.
 * Les chemins doivent être définis avant l’appel à DataManager.Initialize().
 */
export class GeneratorSettings {
  /** Nom de l’application */
  public static readonly ApplicationName = 'DatafileGenerator';

  /** Version de l’application */
  public static readonly ApplicationVersion = '1.2';

  /** Chemin vers le fichier alternate_passive_additions.json */
  public static AlternatePassiveAdditionsFilePath: string;

  /** Chemin vers le fichier alternate_passive_skills.json */
  public static AlternatePassiveSkillsFilePath: string;

  /** Chemin vers le fichier passive_skill_tree.json */
  public static PassiveSkillsFilePath: string;
}

/* -------------------------------------------------------------------------- */
/*  Exemple d’initialisation (dans Program.ts ou au démarrage)                */
/* -------------------------------------------------------------------------- */

// import { resolve } from 'node:path';
// import { GeneratorSettings } from './GeneratorSettings';
//
// GeneratorSettings.AlternatePassiveAdditionsFilePath = resolve(
//   __dirname,
//   '../../data/alternate_passive_additions.json'
// );
// GeneratorSettings.AlternatePassiveSkillsFilePath = resolve(
//   __dirname,
//   '../../data/alternate_passive_skills.json'
// );
// GeneratorSettings.PassiveSkillsFilePath = resolve(
//   __dirname,
//   '../../data/passive_skill_tree.json'
// );

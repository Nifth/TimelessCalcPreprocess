// Program.ts
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { resolve, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createGzip } from 'node:zlib';
import { DataManager } from './Data/DataManager';
import { GeneratorSettings } from './GeneratorSettings';
import { PassiveSkillNode } from './Data/Models/PassiveSkill';
import { TimelessJewel } from './Game/TimelessJewel';
import { AlternateTreeManager } from './Game/AlternateTreeManager';

const OUTPUT_DIR = resolve('public/data');
const CHUNK_SIZE = 500; // seeds par chunk
const FLUSH_EVERY = 100; // flush toutes les 100 lignes
// Mapping des bijoux
const JEWELS = [
  { index: 2, name: 'LethalPride', min: 10000, max: 18000, step: 1 },
  { index: 3, name: 'BrutalRestraint', min: 500, max: 8000, step: 1 },
  { index: 4, name: 'MilitantFaith', min: 2000, max: 10000, step: 1 },
  { index: 5, name: 'ElegantHubris', min: 2000, max: 160000, step: 20 },
  // Glorious Vanity plus tard
] as const;

async function main() {
  console.log('Spinning up! DatafileGenerator → JSONL.gz\n');

  // --- Chargement données ---
  GeneratorSettings.AlternatePassiveAdditionsFilePath = resolve('data/alternatepassiveadditions.json');
  GeneratorSettings.AlternatePassiveSkillsFilePath = resolve('data/alternatepassiveskills.json');
  GeneratorSettings.PassiveSkillsFilePath = resolve('data/data.json');

  if (!existsSync(GeneratorSettings.AlternatePassiveAdditionsFilePath)) {
    console.error('Fichier manquant:', GeneratorSettings.AlternatePassiveAdditionsFilePath);
    process.exit(1);
  }

  console.log('Chargement des données...');
  if (!DataManager.Initialize()) {
    console.error('Échec du chargement.');
    process.exit(1);
  }
  console.log(`Nodes: ${DataManager.PassiveSkills?.length}`);
  console.log(`Additions: ${DataManager.AlternatePassiveAdditions?.length}\n`);

  // --- Création dossier public/data ---
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // --- Génération par bijou ---
  for (const jewel of JEWELS) {
    const start = performance.now();
    await generateJewelJsonl(jewel);
    const duration = ((performance.now() - start) / 1000).toFixed(1);
    console.log(`${jewel.name} → ${duration}s\n`);
  }

  console.log('Terminé ! Fichiers dans /public/data');
}

async function generateJewelJsonl(jewel: typeof JEWELS[number]) {
  const { index, name, min, max, step } = jewel;
  const version = DataManager.AlternateTreeVersions!.find(v => v.Index === index);
  if (!version) throw new Error(`Version ${index} introuvable`);

  const notables = DataManager.PassiveSkills!
    .filter(n => n.IsNotable && n.IsModifiable);

  console.log(`${name}: ${notables.length} nodes notables, seeds ${min}→${max} (step ${step})`);

  const filePath = join(OUTPUT_DIR, `${name}.jsonl.gz`);
  const writeStream = createWriteStream(filePath);
  const gzip = createGzip();
  writeStream.on('error', err => console.error('Write error:', err));
  gzip.on('error', err => console.error('Gzip error:', err));

  gzip.pipe(writeStream);
  let lineBuffer = '';
  let lineCount = 0;

  const flush = () => {
    if (lineBuffer) {
      gzip.write(lineBuffer);
      lineBuffer = '';
      lineCount = 0;
    }
  };
  let processed = 0;

  for (let seed = min; seed <= max; seed += step) {
    const timelessJewel = new TimelessJewel(version, seed);
    let replacedMap = {};
    let addedMap = {};
    let index = 0;

    for (const node of notables) {
      const manager = new AlternateTreeManager(node, timelessJewel);
      const replaced = manager.IsPassiveSkillReplaced();

      if (replaced) {
        const res = manager.ReplacePassiveSkill();
        const v = res.StatRolls[0] ?? 0;
        if (!replacedMap[res.AlternatePassiveSkill._rid]) {
          replacedMap[res.AlternatePassiveSkill._rid] = [index]
        } else {
          replacedMap[res.AlternatePassiveSkill._rid].push(index)
        }
      } else {
        const adds = manager.AugmentPassiveSkill();
        if (adds.length > 0) {
          const add = adds[0];
          const v = add.StatRolls[0] ?? 0;
          if (!addedMap[add.AlternatePassiveAddition._rid]) {
            addedMap[add.AlternatePassiveAddition._rid] =  [index]
          } else {
            addedMap[add.AlternatePassiveAddition._rid].push(index)
          }
        }
      }
      index++;
    }
    let entry = {};
    entry = { r: replacedMap, a: addedMap }

    lineBuffer += JSON.stringify(entry) + '\n';
    lineCount++;

    if (lineCount >= FLUSH_EVERY) {
      flush();
    }
    
    replacedMap = {};
    addedMap = {};
    entry = {};

    // Log progression
    if ((seed - min) % (step * 1000) === 0) {
      process.stdout.write(`\r  → Seed ${seed}...`);
      flush(); // force flush
    }
  }

  flush();
  gzip.end();
  await new Promise<void>((r, reject) => {
    writeStream.on('finish', () => r());
    writeStream.on('error', reject);
  });
  console.log(`\r  → ${name}.jsonl.gz généré`);
}

// --- Lancement ---
main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { resolve, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { gzipSync } from 'fflate';
import { DataManager } from './Timeless/Data/DataManager';
import { GeneratorSettings } from './Timeless/GeneratorSettings';
import { TimelessJewel } from './Timeless/Game/TimelessJewel';
import { AlternateTreeManager } from './Timeless/Game/AlternateTreeManager';

const version = process.argv[2] || 'default';

const loadTreeData = async (version: string) => {
  try {
    const module = await import(`../output/${version}/tree.json`);
    return module.default;
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return null;
  }
};

const OUTPUT_DIR = resolve(`output/${version}`);
const JEWELS = [
  { index: 1, name: 'GloriousVanity', min: 100, max: 8000, step: 1 },
  { index: 2, name: 'LethalPride', min: 10000, max: 18000, step: 1 },
  { index: 3, name: 'BrutalRestraint', min: 500, max: 8000, step: 1 },
  { index: 4, name: 'MilitantFaith', min: 2000, max: 10000, step: 1 },
  { index: 5, name: 'ElegantHubris', min: 2000, max: 160000, step: 20 },
] as const;

let modifiableNodeIds = [];
let treeData: any = {};

async function main() {
  treeData = await loadTreeData(version);
  Object.values(treeData.socketNodes).forEach((node: string[]) => {
    modifiableNodeIds = [...modifiableNodeIds, ...node.map((n) => {return Number(n)})];
  })
  modifiableNodeIds = modifiableNodeIds.filter((item, index, arr) => {
    return arr.indexOf(item) === index;
  });
  console.log('Spinning up! DatafileGenerator → JSONL.gz\n');

  // --- Load data ---
  GeneratorSettings.AlternatePassiveAdditionsFilePath = resolve(__dirname, `../data/${version}/alternatepassiveadditions.json`);
  GeneratorSettings.AlternatePassiveSkillsFilePath = resolve(__dirname, `../data/${version}/alternatepassiveskills.json`);
  GeneratorSettings.PassiveSkillsFilePath = resolve(__dirname, `../data/${version}/data.json`);

  if (!existsSync(GeneratorSettings.AlternatePassiveAdditionsFilePath)) {
    console.error('Missing file:', GeneratorSettings.AlternatePassiveAdditionsFilePath);
    process.exit(1);
  }

  console.log('Loading data...');
  if (!DataManager.Initialize()) {
    console.error('Loading failed.');
    process.exit(1);
  }
  console.log(`Nodes: ${DataManager.PassiveSkills?.length}`);
  console.log(`Additions: ${DataManager.AlternatePassiveAdditions?.length}`);
  console.log(`Replace: ${DataManager.AlternatePassiveSkills?.length}\n`);

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const jewel of JEWELS) {
    const start = performance.now();
    await generateJewelJsonl(jewel);
    const duration = ((performance.now() - start) / 1000).toFixed(1);
    console.log(`${jewel.name} → ${duration}s\n`);
  }

  console.log(`Finished ! Files in output/${version}/`);
}

async function generateJewelJsonl(jewel: typeof JEWELS[number]) {
  const { index, name, min, max, step } = jewel;
  const version = DataManager.AlternateTreeVersions!.find(v => v.Index === index);
  if (!version) throw new Error(`Version ${index} not found`);

  let nodes = index === 1 ? DataManager.PassiveSkills!.filter(n => n.IsModifiable).filter(n => modifiableNodeIds.includes(n.GraphIdentifier))
    : DataManager.PassiveSkills!
    .filter(n => n.IsNotable && n.IsModifiable)
    .filter(n => modifiableNodeIds.includes(n.GraphIdentifier))

  console.log(`${name}: ${nodes.length} nodes, seeds ${min}→${max} (step ${step})`);

  const filePath = join(OUTPUT_DIR, `${name}.jsonl.gz`);
  const writeStream = createWriteStream(filePath);
  writeStream.on('error', err => console.error('Write error:', err));

  const lines: string[] = [];


  for (let seed = min; seed <= max; seed += step) {
    const timelessJewel = new TimelessJewel(version, seed);
    let replacedMap = {};
    let addedMap = {};

    for (const node of nodes) {
      const manager = new AlternateTreeManager(node, timelessJewel);
      const replaced = manager.IsPassiveSkillReplaced();

      if (replaced) {
        const res = manager.ReplacePassiveSkill();

        const stats = {};
        Object.values(res.StatRolls).forEach((roll, index) => {
          stats[res.AlternatePassiveSkill.StatsKeys[index]] = roll;
        });
        const key = res.AlternatePassiveSkill._rid + '-' + JSON.stringify(stats);
        if (!replacedMap[key]) {
          replacedMap[key] = [node.GraphIdentifier]
        } else {
          replacedMap[key].push(node.GraphIdentifier)
        }
      } else {
        const adds = manager.AugmentPassiveSkill();
        if (adds.length > 0) {
          const add = adds[0];
          const stats = {};
          Object.values(add.StatRolls).forEach((roll, index) => {
            stats[add.AlternatePassiveAddition.StatsKeys[index]] = roll;
          });
          const key = add.AlternatePassiveAddition._rid + '-' + JSON.stringify(stats);
          if (!addedMap[key]) {
            addedMap[key] = [node.GraphIdentifier]
          } else {
            addedMap[key].push(node.GraphIdentifier)
          }
        }
      }
    }
    let entry = {};
    entry = { r: replacedMap, a: addedMap }

    const line = JSON.stringify(entry) + '\n';
    lines.push(line);
    
    replacedMap = {};
    addedMap = {};
    entry = {};

    // Log progression
    if ((seed - min) % (step * 100) === 0) {
      process.stdout.write(`\r  → Seed ${seed}...`);
    }
  }

  console.log(`Lines count: ${lines.length}`);
  const data = lines.join('');
  const gzipped = gzipSync(new TextEncoder().encode(data));
  console.log(`Data length: ${data.length}, gzipped length: ${gzipped.length}`);
  writeStream.write(gzipped);
  writeStream.end();
  await new Promise<void>((r, reject) => {
    writeStream.on('finish', () => r());
    writeStream.on('error', reject);
  });
  console.log(`\r  → ${name}.jsonl.gz generated`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
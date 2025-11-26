// Program.ts
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { deflateSync } from 'node:zlib';
import { DataManager } from './Data/DataManager';
import { GeneratorSettings } from './GeneratorSettings';
import { PassiveSkillNode } from './Data/Models/PassiveSkill';
import { TimelessJewel } from './Game/TimelessJewel';
import { AlternateTreeManager } from './Game/AlternateTreeManager';

const MAX_BYTES_IN_FILE = 5 * 1024 * 1024;
const CSV_FILE = 'node_indices.csv';

async function main() {
  console.log('\x1b[36mSpinning up! DatafileGenerator v1.2\x1b[0m\n');

  // HARDCODÉ — MODIFIE ICI
  GeneratorSettings.AlternatePassiveAdditionsFilePath = resolve('data/alternatepassiveadditions.json');
  GeneratorSettings.AlternatePassiveSkillsFilePath = resolve('data/alternatepassiveskills.json');
  GeneratorSettings.PassiveSkillsFilePath = resolve('data/data.json');
  const outputDir = resolve('output');
  const compression: 'compressed' | 'uncompressed' | 'both' = 'both';

  // Vérification
  if (!existsSync(GeneratorSettings.AlternatePassiveAdditionsFilePath)) {
    console.error('Fichier manquant:', GeneratorSettings.AlternatePassiveAdditionsFilePath);
    process.exit(1);
  }

  console.log('\x1b[32mLoading...\x1b[0m');
  if (!DataManager.Initialize()) {
    console.error('Échec du chargement des données.');
    process.exit(1);
    // todo: corrigé la casse
  }
  console.log('Total nodes:', DataManager.PassiveSkills?.length);

  const numAdditions = DataManager.AlternatePassiveAdditions?.length ?? 0;
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const notables = getModifiableNodes(true);
  const testNode = notables.find(n => n.GraphIdentifier === 49445); // ou un notable connu
  if (!testNode) {
    console.error('Nœud test non trouvé');
    process.exit(1);
  }

  const jewel = new TimelessJewel(
    DataManager.AlternateTreeVersions!.find(v => v.Index === 2)!,
    10000
  );

  const manager = new AlternateTreeManager(testNode, jewel);
  const replaced = manager.IsPassiveSkillReplaced();
  console.log('Replaced:', replaced);

  if (replaced) {
    const result = manager.ReplacePassiveSkill();
    console.log('→ Replacement:', result.AlternatePassiveSkill.Name);
    console.log('→ Stats:', Object.values(result.StatRolls));
    console.log('→ Additions:', result.AlternatePassiveAdditionInformations.map(a => ({
      name: a.AlternatePassiveAddition.StatsKeys[0] || 'Unknown',
      value: a.StatRolls[0]
    })));
  } else {
    const adds = manager.AugmentPassiveSkill();
    console.log('→ Additions:', adds.map(a => ({
      name: a.AlternatePassiveAddition.StatsKeys[0] || 'Unknown',
      value: a.StatRolls[0]
    })));
  }
  return;

  const smalls = getModifiableNodes(false);
  notables.sort((a, b) => a.GraphIdentifier - b.GraphIdentifier);
  smalls.sort((a, b) => a.GraphIdentifier - b.GraphIdentifier);
  const allNodes = [...notables, ...smalls];

  // CSV
  const csv = ['PassiveSkillGraphId,Name,Datafile Parsing Index'];
  allNodes.forEach((n, i) => {
    const name = n.Name.includes(',') ? `"${n.Name}"` : n.Name;
    csv.push(`${n.GraphIdentifier},${name},${i}`);
  });
  writeFileSync(join(outputDir, CSV_FILE), csv.join('\n'));

  console.log('\x1b[32mProcessing...\x1b[0m');

  for (let type = 2; type >= 2; type--) { // skip 1 (GV)
    const start = performance.now();
    const info = getJewelTypeInfo(type);
    console.log(`Processing ${info.name}`);
    /*const data = await generateRegular(notables, type, info, numAdditions);
    const file = `${info.name}.bin`;
    const path = join(outputDir, file);

    if (compression === 'both') {
      if (existsSync(path)) rmSync(path);
      writeFileSync(path, data);
    }

    if (compression === 'both') {
      const zip = deflateSync(data);
      const zipPath = join(outputDir, `${info.name}.zip`);
      if (existsSync(zipPath)) rmSync(zipPath);
      writeFileSync(zipPath, zip);
    }*/

    console.log(`${info.name} → ${(performance.now() - start) / 1000}s`);
    const debugSeed = type === 2 ? 10000 : type === 5 ? 2000 : info.min;
    await generateJsonOutput(notables, type, info, debugSeed, outputDir);
  }

  console.log('\x1b[32mDone!\x1b[0m');
}

function getModifiableNodes(notablesOnly: boolean): PassiveSkillNode[] {
  return (DataManager.PassiveSkills ?? [])
    .filter(n => n.IsModifiable && (notablesOnly ? n.IsNotable : !n.IsNotable));
}

function getJewelTypeInfo(type: number) {
  const map: Record<number, any> = {
    2: { min: 10000, max: 18000, inc: 1, name: 'LethalPride' },
    3: { min: 500, max: 8000, inc: 1, name: 'BrutalRestraint' },
    4: { min: 2000, max: 10000, inc: 1, name: 'MilitantFaith' },
    5: { min: 2000, max: 160000, inc: 20, name: 'ElegantHubris' },
  };
  return map[type] || process.exit(1);
}

async function generateRegular(
  notables: PassiveSkillNode[],
  type: number,
  info: { min: number; max: number; inc: number },
  numAdditions: number
): Promise<Uint8Array> {
  const { min, max, inc } = info;
  const seedCount = Math.floor((max - min) / inc) + 1;
  const buffer = new Uint8Array(seedCount * notables.length);
  let filteredNotables = notables.filter(n => n.name == 'Gravepact')

  // PARALLÉLISATION PAR NŒUD
  Promise.all(
    filteredNotables.map(async (node, nodeIdx) => {
      for (let s = min; s <= max; s += inc) {
        const seedIdx = Math.floor((s - min) / inc);
        const jewel = new TimelessJewel(
          DataManager.AlternateTreeVersions!.find(v => v.Index === type)!,
          s
        );
        const manager = new AlternateTreeManager(node, jewel);

        let value = 0;
        if (manager.IsPassiveSkillReplaced()) {
          const result = manager.ReplacePassiveSkill();
          value = result.AlternatePassiveSkill._rid + numAdditions;
        } else {
          const adds = manager.AugmentPassiveSkill();
          if (adds.length > 0) {
            value = adds[0].AlternatePassiveAddition._rid;
          }
        }

        buffer[nodeIdx * seedCount + seedIdx] = value & 0xFF;
      }
    })
  );

  return buffer;
}

async function generateJsonOutput(
  notables: PassiveSkillNode[],
  type: number,
  info: { min: number; max: number; inc: number; name: string },
  seed: number,
  outputDir: string
): Promise<void> {
  const jewel = new TimelessJewel(
    DataManager.AlternateTreeVersions!.find(v => v.Index === type)!,
    seed
  );

  const result: Record<string, any> = {
    jewel: info.name,
    seed,
    nodes: {}
  };

  let filteredNotables = notables.filter(n => n.name == 'Deep Breaths')
  for (const node of filteredNotables) {
    console.log(node);
    const manager = new AlternateTreeManager(node, jewel);
    const entry: any = {
      name: node.Name
    };

    if (manager.IsPassiveSkillReplaced()) {
      const replace = manager.ReplacePassiveSkill();
      const skill = DataManager.AlternatePassiveSkills!.find(s => s._rid === replace.AlternatePassiveSkill._rid);
      entry.replacement = skill?.Name || 'Unknown';
      entry.stats = Object.values(replace.StatRolls);
      entry.additions = replace.AlternatePassiveAdditionInformations.map(add => {
        const addData = DataManager.AlternatePassiveAdditions!.find(a => a._rid === add.AlternatePassiveAddition._rid);
        return {
          name: addData?.StatsKeys[0] || 'Unknown',
          value: add.StatRolls[0] || 0
        };
      });
    } else {
      const adds = manager.AugmentPassiveSkill();
      console.log(adds);
      entry.replacement = null;
      entry.additions = adds.map(add => {
        const addData = DataManager.AlternatePassiveAdditions!.find(a => a._rid === add.AlternatePassiveAddition._rid);
        return {
          name: addData?.StatsKeys[0] || 'Unknown',
          value: add.StatRolls[0] || 0
        };
      });
    }
    console.log(entry);

    result.nodes[node.GraphIdentifier] = entry;
  }

  const fileName = `${info.name}_${seed}.json`;
  writeFileSync(join(outputDir, fileName), JSON.stringify(result, null, 2));
  console.log(`JSON debug: ${fileName}`);
}

main().catch(console.error);
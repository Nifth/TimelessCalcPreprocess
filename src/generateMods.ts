import * as fs from 'fs';
import * as path from 'path';

const version = process.argv[2] || 'default';
const inputPath = path.resolve(__dirname, `../data/${version}/data.json`);
const replaceSkillsPath = path.resolve(__dirname, `../data/${version}/alternatepassiveskills.json`);
const additionSkillsPath = path.resolve(__dirname, `../data/${version}/alternatepassiveadditions.json`);
const statsPath = path.resolve(__dirname, `../data/${version}/stats.json`);
const descriptionPath = path.resolve(__dirname, `../data/${version}/stat_descriptions.txt`);
const outputDir = path.resolve(__dirname, `../output/${version}`);


function getSkillList(): number[] {
    const replaceData = readJSON(replaceSkillsPath);
    const additionData = readJSON(additionSkillsPath);
    const data = [...replaceData, ...additionData];

    let skillList = new Set();
    data.forEach(value => {
        const statsKeys = value.StatsKeys;
        if (value.PassiveType.includes('4')) {
            return;
        }
        statsKeys.forEach(k => {
            skillList.add(k)
        });
    });

    return (Array.from(skillList) as number[]).sort((a, b) => {
        return a > b ? 1 : -1;
    });;
}

function parseStats(skillList: number[]): Map<string, number>
{
    const statsData = readJSON(statsPath);
    const map = new Map<string, number>()

    statsData.forEach(stat => {
        if (skillList.includes(stat._rid)) {
            if (['base_dexterity', 'base_intelligence', 'base_strength'].includes(stat.Id)) {
                map.set(stat.Id.replace('base_', 'additional_'), stat._rid)
            } else {
                map.set(stat.Id, stat._rid);
            }
        }
    })

    return map;
}

function readJSON(filepath: string): Record<string, any>[]
{
    const inputData = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(inputData)
}

function parseDescriptions(statsCodes: Map<string, number>)
{
    const inputData = fs.readFileSync(descriptionPath, 'utf-16le');
    const descriptions = inputData.split("\n")
        .map(a => a.trim())
        .filter(a => !a.startsWith('no_description'))
        .join("\n")
        .split("description\n");

    const finalDescriptions = {}

    descriptions.forEach(row => {
        const rowData = row.split("\n").map(a => a.trim())
        const match = rowData[0].match(/^\d+\s+(\S+)(?:\s|$)/)
        const skillId = match ? match[1].trim() : null;
        if (!statsCodes.has(skillId)) {
            return;
        }
        const numberOfRowsToRead = Number(rowData[1])
        const translations = rowData.slice(2, 2 + numberOfRowsToRead)
        const regex = /^([^"]*?)\"([^\"]+)\"/
        let statDescription = [];
        translations.forEach(t => {
            const matches = t.match(regex);
            const type = matches[1].trim();
            const translation = matches[2];
            let from, to;
            if (type === '# 1|#' || type === '100|# 0') {
                return;
            }
            if (type === '#|-1') {
                to = -1;
            } else if (type === '#|1' || type === '1') {
                from = to = 1;
            } else if (type === '#|99' || type === '1|99' || type === '1|99  0') {
                from = 0;
                to = 99;
            } else if (type === '1|#') {
                from = 1;
            } else if (type === '2|#') {
                from = 2;
            } else if (type === '100|#') {
                from = 100;
                to = 100;
            }
            let divider = 1;
            if (t.includes('divide_by_one_hundred')) {
                divider = 100;
            } else if (t.includes('per_minute_to_per_second')) {
                divider = 60;
            }
            statDescription.push({from: from, to: to, divider: divider, translation: translation.replace('{0:+d}', '{0}')})
        })
        finalDescriptions[statsCodes.get(skillId)] = statDescription;
    });
    finalDescriptions[statsCodes.get('base_devotion')] = [{translation: "Devotion"}]
    writeOutputFiles(finalDescriptions, 'translation.json')
}

function writeJewelStats()
{
    const replaceData = readJSON(replaceSkillsPath);
    const additionData = readJSON(additionSkillsPath);
    const data = [...replaceData, ...additionData];
    const mapping = {
        1: 'vaal',
        2: 'karui',
        3: 'maraketh',
        4: 'templar',
        5: 'eternal'
     }

    let jewelData = {};

    data.forEach(row => {
        if (row.PassiveType.includes(4)) return;
        const jewelType = mapping[row.AlternateTreeVersionsKey];
        if (!jewelData[jewelType]) {
            jewelData[jewelType] = [];
        }
        if (row.StatsKeys[0]) {
           jewelData[jewelType].push(row.StatsKeys[0])
        }
    })

    writeOutputFiles(jewelData, 'jewelstats.json')
}

/**
 * Writes the cleaned data to a compact JSON file and a gzip-compressed version for frontend use.
 */
function writeOutputFiles(data: Record<string, any>, filename: string) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, filename)
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Cleaned file written (compact):', outputPath);
    try {
        const { gzipSync } = require('zlib');
        fs.writeFileSync(outputPath + '.gz', gzipSync(JSON.stringify(data)));
        console.log('Compressed file written:', outputPath + '.gz');
    } catch (e) {
        console.warn('Gzip compression not available (zlib)', e);
    }
}

/**
 * Loads, cleans, and writes the processed data.
 */
function cleanData() {
    const skillList = getSkillList();
    const statsCodes = parseStats(skillList);
    parseDescriptions(statsCodes);
    writeJewelStats();
    // ajouter un fichier qui liste jewelType => {_rid, stats[0]}[] pour pouvoir search
}

if (require.main === module) {
    cleanData();
}
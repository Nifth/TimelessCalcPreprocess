import * as fs from 'fs';
import * as path from 'path';

/**
 * Set the version to use for input/output folders. Default: 'default'.
 * You can pass a version as a CLI argument: node parseTree.js 3.21.0
 */
const version = process.argv[2] || 'default';
const inputPath = path.resolve(__dirname, `../data/${version}/data.json`);
const outputDir = path.resolve(__dirname, `../output/${version}`);
const outputPath = path.join(outputDir, 'mods.json');


/**
 * Removes unused top-level keys from the data object (classes, ascendancies, extra images, points).
 */
function removeUnusedKeys(data: Record<string, any>) {
    delete data.classes;
    delete data.alternate_ascendancies;
    delete data.extraImages;
    delete data.points;
}

/**
 * Writes the cleaned data to a compact JSON file and a gzip-compressed version for frontend use.
 */
function writeOutputFiles(data: Record<string, any>) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
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
    const raw = fs.readFileSync(inputPath, 'utf-8');
    const data = JSON.parse(raw);
    // todo: parse stats.json pour ne garder que les clé qu'on a besoin pour additions & replace '_rid' et 'Id', rename _rid en statId
    // todo: parse stat_description en fonction de ce qu'on vient de parser, puis réussir à le lire (split par description, filtrer celles qu'on a besoin, puis bonne chance)
    // todo: reformat ça bien pour avoir en sortie 1 json avec Statkey en clé, label en sortie (no care des trads). variable en %1 %2
    
    removeUnusedKeys(data);
}

if (require.main === module) {
    cleanData();
}
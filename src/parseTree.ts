import * as fs from 'fs';
import * as path from 'path';

const inputPath = path.resolve(__dirname, '../data/data.json');
const outputPath = path.resolve(__dirname, '../output/data.cleaned.json');
const allowedSprites = [
    'jewelRadius', 'line', 'frame', 'masteryInactive', 'groupBackground',
    'jewel', 'keystoneInactive', 'keystoneActive', 'background',
    'normalActive', 'notableActive', 'normalInactive', 'notableInactive'
];

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
 * Filters the sprites object to keep only allowed sprite categories.
 */
function filterSprites(data: Record<string, any>) {
    if (data.sprites && typeof data.sprites === 'object') {
        const filteredSprites: Record<string, any> = {};
        for (const key of allowedSprites) {
            if (key in data.sprites) {
                filteredSprites[key] = data.sprites[key];
            }
        }
        data.sprites = filteredSprites;
    }
}

/**
 * Cleans the nodes object:
 * - Removes nodes with ascendancyName
 * - Removes mastery-specific properties from mastery nodes
 * - Removes flavourText, recipe, grantedDexterity/Strength/Intelligence from other nodes
 */
function cleanNodes(data: Record<string, any>) {
    if (!data.nodes || typeof data.nodes !== 'object') return;
    const cleanedNodes: Record<string, any> = {};
    for (const [id, nodeRaw] of Object.entries(data.nodes)) {
        const node = nodeRaw as Record<string, any>;
        if ('ascendancyName' in node) continue;
        if (node.isMastery === true) {
            const { masteryEffects, activeEffectImage, activeIcon, ...rest } = node;
            cleanedNodes[id] = rest;
            continue;
        }
        const {
            flavourText,
            recipe,
            grantedDexterity,
            grantedStrength,
            grantedIntelligence,
            ...rest
        } = node;
        cleanedNodes[id] = rest;
    }
    data.nodes = cleanedNodes;
}

/**
 * Cleans 'in' and 'out' references in each node to only keep valid node IDs.
 */
function cleanNodeReferences(data: Record<string, any>) {
    const validNodeIds = new Set(Object.keys(data.nodes));
    for (const node of Object.values(data.nodes) as Record<string, any>[]) {
        if (Array.isArray(node.in)) {
            node.in = node.in.filter((id: string) => validNodeIds.has(id));
        }
        if (Array.isArray(node.out)) {
            node.out = node.out.filter((id: string) => validNodeIds.has(id));
        }
    }
}

/**
 * Cleans the groups object:
 * - Removes node IDs that were deleted
 * - Removes groups with no remaining nodes
 */
function cleanGroups(data: Record<string, any>) {
    if (!data.groups || typeof data.groups !== 'object') return;
    const validNodeIds = new Set(Object.keys(data.nodes));
    for (const [groupId, groupRaw] of Object.entries(data.groups)) {
        const group = groupRaw as Record<string, any>;
        if (Array.isArray(group.nodes)) {
            group.nodes = group.nodes.filter((id: string) => validNodeIds.has(id));
            if (group.nodes.length === 0) {
                delete data.groups[groupId];
            }
        }
    }
}

/**
 * Filters sprite coordinates:
 * - Keeps only coordinates referenced by nodes (icon, inactiveIcon, activeIcon, activeEffectImage)
 * - Removes unused images and sprites
 */
function filterSpriteCoords(data: Record<string, any>) {
    if (!data.sprites || typeof data.sprites !== 'object') return;
    const usedCoords = new Set<string>();
    for (const node of Object.values(data.nodes) as Record<string, any>[]) {
        ['icon', 'inactiveIcon', 'activeIcon', 'activeEffectImage'].forEach(key => {
            if (node[key] && typeof node[key] === 'string') {
                usedCoords.add(node[key]);
            }
        });
    }
    for (const [spriteKey, spriteObj] of Object.entries(data.sprites)) {
        if (typeof spriteObj === 'object') {
            for (const [imgKey, imgData] of Object.entries(spriteObj)) {
                if (imgData && typeof imgData === 'object' && imgData.coords && typeof imgData.coords === 'object') {
                    for (const coordKey of Object.keys(imgData.coords)) {
                        if (!usedCoords.has(coordKey)) {
                            delete imgData.coords[coordKey];
                        }
                    }
                    if (Object.keys(imgData.coords).length === 0) {
                        delete spriteObj[imgKey];
                    }
                }
            }
            if (Object.keys(spriteObj).length === 0) {
                delete data.sprites[spriteKey];
            }
        }
    }
}

/**
 * Shortens image names by removing the common prefix from node image references and sprite coordinates.
 */
function shortenImageNames(data: Record<string, any>) {
    const prefix = 'Art/2DArt/SkillIcons/passives/';
    for (const node of Object.values(data.nodes) as Record<string, any>[]) {
        ['icon', 'inactiveIcon', 'activeIcon', 'activeEffectImage'].forEach(key => {
            if (node[key] && typeof node[key] === 'string' && node[key].startsWith(prefix)) {
                node[key] = node[key].slice(prefix.length);
            }
        });
    }
    if (data.sprites && typeof data.sprites === 'object') {
        for (const spriteObj of Object.values(data.sprites)) {
            if (typeof spriteObj === 'object') {
                for (const imgData of Object.values(spriteObj)) {
                    if (imgData && typeof imgData === 'object' && imgData.coords && typeof imgData.coords === 'object') {
                        const newCoords: Record<string, any> = {};
                        for (const coordKey of Object.keys(imgData.coords)) {
                            if (coordKey.startsWith(prefix)) {
                                newCoords[coordKey.slice(prefix.length)] = imgData.coords[coordKey];
                            } else {
                                newCoords[coordKey] = imgData.coords[coordKey];
                            }
                        }
                        imgData.coords = newCoords;
                    }
                }
            }
        }
    }
}

/**
 * Writes the cleaned data to a compact JSON file and a gzip-compressed version for frontend use.
 */
function writeOutputFiles(data: Record<string, any>) {
    fs.writeFileSync(outputPath, JSON.stringify(data), 'utf-8');
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
    removeUnusedKeys(data);
    filterSprites(data);
    cleanNodes(data);
    cleanNodeReferences(data);
    cleanGroups(data);
    filterSpriteCoords(data);
    shortenImageNames(data);
    writeOutputFiles(data);
}

if (require.main === module) {
    cleanData();
}
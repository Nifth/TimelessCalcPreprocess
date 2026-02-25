# TimelessCalcPreprocess

Preprocessor for TimelessCalc - transforms Path of Exile Passive Skill Tree data into a compact, optimized format for Timeless Jewel calculations.

## Installation

```bash
npm install
```

## Prerequisites

Before running the scripts, you need to obtain and place data files in the `data/` directory.

### Data Files Required

Create a version-specific directory (e.g., `data/3.27/`) and add the following files:

#### From [GGG skilltree-export](https://github.com/grindinggear/skilltree-export/releases)

Download the release for your game version and extract:

- `data.json` - Complete passive skill tree data
- `assets/` - Folder containing images and sprites (optional)

#### From [poe-dat-viewer](https://snosme.github.io/poe-dat-viewer/)

Export the following from the `data/` folder (convert `.datc64` files to JSON):

- `alternatepassiveadditions.json` - Alternate passive skill additions
- `alternatepassiveskills.json` - Alternate passive skills replacements
- `stats.json` - Game stat definitions

Export from `metadata/statdescriptions/`:

- `stat_descriptions.txt` - Stat translation descriptions

## Usage

All scripts accept a version argument (e.g., `3.27`). If not provided, defaults to `default`.

```bash
npm run parse-tree <version>
npm run generate-mods <version>
npm run jewels <version>
```

### Command Descriptions

#### `npm run parse-tree <version>`

Parses and cleans the passive skill tree data from `data/<version>/data.json`.

**What it does:**
- Removes unused data (classes, ascendancies, extra images)
- Filters out ascendancy nodes, proxy nodes, and blighted nodes
- Cleans mastery-specific properties
- Removes unused sprite coordinates and images
- Calculates node positions based on orbit data
- Generates socket node relationships for jewel placements

**Output:** `output/<version>/tree.json`

---

#### `npm run generate-mods <version>`

Generates translation mappings and jewel stat data.

**What it does:**
- Extracts stat IDs from alternate passive skills
- Parses stat definitions and translates descriptions
- Creates a translation map for jewel mods
- Generates jewel stat lists by jewel type (vaal, karui, maraketh, templar, eternal)

**Output:** 
- `output/<version>/translation.json`
- `output/<version>/jewelstats.json`

---

#### `npm run jewels <version>`

Generates all possible Timeless Jewel seed variations.

**What it does:**
- Loads the cleaned tree data and mod files
- Iterates through all seed values for each jewel type:
  - Glorious Vanity (vaal): 100-8000
  - Lethal Pride (karui): 10000-18000
  - Brutal Restraint (maraketh): 500-8000
  - Militant Faith (templar): 2000-10000
  - Elegant Hubris (eternal): 2000-160000
- Calculates passive skill replacements and additions for each seed
- Organizes results by socket node ID
- Compresses output as gzip for efficiency

**Output:** `output/<version>/<jewel_name>-<socket_id>.jsonl.gz` (one file per socket per jewel type)

## Workflow

Run commands in this order:

```bash
# 1. Parse and clean the tree data
npm run parse-tree 3.27

# 2. Generate translations and jewel stats
npm run generate-mods 3.27

# 3. Generate all jewel seed data (this takes time)
npm run jewels 3.27
```

## Output

All generated files are placed in `output/<version>/`:

- `tree.json` - Cleaned skill tree
- `translation.json` - Stat translation mappings
- `jewelstats.json` - Jewel type stat lists
- `*.jsonl.gz` - Compressed jewel seed data by socket

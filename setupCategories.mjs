import fs from 'fs';
import path from 'path';

const CORPORA_BASE_URL = 'https://raw.githubusercontent.com/dariusk/corpora/master/data';

const CATEGORIES = {
  animals: `${CORPORA_BASE_URL}/animals/common.json`,
  fruits: `${CORPORA_BASE_URL}/foods/fruits.json`,
  vegetables: `${CORPORA_BASE_URL}/foods/vegetables.json`,
};

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'dictionary', 'categories');

async function setupCategories() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const [name, url] of Object.entries(CATEGORIES)) {
    console.log(`Fetching ${name}...`);
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Each file in corpora usually has an array property corresponding to its name (e.g. data.animals)
      // We will look for an array inside the JSON.
      let rawArray = [];
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          rawArray = rawArray.concat(data[key]);
        }
      }

      if (rawArray.length === 0 && Array.isArray(data)) {
        rawArray = data;
      }

      // Filter: single word, lowercase, deduped
      const filtered = rawArray
        .map(w => w.toString().trim().toLowerCase())
        .filter(w => w.length >= 2 && /^[a-z]+$/.test(w));
      
      const uniqueWords = [...new Set(filtered)];

      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${name}.json`),
        JSON.stringify(uniqueWords, null, 2)
      );
      console.log(`Saved ${name}.json with ${uniqueWords.length} words.`);
    } catch (e) {
      console.error(`Failed to process ${name}:`, e);
    }
  }
}

setupCategories();

import fs from 'fs';

const raw = fs.readFileSync('public/dictionary/words.txt', 'utf8');
const words = raw
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => 
    w.length >= 2 &&           // no single letters
    w.length <= 15 &&          // cap absurdly long words
    /^[a-z]+$/.test(w)         // alphabetic only, no hyphens/apostrophes
  );

fs.writeFileSync(
  'public/dictionary/words-filtered.txt', 
  [...new Set(words)].join('\n')
);

console.log(`Filtered to ${words.length} words`);

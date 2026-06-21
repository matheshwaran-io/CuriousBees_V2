const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/app/(portal)/scholar/feed/page.tsx',
  'apps/web/src/components/feed/FeedComments.tsx',
  'apps/web/src/components/feed/FeedFAB.tsx'
];

files.forEach(file => {
  const fullPath = path.resolve('/Users/maddy/Current Project/Curious Bees/CuriousBees_V2', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace hex colors
    content = content.replace(/#6D28D9/g, '#0C4DA2');
    content = content.replace(/#5b21b6/g, '#042654');
    
    // Replace indigo classes
    content = content.replace(/indigo-400/g, 'blue-400');
    content = content.replace(/indigo-500/g, 'blue-500');
    content = content.replace(/indigo-600/g, 'blue-600');
    content = content.replace(/indigo-700/g, 'blue-700');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated colors in ${file}`);
  }
});

const fs = require('fs');
const path = require('path');

const dir = 'apps/web/src';

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let newContent = content
        .replace(/'FACULTY'/g, "'RESEARCH_SUPERVISOR'")
        .replace(/"FACULTY"/g, '"RESEARCH_SUPERVISOR"')
        .replace(/FACULTY:/g, "RESEARCH_SUPERVISOR:")
        .replace(/'PHD_SCHOLAR'/g, "'RESEARCH_SCHOLAR'")
        .replace(/"PHD_SCHOLAR"/g, '"RESEARCH_SCHOLAR"')
        .replace(/PHD_SCHOLAR:/g, "RESEARCH_SCHOLAR:")
        .replace(/'ADMIN'/g, "'INSTITUTION_ADMIN'")
        .replace(/"ADMIN"/g, '"INSTITUTION_ADMIN"')
        .replace(/ADMIN:/g, "INSTITUTION_ADMIN:")
        .replace(/\.isApproved/g, ".approved")
        .replace(/isApproved:/g, "approved:");

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walk(dir);
console.log('Done.');

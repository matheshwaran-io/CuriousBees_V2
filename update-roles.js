const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') walk(dirPath, callback);
    } else if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx') || dirPath.endsWith('.js')) {
      callback(dirPath);
    }
  });
}

function updateRoles() {
  const dirs = ['./apps/api/src', './apps/api/prisma', './apps/web/src', './packages'];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      walk(dir, (filePath) => {
        let content = fs.readFileSync(filePath, 'utf-8');
        let newContent = content
          .replace(/RESEARCH_SUPERVISOR/g, 'SUPERVISOR')
          .replace(/RESEARCH_SCHOLAR/g, 'SCHOLAR')
          .replace(/INSTITUTION_ADMIN/g, 'INSTITUTE_ADMIN');
        if (content !== newContent) {
          fs.writeFileSync(filePath, newContent, 'utf-8');
          console.log('Updated ' + filePath);
        }
      });
    }
  });
}
updateRoles();

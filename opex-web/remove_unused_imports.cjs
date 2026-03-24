const fs = require('fs');

function removeUnusedImports(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // A very simple regex to find imports from lucide-react
  const lucideMatch = content.match(/import \{([\s\S]*?)\} from 'lucide-react';/);
  if (lucideMatch) {
    const imports = lucideMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    const usedImports = imports.filter(imp => {
      // Check if the import is used elsewhere in the file
      const regex = new RegExp(`\\b${imp}\\b`, 'g');
      const matches = content.match(regex);
      return matches && matches.length > 1; // 1 for the import itself
    });
    
    if (usedImports.length !== imports.length) {
      const newImportStr = `import {\n  ${usedImports.join(',\n  ')}\n} from 'lucide-react';`;
      content = content.replace(lucideMatch[0], newImportStr);
    }
  }
  
  fs.writeFileSync(file, content);
}

['src/App.tsx', 'src/views/components.tsx', 'src/views/pages.tsx'].forEach(removeUnusedImports);
console.log('Done');

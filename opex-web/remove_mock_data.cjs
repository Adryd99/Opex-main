const fs = require('fs');

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf-8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(file, content);
}

// 1. App.tsx
replaceInFile('src/App.tsx', [
  [/import { TRANSACTIONS } from '\.\/models\/mockData';\n/g, ''],
  [/TRANSACTIONS\.slice\(0, 5\)/g, '[]'],
  [/TRANSACTIONS/g, '[]']
]);

// 2. views/components.tsx
replaceInFile('src/views/components.tsx', [
  [/import { PERIOD_DATA, TRANSACTIONS, MOCK_NOTIFICATIONS, ACCOUNTS } from '\.\.\/models\/mockData';\n/g, ''],
  [/MOCK_NOTIFICATIONS/g, '[]'],
  [/TRANSACTIONS\.slice\(0, 5\)/g, '[]'],
  [/TRANSACTIONS/g, '[]'],
  [/const data = useMemo\(\(\) => PERIOD_DATA\[period\] \|\| PERIOD_DATA\['Month'\], \[period\]\);/g, 'const data = useMemo(() => [], [period]);'],
  [/ACCOUNTS/g, 'accounts'],
]);

// Add accounts array to components.tsx
let componentsContent = fs.readFileSync('src/views/components.tsx', 'utf-8');
const accountsCode = `
const accounts = [
  { id: 'all', name: 'All Accounts', icon: 'A', color: 'bg-opex-dark', type: 'Combined' },
  { id: 'bunq', name: 'Bunq Bank', icon: 'B', color: 'bg-opex-teal', type: 'Personal' },
  { id: 'rabobank', name: 'Rabobank', icon: 'R', color: 'bg-orange-600', type: 'Business' },
  { id: 'revolut', name: 'Revolut', icon: 'Rv', color: 'bg-black', type: 'Business' },
];
`;
componentsContent = componentsContent.replace(/import { Account } from '\.\.\/models\/types';/, `import { Account } from '../models/types';\n${accountsCode}`);
fs.writeFileSync('src/views/components.tsx', componentsContent);


// 3. views/pages.tsx
replaceInFile('src/views/pages.tsx', [
  [/import { TRANSACTIONS, MOCK_INVOICES, MOCK_QUOTES } from '\.\.\/models\/mockData';\n/g, ''],
  [/TRANSACTIONS\.filter/g, '[].filter'],
  [/TRANSACTIONS\.slice\(0, 5\)/g, '[]'],
  [/typeof TRANSACTIONS/g, 'any[]'],
  [/TRANSACTIONS/g, '[]'],
  [/MOCK_INVOICES/g, '[]'],
  [/MOCK_QUOTES/g, '[]']
]);

console.log('Done');

import fs from 'fs';
import path from 'path';

const testDir = path.join(process.cwd(), 'tests', 'e2e');
const files = fs.readdirSync(testDir);

for (const file of files) {
  if (!file.endsWith('.ts')) continue;
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('3049')) {
    content = content.replace(/3049/g, '3000');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}

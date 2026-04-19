import fs from 'fs';
import path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src/pages');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Header paddings
  let newContent = content.replace(/pb-6 pt-8 px-8/g, 'px-6 py-5');
  newContent = newContent.replace(/pb-4 pt-6 px-8/g, 'px-6 py-5');
  newContent = newContent.replace(/pb-4 pt-6 px-6/g, 'px-6 py-5');
  
  // Content paddings
  newContent = newContent.replace(/pt-6 px-8/g, 'p-6');
  newContent = newContent.replace(/pt-8 pb-8 px-8/g, 'p-6');
  newContent = newContent.replace(/p-8/g, 'p-6');
  newContent = newContent.replace(/pt-6 px-6 pb-6/g, 'p-6');
  newContent = newContent.replace(/p-6 pt-6/g, 'p-6');

  // Some text sizes in headers (Make Card titles text-lg instead of text-xl if they have an icon, unless main header)
  // Actually, Shadcn default is text-2xl font-semibold. Let's just standardise the spacing first.

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed spacing in', file);
  }
});

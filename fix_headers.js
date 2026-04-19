const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
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
  if (content.includes('className="bg-[#d36101]') || content.includes('className={\`pb-4 pt-6 px-6 border-b border-white/10 ${user.role === \'ADMIN\' ? \'bg-[#4a2000]\' : \'bg-[#d36101]\'}\`}')) {
    content = content.replace(/className="bg-\[#d36101\]/g, 'className="rounded-t-[24px] bg-[#d36101]');
    content = content.replace(/className="flex flex-row items-center justify-between space-y-0 pb-6 pt-8 px-8 bg-\[#d36101\]/g, 'className="rounded-t-[24px] flex flex-row items-center justify-between space-y-0 pb-6 pt-8 px-8 bg-[#d36101]');
    
    // For AdminUsers
    content = content.replace(
      /className=\{\`pb-4 pt-6 px-6 border-b border-white\/10 \$\{user\.role === 'ADMIN' \? 'bg-\[#4a2000\]' : 'bg-\[#d36101\]'\}\`\}/g,
      "className={`rounded-t-[24px] pb-4 pt-6 px-6 border-b border-white/10 ${user.role === 'ADMIN' ? 'bg-[#4a2000]' : 'bg-[#d36101]'}`}"
    );

    // For dashboard left-aligned ones
     content = content.replace(/className="flex flex-row items-center justify-start bg-\[#d36101\]/g, 'className="rounded-t-[24px] flex flex-row items-center justify-start bg-[#d36101]');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});

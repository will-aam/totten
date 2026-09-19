const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

const targetDirs = ['app/(private)/admin', 'components'];

let modifiedCount = 0;

targetDirs.forEach(dir => {
  walk(dir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We want to remove all rounded-* classes ONLY inside <Button, <Input, <Textarea, <SelectTrigger tags.
    // We match the tag from <Tag to the closing >
    // Note: this won't perfectly match tags with nested > like arrows in functions, but for className it usually works if we're careful.
    // A safer way is to match className="..." or className={...}
    
    content = content.replace(/<(Button|Input|Textarea|SelectTrigger|SelectContent)([^>]*?)className=(["'{])([\s\S]*?)(["'}])/g, (match, tag, before, openQuote, classNames, closeQuote) => {
        
        let newClassNames = classNames.replace(/\brounded-(?:sm|md|lg|xl|2xl|3xl|full|none)\b/g, '').replace(/\brounded\b/g, '').replace(/\s+/g, ' ').trim();
        
        // If it's the SelectContent, we want it to be rounded-2xl to match the input.
        if (tag === 'SelectContent') {
            if (!newClassNames.includes('rounded-')) {
                newClassNames += ' rounded-2xl';
            }
        }

        return '<' + tag + before + 'className=' + openQuote + newClassNames + closeQuote;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Modified: ' + filePath);
    }
  });
});

console.log('Total files modified: ' + modifiedCount);

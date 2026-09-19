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
    
    const tagsToClean = ['Input', 'Button', 'Textarea', 'SelectTrigger', 'SelectContent'];
    
    tagsToClean.forEach(tag => {
        let searchString = '<' + tag;
        let index = content.indexOf(searchString);
        
        while (index !== -1) {
            let i = index + searchString.length;
            let openBraces = 0;
            let openAngles = 1;
            let inString = false;
            let stringChar = '';
            
            while (i < content.length && openAngles > 0) {
                let c = content[i];
                if (!inString) {
                    if (c === '"' || c === "'" || c === '') {
                        inString = true;
                        stringChar = c;
                    } else if (c === '{') {
                        openBraces++;
                    } else if (c === '}') {
                        openBraces--;
                    } else if (c === '<' && openBraces === 0) {
                        openAngles++;
                    } else if (c === '>' && openBraces === 0) {
                        openAngles--;
                    }
                } else {
                    if (c === stringChar && content[i-1] !== '\\') {
                        inString = false;
                    }
                }
                i++;
            }
            
            let tagContent = content.substring(index, i);
            let originalTagContent = tagContent;
            
            tagContent = tagContent.replace(/className=(["'{])([\s\S]*?)(["'}])/g, (match, openQuote, classNames, closeQuote) => {
                let newClassNames = classNames.replace(/\brounded-(?:sm|md|lg|xl|2xl|3xl|full|none)\b/g, '').replace(/\brounded\b/g, '').replace(/\s+/g, ' ').trim();
                if (tag === 'SelectContent' && !newClassNames.includes('rounded-')) {
                    newClassNames += ' rounded-2xl';
                }
                return 'className=' + openQuote + newClassNames + closeQuote;
            });
            
            if (tagContent !== originalTagContent) {
                content = content.substring(0, index) + tagContent + content.substring(i);
                // Adjust index to account for replaced string length
                index += tagContent.length - originalTagContent.length;
            }
            index = content.indexOf(searchString, index + 1);
        }
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Modified: ' + filePath);
    }
  });
});
console.log('Total files modified: ' + modifiedCount);

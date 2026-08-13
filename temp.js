const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/will0/OneDrive/Desktop/totten/app/(private)/admin/custom-page/_components/professional-site/professional-site-view.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const newContent = `  // Mobile Preview específico do Site Profissional
  const ProSiteMockup = ({ isFullScreen = false }: { isFullScreen?: boolean }) => {
    if (isFullScreen) {
      return (
        <div className="w-full h-full relative bg-background">
          <iframe src={\`/\${profile?.slug || 'serenita'}?preview=true\`} className="w-full h-full border-none" />
        </div>
      );
    }

    return (
      <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto">
        <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 rounded-b-2xl w-40 mx-auto" />
        <iframe src={\`/\${profile?.slug || 'serenita'}?preview=true\`} className="w-full h-[calc(100%-16px)] mt-2 rounded-[2.5rem] bg-white border-none" />
      </div>
    );
  };`;

const startIdx = 122; // 0-indexed line 123
const endIdx = 633; // 0-indexed line 634

lines.splice(startIdx, endIdx - startIdx + 1, newContent);

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Done');

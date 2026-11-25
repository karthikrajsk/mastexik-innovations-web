import fs from 'fs';

const content = fs.readFileSync('src/pages/masters/fabric-master.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('fabricQuality')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});

import fs from 'fs';
import path from 'path';

// Read the sample index.html
const htmlPath = '/home/sabbir/projects/react/live-tv/aa_sample/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract the script tag content
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!scriptMatch) {
  console.error('No script tag found!');
  process.exit(1);
}

const scriptContent = scriptMatch[1];
console.log('Script length:', scriptContent.length);

// Let's write the obfuscated script to a temp file for inspection or running
fs.writeFileSync('/home/sabbir/projects/react/live-tv/obfuscated_raw.js', scriptContent);
console.log('Saved obfuscated script to obfuscated_raw.js');

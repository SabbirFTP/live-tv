import fs from 'fs';

const rawCode = fs.readFileSync('/home/sabbir/projects/react/live-tv/obfuscated_raw.js', 'utf8');

// The obfuscated script has:
// 1. function _0x4d2f() { ... }
// 2. function _0x495f(a, b) { ... }
// 3. (function(a, b) { ... })(_0x4d2f, 0x...)
// 4. The rest of the code.

// Let's extract these parts.
// We can use a regex to capture the array function, the decoder function, and the rotation IIFE.
const partsMatch = rawCode.match(/^(function _0x4d2f\(\)[\s\S]*?return _0x4d2f\(\);\}\(\));/);
// Wait, the rotation IIFE is right after the function _0x495f. Let's look at the structure.
// Let's capture the first few blocks of code.
// Let's look at the structure we saw:
// function _0x4d2f(){...}
// function _0x495f(a,b){...}
// (function(a,b){...})(_0x4d2f, 0x...)

// We can extract everything up to the end of the IIFE. The IIFE ends with something like `(_0x4d2f,-0x4*-0x4fee0+-0xd7*0x187d+0xe66c9),` or similar, followed by `(function(){...})` or similar.
// Let's write a parser that takes the first few function blocks and IIFE and runs them in a context,
// then replaces the decoder function calls in the rest of the script.

// Let's find the boundary of the setup code. The setup code ends with the IIFE rotation.
// The IIFE rotation looks like: `(_0x4d2f,-0x4*-0x4fee0+-0xd7*0x187d+0xe66c9),`
// Let's find where the decoder function `_0x495f` is defined and where the rotation is.
// Actually, let's extract the setup code by matching up to the end of the rotation IIFE.
const setupMatch = rawCode.match(/^([\s\S]*?\(_0x4d2f,\s*[^)]+?\)\);?)/);
if (!setupMatch) {
  console.error("Could not extract setup block!");
  process.exit(1);
}

const setupCode = setupMatch[1];
console.log('Setup code length:', setupCode.length);

// Now, we can run this setup code in a VM or eval to define _0x495f.
// Let's evaluate it:
const evalContext = {};
// We'll run it in global scope of our eval.
// We need to define _0x495f in global context.
let decoderFn;
try {
  // We eval the setupCode. It defines _0x4d2f, _0x495f, and runs the IIFE.
  // We can wrap it to return _0x495f.
  const runCode = setupCode + "\nglobalThis._0x495f = _0x495f;";
  eval(runCode);
  decoderFn = globalThis._0x495f;
  console.log('Decoder function successfully evaluated!');
} catch (e) {
  console.error('Failed to evaluate setup code:', e);
  process.exit(1);
}

// Now we want to find all calls to _0x495f in the remaining code.
// The remaining code starts after the setupCode.
const remainingCode = rawCode.substring(setupCode.length);

// We need to match calls like `_0x495f(0x3ee)` or `_0x495f(0x27a, 'ss')`
// Let's write a regex that matches `_0x495f\(\s*(0x[0-9a-fA-F]+|-?0x[0-9a-fA-F]+)(?:,\s*([^)]+))?\s*\)`
// Note that some calls might have expressions, but usually they are just hex numbers and sometimes string literals.
// Let's replace them one by one.
let replacedCode = remainingCode;

// Regex to find _0x495f calls
const callRegex = /_0x495f\(\s*(0x[0-9a-fA-F]+|-?0x[0-9a-fA-F]+)(?:,\s*('[^']+'|"[^"]+"))?\s*\)/g;

let count = 0;
replacedCode = replacedCode.replace(callRegex, (match, hexArg, strArg) => {
  try {
    const val1 = parseInt(hexArg, 16);
    let result;
    if (strArg) {
      // It has a second argument (e.g. key for RC4 or string)
      const val2 = eval(strArg); // safe since it's a string literal
      result = decoderFn(val1, val2);
    } else {
      result = decoderFn(val1);
    }
    count++;
    return JSON.stringify(result);
  } catch (err) {
    console.error(`Failed to decode match: ${match}`, err);
    return match;
  }
});

console.log(`Replaced ${count} obfuscated strings.`);

// Write the deobfuscated code to a file
fs.writeFileSync('/home/sabbir/projects/react/live-tv/deobfuscated_strings.js', setupCode + '\n' + replacedCode);
console.log('Saved deobfuscated strings to deobfuscated_strings.js');

const fs = require('fs');
const s = fs.readFileSync('变更管理.html', 'utf8');
const blocks = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let ok = true;
blocks.forEach((b, i) => {
  try { new Function(b); }
  catch (e) { ok = false; console.log('script#' + (i + 1) + ' SYNTAX ERROR: ' + e.message); }
});
console.log(ok ? ('变更管理.html: ALL ' + blocks.length + ' SCRIPTS OK') : '变更管理.html: FAILED');

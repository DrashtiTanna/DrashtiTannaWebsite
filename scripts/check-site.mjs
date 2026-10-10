import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'projects/xenia-lunapark/index.html', 'projects/xenia-lunapark/explore.html', 'projects/beyond-the-boundaries/index.html', 'projects/beyond-the-boundaries/explore.html'];
let references = 0;

for (const page of pages) {
  const html = readFileSync(resolve(root, page), 'utf8');
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
  for (const [, value] of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) continue;
    const [path, fragment] = value.split('#');
    const destination = resolve(root, dirname(page), decodeURIComponent(path.split('?')[0] || ''));
    if (path) assert.ok(existsSync(destination), `${page}: missing ${path}`);
    if (!path && fragment) assert.ok(ids.includes(fragment), `${page}: missing #${fragment}`);
    references += 1;
  }
}

// The homepage uses explicit closing tags. Catch accidental nesting damage
// when its CV or contact content is edited; leave legacy project markup alone.
const homepage = readFileSync(resolve(root, 'index.html'), 'utf8');
const markup = homepage.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const stack = [];
for (const match of markup.matchAll(/<\/?([a-z][a-z\d:-]*)\b[^>]*>/gi)) {
  const tag = match[1].toLowerCase();
  if (voidTags.has(tag) || /\/\s*>$/.test(match[0])) continue;
  if (match[0].startsWith('</')) assert.equal(stack.pop(), tag, `index.html: mismatched closing ${tag}`);
  else stack.push(tag);
}
assert.equal(stack.length, 0, `index.html: unclosed tags ${stack.join(', ')}`);
assert.equal([...homepage.matchAll(/<h1\b/gi)].length, 1, 'index.html: expected one main heading');
for (const script of ['shared/js/home.js', 'shared/js/terrain.js']) {
  const check = spawnSync(process.execPath, ['--check', resolve(root, script)], { encoding: 'utf8' });
  assert.equal(check.status, 0, `${script}: ${check.stderr}`);
}
console.log(`Passed: ${pages.length} pages, ${references} local references, homepage structure, and JavaScript syntax.`);

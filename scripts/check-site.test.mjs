import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const page of ['index.html', 'projects/xenia-lunapark/index.html', 'projects/beyond-the-boundaries/index.html']) {
  test(`${page} does not reintroduce the removed 3D entry buttons`, () => {
    const html = readFileSync(join(projectRoot, page), 'utf8');
    assert.doesNotMatch(html, /\b(?:Explore in 3D|Walk the (?:site|corridor) in 3D)\b/i);
  });
}

function fixture(t) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'portfolio-site-check-'));
  t.after(() => {
    // Only remove this test's newly created directory, never an input path.
    assert.equal(dirname(resolve(fixtureRoot)), resolve(tmpdir()));
    assert.ok(fixtureRoot.startsWith(join(tmpdir(), 'portfolio-site-check-')));
    rmSync(fixtureRoot, { recursive: true, force: true });
  });
  mkdirSync(join(fixtureRoot, 'scripts'));
  cpSync(join(projectRoot, 'scripts/check-site.mjs'), join(fixtureRoot, 'scripts/check-site.mjs'));
  for (const directory of ['projects/xenia-lunapark', 'projects/beyond-the-boundaries', 'shared/js', 'shared/css', 'shared/fonts', 'shared/assets', 'docs']) {
    mkdirSync(join(fixtureRoot, directory), { recursive: true });
  }
  // Small self-contained site: no CV data or production images enter temp.
  writeFileSync(join(fixtureRoot, 'index.html'), '<!doctype html><html><head><title>Fixture</title></head><body><main id="main"><h1>Fixture</h1><a href="#main">Home</a><img src="shared/assets/test.png"><script src="shared/js/home.js"></script></main></body></html>');
  for (const page of ['projects/xenia-lunapark/index.html', 'projects/xenia-lunapark/explore.html', 'projects/beyond-the-boundaries/index.html', 'projects/beyond-the-boundaries/explore.html']) {
    writeFileSync(join(fixtureRoot, page), '<html><body><a href="../../index.html">Home</a></body></html>');
  }
  writeFileSync(join(fixtureRoot, 'shared/assets/test.png'), 'fixture asset');
  writeFileSync(join(fixtureRoot, 'shared/js/home.js'), '(() => {})();');
  writeFileSync(join(fixtureRoot, 'shared/js/terrain.js'), '(() => {})();');
  return fixtureRoot;
}

function runChecker(fixtureRoot) {
  return spawnSync(process.execPath, [join(fixtureRoot, 'scripts/check-site.mjs')], { encoding: 'utf8', timeout: 10000 });
}

function changeHome(fixtureRoot, change) {
  const path = join(fixtureRoot, 'index.html');
  writeFileSync(path, change(readFileSync(path, 'utf8')));
}

test('a valid site passes', t => {
  const result = runChecker(fixture(t));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Passed: 5 pages/);
});

test('a missing local asset is rejected', t => {
  const root = fixture(t);
  changeHome(root, html => html.replace('test.png', 'missing.png'));
  const result = runChecker(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing shared\/assets\/missing\.png/);
});

test('duplicate IDs are rejected', t => {
  const root = fixture(t);
  changeHome(root, html => html.replace('<h1>', '<h1 id="main">'));
  const result = runChecker(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate IDs/);
});

test('missing same-page anchors are rejected', t => {
  const root = fixture(t);
  changeHome(root, html => html.replace('href="#main"', 'href="#missing"'));
  const result = runChecker(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing #missing/);
});

test('damaged homepage nesting is rejected', t => {
  const root = fixture(t);
  changeHome(root, html => html.replace('</main>', '</section>'));
  const result = runChecker(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mismatched closing section/);
});

test('invalid homepage JavaScript is rejected', t => {
  const root = fixture(t);
  writeFileSync(join(root, 'shared/js/terrain.js'), 'const broken = ;');
  const result = runChecker(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /shared\/js\/terrain\.js/);
});

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

require('dotenv').config();

const root = __dirname;
const curriculum = path.join(root, 'curriculum');
const outFile = path.join(root, 'cachedLatestNotes.json');
const dayCount = 5;
const skipNames = new Set(['sortspec.md', 'readme.md']);

function viewerRoot() {
  try {
    return path.resolve(execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());
  } catch (err) {
    return path.resolve(root);
  }
}

function ownNotesRepo(dir) {
  if (!dir || !fs.existsSync(dir)) return null;
  let toplevel = '';
  try {
    toplevel = path.resolve(execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());
  } catch (err) {
    return null;
  }
  if (toplevel === viewerRoot()) return null;
  return {
    gitDir: path.join(toplevel, '.git'),
    workTree: path.resolve(dir),
    label: path.resolve(dir)
  };
}

function notesRepo() {
  const curriculumGit = path.join(curriculum, '.git');
  if (fs.existsSync(curriculumGit)) {
    return { gitDir: curriculumGit, workTree: curriculum, label: 'curriculum' };
  }
  const fromEnv = process.env.DIR_SNIPPETS ? path.resolve(process.env.DIR_SNIPPETS) : '';
  return ownNotesRepo(fromEnv);
}

function write(groups, source) {
  fs.writeFileSync(outFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    days: dayCount,
    source: source,
    groups: groups
  }, null, 2) + '\n');
}

function dateLabel(dateKey) {
  const parts = dateKey.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function titlesFromLog(raw) {
  const seen = new Set();
  const groups = [];
  String(raw).split('\x1e').forEach((record) => {
    const lines = record.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;
    const iso = lines[0];
    if (!/^\d{4}-\d{2}-\d{2}T/.test(iso)) return;
    const titles = [];
    lines.slice(1).forEach((filePath) => {
      const base = path.basename(filePath);
      if (!/\.md$/i.test(base) || skipNames.has(base.toLowerCase())) return;
      const title = base.replace(/\.md$/i, '').trim();
      const key = title.toLowerCase();
      if (!title || seen.has(key)) return;
      seen.add(key);
      titles.push(title);
    });
    if (!titles.length) return;
    const dateKey = iso.slice(0, 10);
    let group = groups.find((item) => item.dateKey === dateKey);
    if (!group) {
      group = { dateKey: dateKey, dateLabel: dateLabel(dateKey), notes: [] };
      groups.push(group);
    }
    group.notes.push.apply(group.notes, titles);
  });
  return groups;
}

function main() {
  const repo = notesRepo();
  if (!repo) {
    console.warn('cache_latest_notes: curriculum/ is not its own git repo, and the notes folder is not one either. The viewer repository was not used. Wrote an empty list.');
    write([], 'none');
    process.exit(0);
  }

  const since = new Date(Date.now() - dayCount * 24 * 60 * 60 * 1000).toISOString();
  let raw = '';
  try {
    raw = execFileSync('git', [
      '--git-dir', repo.gitDir,
      '--work-tree', repo.workTree,
      'log',
      '--since', since,
      '--pretty=format:%x1e%cI',
      '--name-only',
      '--',
      '*.md'
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    console.error('cache_latest_notes: git log failed for ' + repo.label + '.');
    console.error(err.stderr || err.message);
    process.exit(1);
  }

  const groups = titlesFromLog(raw);
  write(groups, repo.label);
  const count = groups.reduce((sum, group) => sum + group.notes.length, 0);
  console.log('cache_latest_notes: ' + count + ' notes over the last ' + dayCount + ' days, from ' + repo.label + '.');
}

if (require.main === module) {
  main();
}

module.exports = { titlesFromLog };

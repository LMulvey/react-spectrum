const exec = require('child_process').execSync;
const spawn = require('child_process').spawnSync;
const fs = require('fs');

let packages = JSON.parse(exec('yarn workspaces info --json').toString().split('\n').slice(1, -2).join('\n'));

let commits = new Map();

// Diff each package individually. Some packages might have been skipped during last release,
// so we cannot simply look at the last tag on the whole repo.
for (let name in packages) {
  let filePath = packages[name].location + '/package.json';
  let pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!pkg.private) {
    // Diff this package since the last published version, according to the package.json.
    // The release script creates a tag for each package version.
    let tag = `${pkg.name}@${pkg.version}`;

    let args = [
      'log',
      `${tag}..HEAD`,
      '--pretty="%H%x00%aI%x00%an%x00%s"',
      packages[name].location,

      // filter out non-code changes
      ':!**/test/**',
      ':!**/stories/**',
      ':!**/chromatic/**'
    ];

    let res = spawn('git', args, {encoding: 'utf8'});
    if (res.stdout.length === 0) {
      continue;
    }

    for (let line of res.stdout.split('\n')) {
      if (line === '') {
        continue;
      }

      let info = line.replace(/^"|"$/g, '').split('\0');
      commits.set(info[0], info);
    }
  }
}

let sortedCommits = [...commits.values()].sort((a, b) => a[1] < b[1] ? -1 : 1);

for (let commit of sortedCommits) {
  let m = commit[3].match(/(.*?) \(#(\d+)\)$/);
  let message = m?.[1] || commit[3];
  let pr = m ? `https://github.com/adobe/react-spectrum/pull/${m[2]}` : null;
  console.log(`* ${message} - ${commit[2]}` + (pr ? ` - [PR](${pr})` : ''));
}

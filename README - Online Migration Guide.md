When: Changed remote hosting where your Obsidian notes will publish using the methodology established by the Brain Notes engine by Weng Fei Fung. Your local computer will push up to an online repo, also triggering a PHP backend on the remote server to pull and reset the changes into the online copy. Users can visit the frontend which renders the MD files as HTML.

Search:
Using `env/pcregrep.php.sample` as a template, create `pcregrep.php` with the correct pcregrep processs path. Find out the path by running `whereis pcregrep`. If process not found, you'll have to install it first (eg. Debian 12: `apt-get install pcregrep`)

Brains:
In the folder containing 3dbrain/, bizbrain/, devbrain/, healthbrain/ should have a package.json like this:
```
{
  "name": "notebrain-root",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "pull-brains": "cd 3dbrain && npm run pull && npm run build-3dbrain; cd ../bizbrain && npm run pull && npm run build-bizbrain; cd ../devbrain && npm run pull  && npm run build-devbrain; cd ../healthbrain && npm run pull && npm run build-healthbrain",
    "install-brains": "cd 3dbrain && npm run pull && npm install; cd ../bizbrain && npm run pull && npm install; cd ../devbrain && npm run pull && npm install; cd ../healthbrain && npm run pull && npm install",
    "help": "cat package.json | grep scripts -A 10"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```
^ Reminder: Purpose is that when you run `npm run pull-brains` at that level, all the brains will be updated by pulling from git and rendering the topics (remember the brain is the UI UX to display the curriculum files, not the curriculum files themselves). Hence when you're editing a brain (the ui ux), you make a commit, then push it up to Github.com, then finally you go into the folder containing all the brains to pull them in with `npm run pull-brains`.

Curriculum:
The curriculum path (because you're keeping curriculum in a separate git so people can contribute to your subject knowledge) should be adjusted at `.env` file of the brain.
- You have a copy of the curriculum folder at both your local computer and the remote server.
- For the local computer, you could have the curriculum folder inside a Obsidian Document Vaults folder. This is so you can push from computer when you make note changes.
- For the remote server, it's recommended you have a curriculum/ relative folder in the brain, and that curriculum/ folder is gitignored. This is so that curriculum/server-update.php can run shell git commands to pull from Github.com/Gitlab.com

The curriculum/ should contain server-update.php:
```
<?php
/* Curriculum repository of snippets, guides, and tutorials get pulled into this folder for the Brain Notes app (Like Notebook) */
/* Curriculum is separated as another repository for authoring and contribution purposes over Github and Obsidian MD */

/* Migration sensitive */
$npmBuildScript = "build-devbrain";

error_reporting(E_ALL);
ini_set('display_errors', 1);

$processUser = posix_getpwuid(posix_geteuid());
$user = $processUser['name'];
$dir = __DIR__;
$pwd = shell_exec("pwd");

$cdCommand = 'cd "' . $dir . '"';
$fetchAndResetCommand = 'git fetch origin; git reset --hard refs/remotes/origin/main';
$cdFetchAndResetCommand = $cdCommand . " && " . $fetchAndResetCommand;
$cdFetchAndResetCommandExec = shell_exec("$cdFetchAndResetCommand 2>&1");
$cdFetchAndResetCommandOutput = shell_exec('echo $?');

$gitOriginCommand = "git remote get-url origin";
$gitOriginCommandExec = shell_exec("$gitOriginCommand 2>&1");
$gitOriginCommandOutput = shell_exec('echo $?');

$nodeVersionCommand = "node -v";
$nodeVersionCommandExec = shell_exec("$nodeVersionCommand 2>&1");
$nodeVersionCommandOutput = shell_exec('echo $?');

$rebuildCommand = "cd .. && npm run $npmBuildScript";
$rebuildCommandExec = shell_exec("$rebuildCommand 2>&1");
$rebuildCommandOutput = shell_exec('echo $?');

echo "<h1>Updating notes online</h1>";
echo "<p>From Obsidian MD, you ran the npm deploy script which committed and pushed local curriculum changes to Github/Gitlab, then the npm script opened the online PHP script in the web browser. That online PHP script is part of the online curriculum repo and is pulling in curriculum updates from Github/Gitlab into the remote server, then the PHP script cd out into the note-reading app to rebuild the cached render for the online audience by running NodeJS scripts that build the PHP partial.</p><p></p>"
;
echo "<b>Shell user:</b> " . $user . "<p></p>";
echo "<b>PHP __DIR:</b> " . $dir . "<p></p>";
echo "<b>CWD:</b> " . $pwd . "<p></p><p></p>";

echo "<b>COMMAND cd, git fetch, git reset:</b> " . $cdFetchAndResetCommand . "<p></p>";
echo "<b>OUTPUT cd, git fetch, git reset:</b> " . $cdFetchAndResetCommandOutput . "<p></p><p></p>";

echo "<b>COMMAND git origin:</b> " . $gitOriginCommand . "<p></p>";
echo "<b>OUTPUT git origin:</b> " . $gitOriginCommandOutput; "<p></p><p></p>";

echo "<b>COMMAND NODE VERSION:</b> " . $nodeVersionCommand; "<p></p>";
echo "<b>OUTPUT NODE VERSION:</b> " . $nodeVersionCommandOutput; "<p></p><p></p>";

echo "<b>COMMAND BUILD CACHED RENDERING:</b> " . $rebuildCommand; "<p></p>";
echo "<b>OUTPUT BUILD CACHED RENDERING:</b> " . $rebuildCommandOutput; "<p></p><p></p>";

echo "<p></p><p></p>";
echo "<b>View:</b> <a href='../'>View web notes</a><p></p>";

// Server migration:
// Running shell command and it's permission denied? Get user and add it to the folder you're at
// [root@s97-74-232-20 curriculum]# sudo chown -R <process_user> ./
// [root@s97-74-232-20 curriculum]# sudo chmod -R 755 ./
// [root@s97-74-232-20 curriculum]# sudo find ./ -type f -exec chmod 644 {} \;

?>
```

Curriculum should contain package.json:
```
{
  "name": "curriculum",
  "version": "1.0.0",
  "description": "By Weng Fei Fung...",
  "main": "index.js",
  "scripts": {
    "commit": "git add -A; FILENAMES=$(git status --short | grep '^[^DR]' | awk '{for (i=2; i<=NF; i++) printf \"%s%s\", $i, (i==NF ? \"\\n\" : \" \")}' | while read -r file; do printf \"%s%s\\n\" \"\\x22\" \"$(basename \"$file\")\"; done | paste -sd ';' -); git commit -m \"$(echo $FILENAMES)\"",
    "old-commit(git commit message is long when you rename a folder because it'd list all their files)": "git add -A; FILENAMES=`git diff --cached --name-only | while read -r file; do basename \"$file\"; done | tr '\n' ','` && git commit -m \"New - $FILENAMES\";",
    "old-commit(shows full path)": "git add -A; FILENAMES=`git diff --cached --name-only | tr '\n' ';'` && git commit -m \"New - $FILENAMES\";",
    "old-commit(all commits called content update)": "git add -A; git commit -m 'Content update';",
    "push": "git push origin main;",
    "browserMac": "open \"https://wengindustries.com/app/devbrain/curriculum/server-update.php?secret=123\"",
    "browserPC":  "xdg-open \"https://wengindustries.com/app/devbrain/curriculum/server-update.php?secret=123\"",
    "browserLinux":  "start \"https://wengindustries.com/app/devbrain/curriculum/server-update.php?secret=123\"",    
    "deploy": "npm run commit; npm run push && npm run browserMac;"
  },
  "author": "",
  "license": "ISC"
}
```
^ Reminder: From your computer's local curriculum root folder after you've made not changes, you update the online copy by running `npm run deploy`. This will make a commit whose commit message is based on the files that have been changed, push the commit up Github.com/Gitlab.com, then open the php page server-update.php on the remote server, which will perform the pull and reset at the remote server's curriculum copy.
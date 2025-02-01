// Note this does not work recursively on local folder or remote folder. Don't need that functionality yet.

const fs = require('fs');
const path = require('path');
const { host,
        port,
        username,
        password,
        skipExistingFiles,
        silentOutput,
        remoteFolder,
        localFolder,
        logFilePath } = require('./config.json');

const Client = require('ssh2-sftp-client');
const sftp = new Client();
const SFTPConfig = {
  host,
  port,
  username,
  password
}

// Ensure folder paths end with "/"
if (!remoteFolder.endsWith('/')) {
  remoteFolder += '/';
}
if (!localFolder.endsWith('/')) {
  localFolder += '/';
}

function logMessage(message) {
  if (!silentOutput) {
    console.log(message);
  }
  fs.appendFileSync(logFilePath, message + '\n');
}

async function uploadFiles() {
  try {
    await sftp.connect(SFTPConfig);

    const localFiles = fs.readdirSync(localFolder).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
    logMessage(`Found ${localFiles.length} image(s) to upload.`);

    // Get a list of files in the remote directory
    const remoteFiles = await sftp.list(remoteFolder);
    const remoteFileNames = new Set(remoteFiles.map(file => file.name));

    for (const file of localFiles) {
      const localFilePath = path.join(localFolder, file);
      const remoteFilePath = `${remoteFolder}${file}`;

      if (remoteFileNames.has(file)) {
        if (skipExistingFiles) {
          logMessage(`Skipped existing file (skipExistingFiles=true): ${file}`);
          continue;
        } else {
          logMessage(`Overriding existing file (skipExistingFiles=false): ${file}`);
        }
      }

      await sftp.put(localFilePath, remoteFilePath);
      logMessage(`Uploaded file: ${file}`);
    }
  } catch (err) {
    logMessage('Error: ' + err);
  } finally {
    sftp.end();
  }
}

uploadFiles();

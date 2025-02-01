# 6-upload-diff-images

This script will upload pictures into your private server via SFTP protocol. It will be lean by getting a `ls` of all the files on your FTP, then find which files are missing in your Obsidian Document Vault's designated Attachment folder, and only upload those.

## Preliminary Setup
Run `npm install` to make sure `ssh2-sftp-client` is installed.

config.json:
```
{
    "host": "YOUR_SERVER_HOST_IP",
    "port": 22, // Default SFTP port
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD", // Or use privateKey instead of password
    "skipExistingFiles": true,
    "silentOutput": true,
    "remoteFolder": "YOUR_SERVER_ABS_PATH",
    "localFolder": "YOUR_LOCAL_ABS_PATH",
    "logFilePath": "./uploaded.log"
}
```

## Upload Diff Process

With the remoteFolder and localFolder correct, simply run the script.js. It will upload only the image files that aren't on your SFTP server yet.
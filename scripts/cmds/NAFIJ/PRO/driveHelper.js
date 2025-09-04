const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEYFILEPATH = path.join(__dirname, 'service-account.json'); // adjust if your JSON is elsewhere
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const FOLDER_ID = '17_trT29hUYjoNdVFoA0r-YQCQcEF-fwq'; // Replace with your Google Drive folder ID

async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
  return auth.getClient();
}

/**
 * Uploads a local file to Google Drive inside the folder set by FOLDER_ID.
 * @param {string} localFilePath - Path to the local file to upload
 * @returns {string} The uploaded file's Drive file ID
 */
async function uploadFile(localFilePath) {
  const authClient = await authenticate();
  const drive = google.drive({ version: 'v3', auth: authClient });

  const fileMetadata = {
    name: path.basename(localFilePath),
    parents: [FOLDER_ID],
  };

  const media = {
    mimeType: 'video/mp4',
    body: fs.createReadStream(localFilePath),
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });

  return res.data.id;
}

/**
 * Downloads a file from Google Drive by its file ID to a local path.
 * @param {string} fileId - The Drive file ID to download
 * @param {string} destPath - Local destination file path
 */
async function downloadFile(fileId, destPath) {
  const authClient = await authenticate();
  const drive = google.drive({ version: 'v3', auth: authClient });
  const dest = fs.createWriteStream(destPath);

  return new Promise((resolve, reject) => {
    drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
      (err, res) => {
        if (err) return reject(err);
        res.data
          .on('end', () => resolve())
          .on('error', reject)
          .pipe(dest);
      }
    );
  });
}

module.exports = {
  authenticate,
  uploadFile,
  downloadFile,
};
};

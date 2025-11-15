const fs = require('fs');
const path = require('path');

const oldUri = 'mongodb://restorenUser:1234@localhost:27017/restoren';
const newUri = 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin';
const oldDbName = 'restoren';
const newDbName = 'restaurant';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.ts')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const apiDir = path.join(__dirname, '..', 'app', 'api');
const files = getAllFiles(apiDir);

let updatedCount = 0;

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace MONGO_URI
  content = content.replace(new RegExp(oldUri.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUri);

  // Replace DB_NAME
  content = content.replace(/const DB_NAME = ['"]restoren['"]/g, `const DB_NAME = '${newDbName}'`);
  content = content.replace(/const DB_NAME = ["']restoren["']/g, `const DB_NAME = "${newDbName}"`);

  // Replace db.db('restoren')
  content = content.replace(/db\.db\(['"]restoren['"]\)/g, `db.db('${newDbName}')`);
  content = content.replace(/db\.db\(["']restoren["']\)/g, `db.db("${newDbName}")`);

  // Replace client.db('restoren')
  content = content.replace(/client\.db\(['"]restoren['"]\)/g, `client.db('${newDbName}')`);
  content = content.replace(/client\.db\(["']restoren["']\)/g, `client.db("${newDbName}")`);

  // Replace mongoClient.db('restoren')
  content = content.replace(/mongoClient\.db\(['"]restoren['"]\)/g, `mongoClient.db('${newDbName}')`);
  content = content.replace(/mongoClient\.db\(["']restoren["']\)/g, `mongoClient.db("${newDbName}")`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Updated: ${filePath}`);
  }
});

console.log(`\nTotal files updated: ${updatedCount}`);


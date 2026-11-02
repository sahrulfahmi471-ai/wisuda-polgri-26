const path = require('path');
const fs = require('fs');

// Ensure node_modules from both root and subfolder are resolvable in hosting & local environments
const rootModules = path.join(__dirname, 'node_modules');
const subModules = path.join(__dirname, 'proyek', 'node_modules');
[rootModules, subModules].forEach(p => {
  if (fs.existsSync(p) && !module.paths.includes(p)) {
    module.paths.unshift(p);
  }
});

// Forward to the main application server in 'proyek' directory
const subDir = path.join(__dirname, 'proyek');
if (fs.existsSync(subDir)) {
  process.chdir(subDir);
  require(path.join(subDir, 'server.js'));
} else {
  require('./proyek/server.js');
}

const electron = require("electron");
const path = require("path");
const fs = require("fs");

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath(
      "userData"
    );
    this.path = path.join(userDataPath, opts.configName + ".json");

    this.data = parseDataFile(this.path, opts.defaults);
  }

  get(key) {
    if (Array.isArray(this.data[key])) {
      return this.data[key];
    }
    return [];
  }

  clear() {
    fs.writeFileSync(this.path, "", function () {});
  }

  set(key, val) {
    this.data[key] = val;

    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  delete(key) {
    delete this.data[key];
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return defaults;
  }
}

module.exports = Store;

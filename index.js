const { app, BrowserWindow, Menu, MenuItem } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
const Store = require("./store.js");

const store = new Store({
  configName: "user-preferences",
  defaults: {
    favorites: { width: 800, height: 600 },
    added_folders: [],
    playlists: [],
  },
});

var playlists = [];

const fs = require("fs");
var win;
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });
  // win.webContents.openDevTools();

  // win.maximize();
  win.loadFile("index.html");

  let added_folders = store.get("added_folders");
  playlists = store.get("playlists");

  win.webContents.on("did-finish-load", function () {
    console.log("did finish");
    win.webContents.send("on-loaded", added_folders);
    win.webContents.send("on-loaded-playlists", playlists);
  });
}

const template = [
  {
    label: "Main",
    submenu: [
      {
        label: "Quit",
        click() {
          win.close();
        },
      },
    ],
  },

  {
    label: "Add",
    submenu: [
      {
        label: "Add Folder",
        click() {
          let { width, height } = store.get("windowBounds");

          console.log("udata", width, height);

          store.set("windowBounds", { width: 20, height: 50 });

          dialog
            .showOpenDialog(BrowserWindow.getFocusedWindow(), {
              properties: ["openDirectory"],
            })
            .then(async (data) => {
              console.log(data.filePaths);

              let arr = [];

              fs.readdir(data.filePaths[0], async (err, files) => {
                await Promise.all(
                  files.map(async (i, index) => {
                    let x = {
                      track: index + 1,
                      name: i,
                      duration: "--:--",
                      file: data.filePaths[0] + "/" + i,
                    };

                    arr.push(x);
                  })
                );
                test = data.filePaths[0] + "/" + arr[0];
                let temp = {};
                temp.files = arr;
                temp.path = data.filePaths[0] + "/";
                win.webContents.send("on-folder-selected", arr);
              });
            });
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

ipcMain.on("remove_from_playlist", async (event, data) => {
  console.log("file path to add playlist", data);

  playlists = store.get("playlists");

  let prev_songs = [];

  playlists.forEach((each) => {
    if (each.name == data.playlist_name) {
      prev_songs = each.songs;
    }
  });

  let xx = [];

  await Promise.all(
    prev_songs.map((each, index) => {
      if (each == data.song_name) {
        prev_songs.splice(index, 1);
      }
    })
  );

  await Promise.all(
    prev_songs.map((each, index) => {
      let x = {
        name: each.substring(each.lastIndexOf("/") + 1),
        duration: "--:--",
        file: each,
      };

      xx.push(x);
    })
  );

  store.set("playlists", playlists);

  console.log("songs in playlist now...", prev_songs, playlists);
  win.webContents.send("on-playlist-loaded", [xx, data.playlist_name]);
});

ipcMain.on("add_to_playlist", (event, data) => {
  console.log("file path to add playlist", data);

  playlists = store.get("playlists");

  let prev_songs = [];

  playlists.forEach((each) => {
    if (each.name == data.playlist_name) {
      prev_songs = each.songs;
    }
  });

  if (!prev_songs.includes(data.song_name)) {
    prev_songs.push(data.song_name);

    // playlists.forEach((each) => {
    //   console.log("eaching..", each);
    //   if (each.name == data.playlist_name) {
    //     each.songs = prev_songs;
    //   }
    // });
  }

  store.set("playlists", playlists);

  console.log("songs in playlist now...", prev_songs, playlists);
});

ipcMain.on("add_new_playlist", (event, r) => {
  if (!r) {
    console.log("user cancelled");
  } else {
    console.log("result", r);

    playlists = store.get("playlists");
    console.log("playlists", playlists);

    let temp = {};
    temp.name = r;
    temp.songs = [];

    let present = false;
    playlists.forEach((element, index) => {
      if (element.name == r) {
        present = true;
      }
    });

    if (!present) {
      playlists.push(temp);
      store.set("playlists", playlists);
      win.webContents.send("on-loaded-playlists", playlists);
    }
  }
});

ipcMain.on("delete_playlist", (event, name) => {
  console.log("DELETING...", name);
  playlists = store.get("playlists");

  playlists.forEach((each, index) => {
    if (each.name == name) {
      playlists.splice(index, 1);
    }
  });
  store.set("playlists", playlists);
  win.webContents.send("on-loaded-playlists", playlists);
});

ipcMain.on("delete_folder", (event, _path) => {
  console.log("DELETING...", _path);
  let added_folders = store.get("added_folders");
  console.log("prev folders", added_folders);

  if (Array.isArray(added_folders)) {
    added_folders.forEach((element, index) => {
      console.log("DELETING...", element.path, _path);

      if (element.path == _path) {
        added_folders.splice(index, 1);
      }
    });
  }
  console.log("DELETED", added_folders);

  store.set("added_folders", added_folders);
  win.webContents.send("on-loaded", added_folders);
});

async function get_songs(name) {
  let r = [];
  await Promise.all(
    playlists.map((each) => {
      if (each.name == name) {
        console.log("MATCH", each);
        r = each.songs;
      }
    })
  );

  console.log("r", r);
  return r;
}

function load_songs(arg, arg2) {
  let arr = [];
  console.log("LOADING SONGS", arg);
  arg.map(async (i, index) => {
    let audio_exts = [".mp3", ".wav"];
    const path = require("path");

    if (audio_exts.includes(path.extname(i))) {
      let x = {
        track: index + 1,

        name: i.substring(i.lastIndexOf("/") + 1),
        duration: "--:--",
        file: i,
      };

      arr.push(x);
    }
  });

  console.log("SENING", arr);
  win.webContents.send("on-playlist-loaded", [arr, arg2]);
}

ipcMain.on("load_playlist", async (event, name) => {
  console.log("loading pre playlist ", name, playlists);

  let songs = await get_songs(name);
  console.log("SONGS", songs);
  load_songs(songs, name);
});

ipcMain.on("pre_selected", (event, _path) => {
  console.log("ipc pre selected");

  let arr = [];

  fs.readdir(_path, async (err, files) => {
    await Promise.all(
      files.map(async (i, index) => {
        let audio_exts = [".mp3", ".wav"];
        const path = require("path");

        if (audio_exts.includes(path.extname(i))) {
          let x = {
            track: index + 1,
            name: i,
            duration: "--:--",
            file: _path + "/" + i,
          };

          arr.push(x);
        }
      })
    );
    test = _path + "/" + arr[0];
    let temp = {};
    temp.files = arr;
    temp.path = _path + "/";

    win.webContents.send("on-folder-selected", arr);
  });
});

ipcMain.on("add_new_folder", (event, path) => {
  console.log("ipc main add_new_folder");

  dialog
    .showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ["openDirectory"],
    })
    .then(async (data) => {
      let _path = data.filePaths[0];

      if (!_path) {
        return;
      }

      let added_folders = store.get("added_folders");

      let temp = {};
      temp.name = _path.substring(_path.lastIndexOf("/") + 1);
      temp.path = _path;

      let already_added_paths = [];
      if (Array.isArray(added_folders)) {
        added_folders.forEach((element) => {
          already_added_paths.push(element.path);
        });
      } else {
        added_folders = [];
      }

      if (!already_added_paths.includes(temp.path)) {
        added_folders.push(temp);
      }

      store.set("added_folders", added_folders);

      win.webContents.send("on-loaded", added_folders);

      let arr = [];

      fs.readdir(data.filePaths[0], async (err, files) => {
        await Promise.all(
          files.map(async (i, index) => {
            let audio_exts = [".mp3", ".wav"];
            const path = require("path");

            if (audio_exts.includes(path.extname(i))) {
              let x = {
                track: index + 1,
                name: i,
                duration: "--:--",
                file: data.filePaths[0] + "/" + i,
              };

              arr.push(x);
            }
          })
        );
        test = data.filePaths[0] + "/" + arr[0];
        let temp = {};
        temp.files = arr;
        temp.path = data.filePaths[0] + "/";
        win.webContents.send("on-folder-selected", arr);
      });
    });
});
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

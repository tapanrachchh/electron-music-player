const { app, BrowserWindow, Menu, MenuItem, remote } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
const mm = require("music-metadata");
const util = require("util");
const moment = require("moment");
const Store = require("./store.js");
// const contextMenu = require("electron-context-menu");

// contextMenu({
//   prepend: (defaultActions, parameters, browserWindow) => [
//     {
//       label: "Refresh",
//       // Only show it when right-clicking images
//       visible: true,
//       click: () => {
//         console.log("context click refresh", parameters);
//       },
//     },
//   ],
// });

const store = new Store({
  configName: "user-preferences",
  defaults: {
    favorites: { width: 800, height: 600 },
    added_folders: [],
    playlists: [],
    player: {
      repeat: false,
      shuffle: false,
    },
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
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
    },
    show: false,
    icon: "images/logo.png",
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  // win.webContents.openDevTools();

  win.maximize();
  win.loadFile("index.html");

  let added_folders = store.get("added_folders");
  playlists = store.get("playlists");
  let player = store.get("player");
  win.webContents.on("did-finish-load", function () {
    console.log("did finish", player);
    win.webContents.send("on-loaded-player-settings", player);
    win.webContents.send("on-loaded", added_folders);
    win.webContents.send("on-loaded-playlists", playlists);
  });
}

const template = [
  {
    label: "Main",
    submenu: [
      {
        label: "Clear Local Db",
        click() {
          store.clear();
          win.webContents.send("clear-db-call");

          // win.close();
        },
      },
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

                pre_send(arr);
              });
            });
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

ipcMain.on("show-context-menu", (event, _path) => {
  // console.log("event con", data, win);

  const context_menu = new Menu();
  context_menu.append(
    new MenuItem(
      new MenuItem({
        label: "Refresh",
        click: async function () {
          console.log("Refesh this", _path);

          let cached = store.get("cached");
          console.log("cacged IS", cached);
          if (false) {
            console.log("_path yes");
          } else {
            console.log("_path no");
            let arr = [];
            //NOT IN CACHE
            console.log("no in cache");

            fs.readdir(_path, async (err, files) => {
              console.log("reading files", files);

              await Promise.all(
                files.map(async (i, index) => {
                  let audio_exts = [".mp3", ".wav"];
                  const path = require("path");

                  if (audio_exts.includes(path.extname(i))) {
                    let info = await get_info(_path + "/" + i);

                    // console.log("info is", info);

                    let x = {
                      track: index + 1,
                      name: i,
                      duration: info.duration,
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

              // console.log("on foder", arr);

              let c_temp = {};
              if (typeof cached === "object") {
                c_temp = cached;
              }
              c_temp[_path] = arr;
              // console.log("saving cache", c_temp);
              store.set("cached", c_temp);

              pre_send(arr);
            });
          }
        },
      })
    )
  );

  // menu.append(
  //   new MenuItem({
  //     label: "This menu is not always shown",
  //     click: function () {
  //       alert(`you clicked on ${e.target.id}`);
  //     },
  //   })
  // );

  context_menu.popup({ win });
});

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
  console.log("CHECK THIS DELETING...", _path);
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

async function pre_send(arg) {
  console.log("pre send");
  let stared = store.get("stared");

  if (stared) {
    await Promise.all(
      arg.map(async (i, index) => {
        if (stared.includes(i.file)) {
          i.isStared = true;
        } else {
          i.isStared = false;
        }
      })
    );
  }

  console.log("check presend", arg);
  win.webContents.send("on-folder-selected", arg);
}

async function get_info(file_path) {
  // console.log("Getting song info for", file_path);

  try {
    const metadata = await mm.parseFile(file_path);
    console.log(util.inspect(metadata, { showHidden: false, depth: null }));
    let duration_in_seconds = metadata.format.duration;
    console.log(duration_in_seconds);
    const formatted = moment.utc(duration_in_seconds * 1000).format("mm:ss");
    // console.log("formatted duration", formatted);
    let temp = {};
    temp.duration = formatted;
    return temp;
  } catch (error) {
    console.error(error.message);
  }
}

function load_songs(arg, arg2, arg3 = false) {
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
  console.log("arg3", arg3);
  win.webContents.send("on-playlist-loaded", [arr, arg2, arg3]);
}

ipcMain.on("load_playlist", async (event, name) => {
  console.log("loading pre playlist ", name, playlists);

  let songs = await get_songs(name);
  console.log("SONGS", songs);
  load_songs(songs, name);
});

ipcMain.on("load_stared", async (event) => {
  console.log("loading stared songs ");

  let stared = store.get("stared");

  let songs = stared;
  console.log("Stared songs", songs);
  load_songs(songs, "Stared", true);
});

ipcMain.on("pre_selected", (event, _path) => {
  console.log("ipc pre selected");

  let arr = [];

  fs.readdir(_path, async (err, files) => {
    console.log("cache check1");
    console.log("path", _path);
    console.log("files", files);

    let cached = store.get("cached");

    console.log("cacged IS", cached);
    if (cached && _path in cached) {
      console.log("cache inc");

      pre_send(cached[_path]);

      console.log("sent from cache");

      return;
    } else {
      //NOT IN CACHE
      console.log("no in cache");

      await Promise.all(
        files.map(async (i, index) => {
          let audio_exts = [".mp3", ".wav"];
          const path = require("path");

          if (audio_exts.includes(path.extname(i))) {
            let info = await get_info(_path + "/" + i);

            console.log("info is", info);

            let x = {
              track: index + 1,
              name: i,
              duration: info.duration,
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

      console.log("on foder", arr);

      // let c_arr = [];
      let c_temp = {};
      if (typeof cached === "object") {
        c_temp = cached;
      }
      c_temp[_path] = arr;

      // c_arr.push(c_temp);
      console.log("saving cache", c_temp);
      store.set("cached", c_temp);

      pre_send(arr);
    }
  });
});

ipcMain.on("player_changes", (event, data) => {
  console.log("player change", data);

  player = store.get("player");

  if (!player) {
    player = {};
  }

  player[data.prop] = data.value;

  console.log("now player setts", player);
  store.set("player", player);
});

ipcMain.on("close_and_restart", (event) => {
  win.close();
});

ipcMain.on("star_file", (event, path) => {
  console.log("staring", path);

  stared = store.get("stared");
  let temp = [];



  if (Array.isArray(stared) && stared.length > 0) {
    console.log("found stared", stared);
    temp = stared;
  }

  let idx = temp.indexOf(path);
  idx === -1 ? temp.push(path) : temp.splice(idx, 1);

  console.log("stared", temp);
  store.set("stared", temp);
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
      let t1 = _path.substring(_path.lastIndexOf("/") + 1);
      t1 = _path.substring(_path.lastIndexOf("\\") + 1);

      temp.name = t1;

      let n_path = _path.replaceAll("\\", "/");
      console.log("path to be saved", _path, n_path);
      console.log("T1", t1);
      temp.path = n_path;

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
              let xtx = data.filePaths[0] + "/" + i;
              xtx = xtx.replaceAll("\\", "/");

              let x = {
                track: index + 1,
                name: i,
                duration: "--:--",
                file: xtx,
              };

              arr.push(x);
            }
          })
        );
        test = data.filePaths[0] + "/" + arr[0];
        let temp = {};
        temp.files = arr;
        temp.path = data.filePaths[0] + "/";

        console.log("on added selected", arr);

        pre_send(arr);
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

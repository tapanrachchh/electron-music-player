const { ipcRenderer } = require("electron");
const electron = require("electron");
var toBeAdded = false;

// Get the modal
var modal = document.getElementById("myModal");
var modal1 = document.getElementById("myModal1");
var modal2 = document.getElementById("myModal2");

// Get the button that opens the modal
var btn = document.getElementsByClassName("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
var span1 = document.getElementsByClassName("close")[1];
var span2 = document.getElementsByClassName("close")[2];

var lastPath = null;

var audio = document.getElementById("audio");

// audio.onended = function () {
//   alert("The audio has ended");
// };

// When the user clicks the button, open the modal
// btn.onclick = function (event) {
//   event.stopPropagation();
//   console.log("1111");
//   modal.style.display = "block";
// };

function create_new_playlist() {
  var input = document.getElementById("playlistInput");

  ipcRenderer.send("add_new_playlist", input.value);
  input.value = "";
  modal1.style.display = "none";
}

function close_and_restart() {
  modal2.style.display = "none";

  ipcRenderer.send("close_and_restart", null);
}

function openModel(event, path) {
  event.stopPropagation();
  toBeAdded = path;
  modal.style.display = "block";
}

function onStaring(event, path) {
  event.stopPropagation();
  console.log("file to start", path);
  ipcRenderer.send("star_file", path);
  load_folder();
}
function openModel1(path) {
  modal1.style.display = "block";
}

function openModel2(path) {
  modal2.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};

span1.onclick = function () {
  modal1.style.display = "none";
};

span2.onclick = function () {
  modal2.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function delete_folder(event, path) {
  event.stopPropagation();
  ipcRenderer.send("delete_folder", path);

  console.log("deleting folder 123", path);
}

function delete_playlist(event, name) {
  console.log("del pl name", name);
  event.stopPropagation();
  ipcRenderer.send("delete_playlist", name);
}

ipcRenderer.on("on-loaded-playlists", function (evt, data) {
  console.log("LOADED PLAYLIST", data);

  const playList = document.getElementById("playList");
  playList.innerHTML = data
    .map(
      (each) =>
        `<li class="item" onclick="load_playlist('${each.name}')"> 
        
        
    

        <span></span>
        <span style="display:flex;align-items:center">
        <img src="images/note.png" width="16px" style="margin-right:5px"/> ${each.name}  &nbsp;
        </span>

        
        
        
        <span onclick="delete_playlist(event,'${each.name}')"><img src="images/bin.png" width="16px"/></span></li>  `
    )
    .join("");

  let str = "";
  str += `<option value='Choose Playlist...'>  Choose Playlist... </option>`;

  for (var item of data) {
    console.log(item);
    str += `<option value='${item.name}'>  ${item.name} </option>`;
  }

  document.getElementById("selectList").innerHTML = str;
  selectFunc();
});

ipcRenderer.on("on-loaded-player-settings", function (evt, data) {
  console.log("LOADED Data about player", data);

  if (data) {
    if (data.repeat === true) {
      const repeatBttn = customPlayers[0].querySelector("#repeat-bttn");
      let path = repeatBttn.querySelector("#repeat-number");
      let svg = repeatBttn.querySelector("svg");
      svg.style.fill = "#566574";
      repeatBttn.classList.add("active");
      path.style.visibility = "visible";
    }

    if (data.shuffle === true) {
      const shuffleBttn = customPlayers[0].querySelector("#shuffle-bttn");

      let svg = shuffleBttn.querySelector("svg");
      svg.style.fill = "#566574";
      shuffleBttn.classList.add("active");
    }
  }
});

ipcRenderer.on("on-loaded", function (evt, data) {
  console.log("LOADED Data", data);

  const folderList = document.getElementById("folderList");
  folderList.innerHTML = data
    .map(
      (each) =>
        `<li class="item" onclick="load_folder('${each.path}')">
        <span></span>
        <span class="folderitem" data='${each.path}'>
        <img src="images/folder.png" width="18px" /> ${each.name} 
        </span>

        
        <span onclick="delete_folder(event,'${each.path}')"><img src="images/bin.png" width="16px"/></span></li>  `
    )
    .join("");
});

ipcRenderer.on("clear-db-call", function (evt, data) {
  openModel2();
});

ipcRenderer.on("on-playlist-loaded", function (evt, data) {
  console.log("is playlist stared", data[2]);
  const list = document.getElementById("songList");

  if (data[2]) {
    list.innerHTML = data[0]
      .map(
        (i) =>
          `<li class="song-item" onclick="onSongClick('${i.name}','${i.file}')"
          
          data-custom='${i.file}'

          >
          
          
          ${i.name}  <span class="myBtn" onclick="removeFromStared(event,'${i.file}')" >
        <img src="images/star_filled.png" width="16px"/>
        </span></li>`
      )
      .join("");
  } else {
    list.innerHTML = data[0]
      .map(
        (i) =>
          `<li class="song-item" onclick="onSongClick('${i.name}','${i.file}')"
          data-custom='${i.file}'

          >${i.name}  <span class="myBtn" onclick="removeFromPlaylist(event,'${data[1]}','${i.file}')" >
        <img src="images/bin.png" width="16px"/>
        </span></li>`
      )
      .join("");
  }
});

ipcRenderer.on("on-folder-selected", function (evt, data) {
  const list = document.getElementById("songList");
  list.innerHTML = data
    .map((i) =>
      i.isStared
        ? `<li class="song-item" onclick="onSongClick('${i.name}','${i.file}')"
          data-custom='${i.file}'

          >${
            i.name + " | " + i.duration
          }   <span class="myBtn" onclick="openModel(event,'${i.file}')"
        
        style="display:flex"
        >
        <img src="images/star_filled.png" width="22px" style="margin-left:10px;margin-right:10px" onclick="onStaring(event,'${
          i.file
        }')" />

        <img src="images/add.png" width="22px" />

        </span></li>`
        : `<li class="song-item" onclick="onSongClick('${i.name}','${i.file}')"
          data-custom='${i.file}'
          >${
            i.name + " | " + i.duration
          }  <span class="myBtn" onclick="openModel(event,'${i.file}')"
        
        style="display:flex"
        >
        <img src="images/star_unfilled.png" width="22px" style="margin-left:10px;margin-right:10px" onclick="onStaring(event,'${
          i.file
        }')" />

        <img src="images/add.png" width="22px" />

        </span></li>`
    )
    .join("");
});

function load_stared() {
  ipcRenderer.send("load_stared");
}

function onSongClick(name, path) {
  const title = document.getElementById("songTitle");
  title.innerHTML = name;

  console.log("clicked ", path);
  var source = document.getElementById("audioSource");
  var play_bttn = document.getElementsByClassName("play-bttn");
  play_bttn = play_bttn[0];

  source.src = "file://" + path;
  audio.load();
  play_bttn.classList.add("playing");

  // console.log("play btn ", play_bttn[0]);
  audio.play();
}

function removeFromPlaylist(event, playlist_name, song) {
  event.stopPropagation();
  console.log("removing from playlist", playlist_name, song);

  let temp = {};
  temp.song_name = song;
  temp.playlist_name = playlist_name;

  ipcRenderer.send("remove_from_playlist", temp);
}

function removeFromStared(event, song) {
  event.stopPropagation();
  console.log("removing from stared", song);

  ipcRenderer.send("star_file", song);
  ipcRenderer.send("load_stared");
}

function add_to_playlist(event) {
  const select = document.getElementById("selectList");

  console.log("adding to playlist", select.value, toBeAdded);

  let temp = {};
  temp.song_name = toBeAdded;
  temp.playlist_name = select.value;

  ipcRenderer.send("add_to_playlist", temp);

  modal.style.display = "none";
}

function load_folder(path = null) {
  if (!path) {
    path = lastPath;
  } else {
    lastPath = path;
  }

  console.log("check load_folder path", path);
  ipcRenderer.send("pre_selected", path);
}

function load_playlist(name) {
  ipcRenderer.send("load_playlist", name);
}

function add_new_folder() {
  console.log("add_new_folder called");
  ipcRenderer.send("add_new_folder", "helloworld");
}

function add_new_playlist() {
  console.log("add new playlist called");

  ipcRenderer.send("add_new_playlist", true);
}

// Custom Select Code sourced from https://www.w3schools.com/

function selectFunc() {
  const elements = document.getElementsByClassName("select-selected");

  while (elements.length > 0) elements[0].remove();

  var x, i, j, l, ll, selElmnt, a, b, c;

  /*look for any elements with the class "custom-select":*/
  x = document.getElementsByClassName("custom-select");
  l = x.length;
  for (i = 0; i < l; i++) {
    selElmnt = x[i].getElementsByTagName("select")[0];
    ll = selElmnt.length;
    /*for each element, create a new DIV that will act as the selected item:*/
    a = document.createElement("DIV");
    a.setAttribute("class", "select-selected");
    a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
    x[i].appendChild(a);
    /*for each element, create a new DIV that will contain the option list:*/
    b = document.createElement("DIV");
    b.setAttribute("class", "select-items select-hide");
    for (j = 1; j < ll; j++) {
      /*for each option in the original select element,
    create a new DIV that will act as an option item:*/
      c = document.createElement("DIV");
      c.innerHTML = selElmnt.options[j].innerHTML;
      c.addEventListener("click", function (e) {
        /*when an item is clicked, update the original select box,
        and the selected item:*/
        var y, i, k, s, h, sl, yl;
        s = this.parentNode.parentNode.getElementsByTagName("select")[0];
        sl = s.length;
        h = this.parentNode.previousSibling;
        for (i = 0; i < sl; i++) {
          if (s.options[i].innerHTML == this.innerHTML) {
            s.selectedIndex = i;
            h.innerHTML = this.innerHTML;
            y = this.parentNode.getElementsByClassName("same-as-selected");
            yl = y.length;
            for (k = 0; k < yl; k++) {
              y[k].removeAttribute("class");
            }
            this.setAttribute("class", "same-as-selected");
            break;
          }
        }
        h.click();
      });
      b.appendChild(c);
    }
    x[i].appendChild(b);
    a.addEventListener("click", function (e) {
      /*when the select box is clicked, close any other select boxes,
      and open/close the current select box:*/
      e.stopPropagation();
      closeAllSelect(this);
      this.nextSibling.classList.toggle("select-hide");
      this.classList.toggle("select-arrow-active");
    });
  }
}
function closeAllSelect(elmnt) {
  /*a function that will close all select boxes in the document,
except the current select box:*/
  var x,
    y,
    i,
    xl,
    yl,
    arrNo = [];
  x = document.getElementsByClassName("select-items");
  y = document.getElementsByClassName("select-selected");
  xl = x.length;
  yl = y.length;
  for (i = 0; i < yl; i++) {
    if (elmnt == y[i]) {
      arrNo.push(i);
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < xl; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("select-hide");
    }
  }
}
document.addEventListener("click", closeAllSelect);

//for search

function myFunction() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  ul = document.getElementById("songList");
  li = ul.getElementsByTagName("li");
  for (i = 0; i < li.length; i++) {
    console.log("scheck", li[i].innerText);
    // a = li[i].getElementsByTagName("a")[0];
    txtValue = li[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
      console.log("match", li[i], txtValue);
    } else {
      console.log("not match", li[i], txtValue);

      li[i].style.display = "none";
    }
  }
}

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  console.log(
    "hello",
    e.target.className,
    e.target.className == "folderitem",
    e.target
  );
  if (e.target.className == "folderitem") {
    ipcRenderer.send("show-context-menu", e.target.getAttribute("data"));
  }

  // ipcRenderer.send("show-context-menu");
});
// const remote = require("electron").remote;

// const { Menu, MenuItem } = remote;

// window.addEventListener(
//   "contextmenu",
//   (e) => {
//     e.preventDefault();
//     const menu = new Menu();
//     menu.append(
//       new MenuItem(new MenuItem({ label: "This menu item is always shown" }))
//     );
//     if (e.target.id === "p1" || e.target.id === "p3") {
//       menu.append(
//         new MenuItem({
//           label: "This menu is not always shown",
//           click: function () {
//             alert(`you clicked on ${e.target.id}`);
//           },
//         })
//       );
//     }
//     menu.popup({ window: remote.getCurrentWindow() });
//   },
//   false
// );

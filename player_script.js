let audio_prev_src = "";
var audioObj = null;
let userInteractedWithDOM = false;
const customPlayers = document.querySelectorAll(".custom-audio-player");
window.onload = () => {
  const customPlayers = document.querySelectorAll(".custom-audio-player");

  for (let i = 0; i < customPlayers.length; i++) {
    audioObj = customPlayers[i].querySelector(".audioObj");
    const playBttn = customPlayers[i].querySelector(".play-bttn");
    const currTimeLbl = customPlayers[i].querySelector(".current-time");
    const rangeSlider = customPlayers[i].querySelector(".range-slider-audio");
    const audioLenLbl = customPlayers[i].querySelector(".audio-length");
    const audioSource = audioObj.querySelector("source").src;
    const playbackBttn = customPlayers[i].querySelector(".playback-speed");
    const playbackRangeSlider = customPlayers[i].querySelector(
      ".range-slider-audio-playback"
    );
    const soundRangeSlider = customPlayers[i].querySelector(
      ".range-slider-audio-sound"
    );
    const soundBttn = customPlayers[i].querySelector(".sound-bttn");
    const repeatBttn = customPlayers[i].querySelector("#repeat-bttn");
    const shuffleBttn = customPlayers[i].querySelector("#shuffle-bttn");
    // const abRepeat = customPlayers[i].querySelector("#a-b-repeat-bttn");

    const soundOption = customPlayers[i].querySelector(".sound-option");

    const soundIcon = customPlayers[i].querySelector(".speaker");

    let lc_object = { audioCurrentTime: 0, marks: [] };

    let lastTime_lc = 0;
    playbackRangeSlider.value = 18.9;
    customPlayers[i].style["z-index"] = customPlayers.length - i;

    currTimeLbl.innerText = "0:00";
    audioObj.currentTime = 0;

    // myAudio.addEventListener("canplaythrough", function () {
    //   this.currentTime = 12;
    //   this.play();
    // });

    playBttn.onclick = () => {
      stopAllAudios(customPlayers[i]);
      playBttn.classList.toggle("playing");
      if (playBttn.getAttribute("class").includes("playing")) {
        audioObj.play();
      } else {
        audioObj.pause();
      }
    };

    playbackBttn.onclick = () => {
      customPlayers[i]
        .querySelector(".playback-option")
        .classList.toggle("list-displayed");
      soundOption.classList.remove("list-displayed");
    };

    playbackRangeSlider.oninput = () => {
      const playbackRate = (playbackRangeSlider.value / 25 + 0.25).toFixed(2);
      playbackBttn.querySelector("span").innerText = `x${playbackRate}`;
      audioObj.playbackRate = playbackRate;
    };

    let delay = false;

    soundBttn.onmouseover = () => {
      console.log("so", soundOption);
      if (!delay) {
        soundOption.classList.toggle("list-displayed");
        customPlayers[i]
          .querySelector(".playback-option")
          .classList.remove("list-displayed");
        soundBttn.classList.toggle("svg-green");

        delay = true;

        const myTimeout = setTimeout(function () {
          delay = false;
        }, 2000);
      }
    };

    soundOption.onmouseleave = () => {
      console.log("lev");
      soundOption.classList.remove("list-displayed");
      delay = false;
    };

    repeatBttn.onclick = () => {
      let path = repeatBttn.querySelector("#repeat-number");
      let svg = repeatBttn.querySelector("svg");
      let temp = {};
      temp.prop = "repeat";
      if (repeatBttn.classList.contains("active")) {
        svg.style.fill = "#aaa";
        repeatBttn.classList.remove("active");
        path.style.visibility = "hidden";

        temp.value = false;
        ipcRenderer.send("player_changes", temp);
      } else {
        svg.style.fill = "#566574";
        repeatBttn.classList.add("active");
        path.style.visibility = "visible";
        temp.value = true;
        ipcRenderer.send("player_changes", temp);
      }
    };

    function doAll(arr, activate) {
      arr.forEach((element) => {
        if (activate) {
          element.style.fill = "#566574";
        } else {
          element.style.fill = "#aaa";
        }
      });
    }

    // abRepeat.onclick = () => {
    //   let svg = abRepeat.querySelectorAll("svg");
    //   console.log("svg", svg);

    //   let abRange = document.getElementById("slider-range");

    //   if (abRepeat.classList.contains("active")) {
    //     doAll(svg, false);
    //     abRepeat.classList.remove("active");
    //     abRange.style.display = "none";
    //   } else {
    //     doAll(svg, true);
    //     abRepeat.classList.add("active");
    //     abRange.style.display = "block";
    //   }
    // };

    shuffleBttn.onclick = () => {
      let temp = {};
      temp.prop = "shuffle";
      if (shuffleBttn.classList.contains("active")) {
        let svg = shuffleBttn.querySelector("svg");
        svg.style.fill = "#aaa";
        shuffleBttn.classList.remove("active");
        temp.value = false;
        ipcRenderer.send("player_changes", temp);
      } else {
        let svg = shuffleBttn.querySelector("svg");
        svg.style.fill = "#566574";
        shuffleBttn.classList.add("active");
        temp.value = true;
        ipcRenderer.send("player_changes", temp);
      }
    };

    soundRangeSlider.oninput = () => {
      const audVolume = soundRangeSlider.value / 100;
      audioObj.volume = audVolume;

      if (audVolume >= 0.5) {
        soundIcon.attributes.d.value =
          "M14.667 0v2.747c3.853 1.146 6.666 4.72 6.666 8.946 0 4.227-2.813 7.787-6.666 8.934v2.76C20 22.173 24 17.4 24 11.693 24 5.987 20 1.213 14.667 0zM18 11.693c0-2.36-1.333-4.386-3.333-5.373v10.707c2-.947 3.333-2.987 3.333-5.334zm-18-4v8h5.333L12 22.36V1.027L5.333 7.693H0z";
      } else if (audVolume < 0.5 && audVolume > 0.05) {
        soundIcon.attributes.d.value =
          "M0 7.667v8h5.333L12 22.333V1L5.333 7.667M17.333 11.373C17.333 9.013 16 6.987 14 6v10.707c2-.947 3.333-2.987 3.333-5.334z";
      } else if (audVolume <= 0.05) {
        soundIcon.attributes.d.value =
          "M0 7.667v8h5.333L12 22.333V1L5.333 7.667";
      }
    };

    audioObj.ontimeupdate = () => {
      // console.log("up", rangeA, rangeB);

      if (rangeB) {
        if (audioObj.currentTime > (rangeB * audioObj.duration) / 100) {
          audioObj.pause();
        }
      }

      currTimeLbl.textContent = formatTime(audioObj.currentTime);
      rangeSlider.value = (audioObj.currentTime / audioObj.duration) * 100;
      //rangeSlider.style['filter'] = `hue-rotate(${rangeSlider.value * 3.6}deg)`;
      lc_object.audioCurrentTime = audioObj.currentTime;

      localStorage.setItem(
        customPlayers[i].getAttribute("audio-id"),
        JSON.stringify(lc_object)
      );

      if (audioObj.currentTime == audioObj.duration) {
        playBttn.classList.remove("playing");
      }

      if (audioLenLbl.innerText != formatTime(audioObj.duration)) {
        audioLenLbl.innerText = formatTime(audioObj.duration);
      }
    };

    audioObj.onended = () => {
      if (userInteractedWithDOM) {
        if (i + 1 != customPlayers.length) {
          customPlayers[i + 1].querySelector(".audioObj").play();
          customPlayers[i + 1]
            .querySelector(".play-bttn")
            .classList.add("playing");
        } else {
          customPlayers[0].querySelector(".audioObj").play();
          customPlayers[0].querySelector(".play-bttn").classList.add("playing");
        }
      }

      if (repeatBttn.classList.contains("active")) {
        customPlayers[0].querySelector(".audioObj").play();
        customPlayers[0].querySelector(".play-bttn").classList.add("playing");
      } else {
        if (shuffleBttn.classList.contains("active")) {
          const list = document
            .getElementById("songList")
            .getElementsByTagName("li");

          console.log("ss", list, list.length);
          list.length = list.length - 1;

          const rndInt = Math.floor(Math.random() * list.length);

          console.log("rndInt", rndInt, onSongClick);

          // onSongClick()
          let it = list[rndInt].innerText;
          let baseURI = list[rndInt].getAttribute("data-custom");

          console.log("to sned", baseURI);

          onSongClick(it, baseURI);

          // alert("shuffling songs", list.length);

          // customPlayers[0].querySelector(".audioObj").play();
          // customPlayers[0].querySelector(".play-bttn").classList.add("playing");
        } else {
        }
      }
    };

    audioObj.onloadedmetadata = () => {
      audioLenLbl.innerText = formatTime(audioObj.duration);
    };

    rangeSlider.oninput = () => {
      // console.log("i", rangeSlider.value);
      // let value = rangeSlider.value;
      // console.log("rangeSlider", value);
      // if (value < 30) {
      //   rangeSlider.value = 30;
      // }
      // if (value > 60) {
      //   rangeSlider.value = 60;
      // }
      audioObj.currentTime = audioObj.duration * (rangeSlider.value / 100);
    };

    customPlayers[i].classList.add("opacity-1");
  }
};

const formatTime = (time) => {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return min + ":" + (sec < 10 ? "0" + sec : sec);
};

const stopAllAudios = (cPlayer) => {
  for (let customPlayer of customPlayers) {
    if (customPlayer !== cPlayer) {
      customPlayer.querySelector(".audioObj").pause();
      customPlayer.querySelector(".play-bttn").classList.remove("playing");
    }
  }
};

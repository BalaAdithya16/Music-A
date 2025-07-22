console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs = [];
let currFolder = '';
let cardContainer = document.querySelector(".cardContainer");

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  try {
    const response = await fetch(`http://localhost:3000/api/songs/${folder}`);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    
    songs = await response.json();
    
    if (!songs || songs.length === 0) {
      throw new Error('No songs found in album');
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = songs.map(song => `
      <li>
        <img class="invert" width="34" src="img/music.svg" alt="">
        <div class="info">
          <div>${song.replaceAll("%20", " ")}</div>
          <div>Artist</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img class="invert" src="img/play.svg" alt="">
        </div>
      </li>
    `).join('');

    Array.from(document.querySelectorAll(".songList li")).forEach(e => {
      e.addEventListener("click", () => {
        playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
      });
    });

    return songs;
  } catch (error) {
    console.error("Error loading songs:", error);
    document.querySelector(".songList ul").innerHTML = 
      `<li class="error">Failed to load songs: ${error.message}</li>`;
    return [];
  }
}

const playMusic = (track, pause = false) => {
  const cleanTrack = track.replace(/%20/g, ' ');
  currentSong.src = `http://localhost:3000/songs/${currFolder}/${cleanTrack}`;
  
  if (!pause) {
    currentSong.play()
      .then(() => {
        document.getElementById("play").src = "img/pause.svg";
        console.log("Now playing:", currentSong.src);
      })
      .catch(err => {
        console.error("Playback failed:", err);
        console.log("Attempted to play:", currentSong.src);
      });
  }
  document.querySelector(".songinfo").textContent = track;
  document.querySelector(".songtime").textContent = "00:00 / 00:00";
};

async function displayAlbums() {
  try {
    const response = await fetch('http://localhost:3000/api/albums');
    if (!response.ok) throw new Error('Failed to fetch albums');
    
    const albums = await response.json();
    cardContainer.innerHTML = ''; // Clear previous content
    
    albums.forEach(album => {
      cardContainer.innerHTML += `
        <div data-folder="${album.name}" class="card">
          <img src="${album.cover}" alt="${album.info.title}">
          <h2>${album.info.title}</h2>
          <p>${album.info.description}</p>
        </div>`;
    });

    // Add click handlers for album cards
    document.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", async () => {
        currFolder = card.dataset.folder;
        await getSongs(currFolder);
        if (songs.length > 0) {
          playMusic(songs[0]);
        }
      });
    });
  } catch (error) {
    console.error("Error loading albums:", error);
    cardContainer.innerHTML = '<div class="error">Failed to load albums</div>';
  }
}

async function main() {
  const play = document.getElementById("play");
  const next = document.getElementById("next");
  const previous = document.getElementById("previous");
  
  // Initial load
  await displayAlbums();
  
  // Player controls
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Navigation controls
  previous.addEventListener("click", () => {
    if (songs.length === 0) return;
    currentSong.pause();
    const currentIndex = songs.findIndex(song => 
      currentSong.src.includes(encodeURIComponent(song))
    );
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    playMusic(songs[prevIndex]);
  });

  next.addEventListener("click", () => {
    if (songs.length === 0) return;
    currentSong.pause();
    const currentIndex = songs.findIndex(song => 
      currentSong.src.includes(encodeURIComponent(song))
    );
    const nextIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[nextIndex]);
  });

  // Volume controls
  const volumeInput = document.querySelector(".range input");
  const volumeIcon = document.querySelector(".volume>img");
  
  volumeInput.addEventListener("input", (e) => {
    const volumeValue = parseInt(e.target.value);
    currentSong.volume = volumeValue / 100;
    volumeIcon.src = `img/${volumeValue === 0 ? 'mute' : 'volume'}.svg`;
  });

  volumeIcon.addEventListener("click", () => {
    const newVolume = currentSong.volume === 0 ? 0.5 : 0;
    currentSong.volume = newVolume;
    volumeInput.value = newVolume * 100;
    volumeIcon.src = `img/${newVolume === 0 ? 'mute' : 'volume'}.svg`;
  });

  // Hamburger menu
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });
}

// Start the app
main();
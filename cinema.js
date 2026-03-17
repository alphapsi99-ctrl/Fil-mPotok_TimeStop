document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "dd0bd50a39b699800aac514137f3cdb5";

  let myMovies = JSON.parse(localStorage.getItem("myCinemaList")) || [];
  let currentMovie = null;
  let currentEpisode = 1;
  let currentSource = 1;

  const grid = document.getElementById("myMoviesGrid");
  const iframe = document.getElementById("videoPlayer");
  const modal = document.getElementById("playerModal");
  const input = document.getElementById("movieInput");
  const addBtn = document.getElementById("addBtn");

  async function addMovie() {
    const query = input.value.trim();
    if (!query) return;

    addBtn.innerText = "Ищем...";
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(
          query
        )}&language=ru-RU`
      );
      const data = await res.json();

      const result = data.results.find((i) => i.media_type !== "person");

      if (result) {
        myMovies.push({
          tmdbId: result.id,
          title: result.title || result.name,
          type: result.media_type,
          poster: result.poster_path
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : "https://via.placeholder.com/500x750?text=Нет+постера",
          rating: result.vote_average.toFixed(1),
        });
        saveAndRender();
        input.value = "";
      } else {
        alert("Ничего не найдено!");
      }
    } catch (e) {
      alert("Ошибка сети или API ключа");
    } finally {
      addBtn.innerText = "Найти и добавить";
    }
  }

  function render() {
    grid.innerHTML = "";
    myMovies.forEach((m, i) => {
      const card = document.createElement("div");
      card.className = "movie-card";
      card.innerHTML = `
              <button class="delete-btn" onclick="event.stopPropagation(); deleteMovie(${i})">✕</button>
              <img src="${m.poster}" alt="${m.title}">
              <div class="movie-info">
                  <div class="movie-title">${m.title}</div>
                  <div class="movie-rating">⭐ ${m.rating}</div>
              </div>`;
      card.onclick = () => openPlayer(i);
      grid.appendChild(card);
    });
  }

  window.openPlayer = (index) => {
    currentMovie = myMovies[index];
    currentEpisode = 1;
    currentSource = 1;

    document.getElementById("modalTitle").innerText = currentMovie.title;

    const epControls = document.getElementById("epControls");
    epControls.style.display = currentMovie.type === "tv" ? "flex" : "none";

    updateVideo();
    updateExternalButtons(currentMovie.title);
    modal.style.display = "flex";
  };

  window.changeSource = (s) => {
    currentSource = s;
    document.getElementById("src1").classList.toggle("active", s === 1);
    document.getElementById("src2").classList.toggle("active", s === 2);
    updateVideo();
  };

  window.changeEpisode = (step) => {
    currentEpisode += step;
    if (currentEpisode < 1) currentEpisode = 1;
    updateVideo();
  };

  function updateVideo() {
    if (!currentMovie) return;
    document.getElementById("currentEpisodeDisplay").innerText = currentEpisode;

    let url = "";
    if (currentSource === 1) {
      url =
        currentMovie.type === "tv"
          ? `https://vidsrc.to/embed/tv/${currentMovie.tmdbId}/1/${currentEpisode}`
          : `https://vidsrc.to/embed/movie/${currentMovie.tmdbId}`;
    } else {
      const searchQuery = encodeURIComponent(
        currentMovie.title +
          (currentMovie.type === "tv" ? ` ${currentEpisode} серия` : "")
      );
      url = `https://www.kinopoisk.gg/search?query=${searchQuery}`;
    }

    iframe.src = url;

    document.getElementById("openNewTab").onclick = () =>
      window.open(url, "_blank");
  }

  function updateExternalButtons(title) {
    const q = encodeURIComponent(title);
    document.getElementById("externalButtons").innerHTML = `
          <a href="https://rezka.ag/search/?do=search&subaction=search&q=${q}" target="_blank" class="res-btn btn-rezka">HDRezka</a>
          <a href="https://www.kinopoisk.ru/index.php?kp_query=${q}" target="_blank" class="res-btn btn-kp">Кинопоиск</a>
          <a href="https://www.ivi.ru/search/?q=${q}" target="_blank" class="res-btn btn-ivi">IVI</a>
          <a href="https://gidonline.io/?s=${q}" target="_blank" class="res-btn btn-gid">GidOnline</a>
      `;
  }

  window.closePlayer = () => {
    modal.style.display = "none";
    iframe.src = "";
  };

  window.deleteMovie = (i) => {
    myMovies.splice(i, 1);
    saveAndRender();
  };

  function saveAndRender() {
    localStorage.setItem("myCinemaList", JSON.stringify(myMovies));
    render();
  }

  addBtn.onclick = addMovie;
  input.onkeypress = (e) => {
    if (e.key === "Enter") addMovie();
  };

  window.onclick = (e) => {
    if (e.target === modal) closePlayer();
  };

  render();
});

function updateVideo() {
  if (!currentMovie) return;

  const iframe = document.getElementById("videoPlayer");
  const display = document.getElementById("currentEpisodeDisplay");

  if (display) display.innerText = currentEpisode;

  const tmdbId = currentMovie.tmdbId;
  const type = currentMovie.type === "tv" ? "tv" : "movie";

  let videoUrl = "";

  if (currentSource === 1) {
    if (type === "tv") {
      videoUrl = `https://vidsrc.to/embed/tv/${tmdbId}/1/${currentEpisode}`;
    } else {
      videoUrl = `https://vidsrc.to/embed/movie/${tmdbId}`;
    }
  } else {
    const searchQuery = encodeURIComponent(
      currentMovie.title + (type === "tv" ? ` ${currentEpisode} серия` : "")
    );
    videoUrl = `https://www.kinopoisk.gg/search?query=${searchQuery}`;
  }

  console.log("Загружаю URL:", videoUrl);
  iframe.setAttribute("src", videoUrl);

  const openBtn = document.getElementById("openNewTab");
  if (openBtn) {
    openBtn.onclick = () => window.open(videoUrl, "_blank");
  }
}

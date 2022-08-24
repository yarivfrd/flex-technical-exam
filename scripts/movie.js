
const API_KEY = '2c46288716a18fb7aadcc2a801f3fc6b';
let movieId = (new URL(document.location).searchParams).get('id');
const dataUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`;
let movieData = {};
let isPageLoading = true;

function init() {
  querySelectDOMElements();
  registerEventListeners();
  fetchData();
}

function querySelectDOMElements() {
  mainContentEl = document.querySelector('main');
  posterEl = document.querySelector('.movie-poster');
  movieTitleEl = document.querySelector('.movie-title');
  releaseDateEl = document.querySelector('.release-date');
  genresListEl = document.querySelector('.genres');
  overviewEl = document.querySelector('.overview');
  favoriteToggleEl = document.querySelector('#favorite-toggle');
}

function registerEventListeners() {
  favoriteToggleEl.addEventListener('change', handleFavoriteToggle);
}

function fetchData() {
  setLoadingState(true);
  fetch(dataUrl, {
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    }
  })
    .then(res => res.json())
    .then(data => {
      movieData = data;
      setPageTitle(movieData.title);
      setDetailsDOM();
      setLoadingState(false);
    })
    .catch(err => console.error(`Failed to fetch movie data: ${err}`));
}

function setPageTitle(movieTitle) {
  document.title = `${movieTitle} - Movie Library`;
}

function setDetailsDOM() {
  const {
    poster_path,
    title,
    release_date,
    genres,
    overview
  } = movieData;

  if (poster_path) {
    posterEl.alt = `${title}`;
    const posterWidth = 200;
    posterEl.src = `https://image.tmdb.org/t/p/w${posterWidth}${poster_path}`;
  } else {
    posterEl.remove();
  }

  const [ rel_year, rel_month, rel_day ] = release_date.split('-');
  releaseDateEl.textContent = `${rel_day}/${rel_month}/${rel_year}`;

  movieTitleEl.textContent = `${title} (${rel_year})`;

  const genreItems = [];
  genres.forEach(genre => {
    const genreEl = document.createElement('li');
    genreEl.classList.add('genre');
    genreEl.textContent = genre.name;
    genreItems.push(genreEl);
  });
  genresListEl.append(...genreItems);

  overviewEl.textContent = overview;

  setFavoriteState();
}

function setLoadingState(state) {
  isPageLoading = state;
  state ? mainContentEl.classList.add('is-loading') : mainContentEl.classList.remove('is-loading');
}

function handleFavoriteToggle(e) {
  let siteStorage = JSON.parse(localStorage.getItem('movie-lib'));
  if (e.target.checked) {
    siteStorage.favorites.push({id: movieId, title: movieData.title, poster_path: movieData.poster_path});
  } else {
    const filteredFavorites = siteStorage.favorites.filter(movie => movie.id !== movieId);
    siteStorage.favorites = filteredFavorites;
  }
  localStorage.setItem('movie-lib', JSON.stringify(siteStorage));
}

function setFavoriteState() {
  const isFavorite = JSON.parse(localStorage.getItem('movie-lib')).favorites.find(movie => movie.id === movieId);
  isFavorite ? favoriteToggleEl.checked = true : null;
};

window.addEventListener('DOMContentLoaded', init);
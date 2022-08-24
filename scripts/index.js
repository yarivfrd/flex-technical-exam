
const API_KEY = '2c46288716a18fb7aadcc2a801f3fc6b';
let pageNum = 1;
let totalPages;
let filterParam = 'sort_by=popularity.desc';
const BASE_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`;
let debounceTimeoutId;

function init() {
  initLocalStorage();
  querySelectDOMElements();
  registerEventListeners();
  fetchData();
}

function initLocalStorage() {
  if (!localStorage.getItem('movie-lib')) {
    localStorage.setItem('movie-lib', '{"favorites": []}');
  }
}

function querySelectDOMElements() {
  mainContainerEl = document.querySelector('main');
  filterControlTogglesEl = document.querySelectorAll('.filter-control input');
  feedEl = document.querySelector('.feed');
  feedItemListEl = document.querySelector('.item-list');
  paginationControlsEl = document.querySelector('.pagination-controls');
  paginationPrevEl = document.querySelector('.prev-page');
  paginationNextEl = document.querySelector('.next-page');
  currentPageEl = document.querySelector('.current-page');
  totalPagesEl = document.querySelector('.total-pages');
}

function registerEventListeners() {
  filterControlTogglesEl.forEach(control => {
    control.addEventListener('change', (e) => handleFilterChange(e.target.id))
  });
  paginationPrevEl.addEventListener('click', () => onPageNav(pageNum - 1));
  paginationNextEl.addEventListener('click', () => onPageNav(pageNum + 1));
  currentPageEl.addEventListener('click', (e) => e.target.select());
  currentPageEl.addEventListener('change', (e) => {
    onPageNav(Number(e.target.value));
    e.target.blur();
  });
  totalPagesEl.addEventListener('click', () => onPageNav(totalPages));
}

function fetchData() {
  setFeedErrorState(false);
  setFeedLoadingState(true);
  let dataUrl = `${BASE_URL}&${filterParam}&page=${pageNum}`;
  fetch(dataUrl, {
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    }
  })
    .then(res => res.json())
    .then(data => {
      updateFeedDOM(data.results);
      updatePaginationDOM(data.total_pages);
      setFeedLoadingState(false);
    })
    .catch(() => {
      setFeedErrorState(true);
      setFeedLoadingState(false);
      ;
    });
}

function setFeedErrorState(state) {
  if (state) {
    feedEl.classList.add('error');
    mainContainerEl.append(errorMsgEl());
  } else {
    const errMsgExists = !!document.querySelector('.error-msg');
    if (errMsgExists) {
      document.querySelector('.error-msg').remove();
      feedEl.classList.remove('error');
    }
  }
}

function errorMsgEl() {
  const el = document.createElement('div');
  el.classList.add('error-msg');
  el.textContent = 'Failed to fetch movie data';
  return el;
}

function updateFeedDOM(moviesData) {
  const movieItems = [];
  moviesData.forEach(movie => {
    const {id, poster_path, title} = movie;
    const movieItemEl = document.createElement('li');
    movieItemEl.classList.add('movie-item');
    movieItemEl.innerHTML = `
      <a href="pages/movie.html?id=${id}">
        <img class="movie-poster" src="https://image.tmdb.org/t/p/w200${poster_path}" alt="${title}">
      </a>
    `;
    movieItems.push(movieItemEl);
  });
  feedItemListEl.innerHTML = '';
  feedItemListEl.append(...movieItems);
  paginationControlsEl.classList.remove('hidden');
}

function updatePaginationDOM(moviesPageNum) {
  // Due to a bug in the API, no pages can be requested beyond page 500:
  // https://www.themoviedb.org/talk/621b62abd18572001df182ea

  if (moviesPageNum <= 500) {
    totalPages = moviesPageNum;
  } else {
    totalPages = 500;
  }
  totalPagesEl.textContent = totalPages;
}

function setFeedLoadingState(state) {
  state ?
  feedItemListEl.classList.add('is-loading') :
  feedItemListEl.classList.remove('is-loading');
}

function onPageNav(newPageNum) {
  if (newPageNum > 0 && newPageNum <= totalPages) {
    pageNum = newPageNum;
    currentPageEl.value = newPageNum;
    debounce(fetchData);
  } else {
    currentPageEl.value = pageNum;
  }
  pageNum === 1 ? paginationPrevEl.disabled = true : paginationPrevEl.disabled = false;
  pageNum >= totalPages ? paginationNextEl.disabled = true : paginationNextEl.disabled = false;
}

function handleFilterChange(newFilterType) {
  switch (newFilterType) {
    case 'popular':
      filterParam = 'sort_by=popularity.desc';
      break;
    case 'live':
      const { rangeStartDate, rangeEndDate } = getLiveDatesRange();
      filterParam = `primary_release_date.lte=${rangeEndDate}&primary_release_date.gte=${rangeStartDate}`;
      break;
    case 'favorite':
      const favoriteMovies = JSON.parse(localStorage.getItem('movie-lib')).favorites;
      if (favoriteMovies.length) {
        updateFeedDOM(favoriteMovies);
      } else {
        feedItemListEl.innerHTML = '';
        feedItemListEl.append(emptyFeedEl());
      }
      // Would have added favorites pagination if had more time.
      paginationControlsEl.classList.add('hidden');
      return;
  }
  pageNum = 1;
  currentPageEl.value = 1;
  fetchData();
}

function emptyFeedEl() {
  const el = document.createElement('li');
  el.classList.add('movie-item', 'empty-placeholder');
  el.textContent = 'No favorites';
  return el;
}

function getLiveDatesRange() {

  const currentTime = new Date();
  const currentYear = currentTime.getFullYear();
  const currentMonth = String(currentTime.getMonth() + 1).padStart(2, '0');
  const currentDate = String(currentTime.getDate()).padStart(2, '0');
  const rangeEndDate = `${currentYear}-${currentMonth}-${currentDate}`;

  const modifiedTime = new Date(currentTime.setMonth(currentTime.getMonth() - 1));
  const modifiedYear = modifiedTime.getFullYear();
  const modifiedMonth = String(modifiedTime.getMonth() + 1).padStart(2, '0');
  const modifiedDate = String(modifiedTime.getDate()).padStart(2, '0');
  const rangeStartDate = `${modifiedYear}-${modifiedMonth}-${modifiedDate}`;

  return { rangeStartDate, rangeEndDate };
}

function debounce(fn) {
  clearTimeout(debounceTimeoutId);
  debounceTimeoutId = setTimeout(() => {
    return fn();
  }, 300);
}

window.addEventListener('DOMContentLoaded', init);
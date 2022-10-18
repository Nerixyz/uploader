export class AudioControl extends HTMLElement {
  static get observedAttributes() {
    return ['src'];
  }

  /** @type {HTMLAudioElement | null} */
  #audio = null;

  /** @type {HTMLDivElement | null} */
  #knob = null;
  /** @type {HTMLDivElement | null} */
  #played = null;
  /** @type {HTMLDivElement | null} */
  #track = null;
  /** @type {HTMLDivElement | null} */
  #buffered = null;
  /** @type {HTMLDivElement | null} */
  #trackWrap = null;

  /** @type {HTMLDivElement | null} */
  #container = null;
  /** @type {HTMLSpanElement | null} */
  #timeLbl = null;

  constructor() {
    super();
    this.#init();
  }

  #init() {
    const shadow = this.attachShadow({ mode: 'open' });

    // Create audio
    this.#audio = document.createElement('audio');
    this.#audio.src = this.getAttribute('src');

    // Create trackWrapper
    this.#trackWrap = withClass('div', 'track-wrap');

    // Create track
    this.#track = withClass('div', 'track');

    // Create buffered
    this.#buffered = withClass('div', 'buffered');

    // Create played
    this.#played = withClass('div', 'played');

    // Create knob
    this.#knob = withClass('div', 'knob');

    this.#track.appendChild(this.#buffered);
    this.#track.appendChild(this.#played);
    this.#track.appendChild(this.#knob);

    this.#trackWrap.appendChild(this.#track);

    this.#timeLbl = withClass('div', 'time');
    this.#timeLbl.textContent = '0:00 /';

    this.#container = withClass('div', 'contianer');
    this.#container.appendChild(this.#trackWrap);
    this.#container.appendChild(this.#timeLbl);

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    const url = new URL(import.meta.url);
    style.href = `${url.origin}/static/controls/audio-control.css`;

    shadow.appendChild(this.#audio);
    shadow.appendChild(this.#container);
    shadow.appendChild(style);
    this.#connectEvents();
  }

  #connectEvents() {
    this.#track.addEventListener('mousedown', e => {
      e.preventDefault();
      this.#showPosition(e.clientX);
      addClass(this.#track, 'dragging');

      const controller = new AbortController();
      document.addEventListener(
        'mouseup',
        e => {
          controller.abort();
          this.#applyPosition(e.clientX);
          remClass(this.#track, 'dragging');
        },
        { once: true },
      );
      document.addEventListener(
        'mousemove',
        e => {
          this.#showPosition(e.clientX);
        },
        { signal: controller.signal },
      );
    });
  }

  #calcPosition(x) {
    const bounds = this.#track.getBoundingClientRect();
    return (
      (clamp(x, bounds.x + bounds.height / 2, bounds.x + bounds.width - bounds.height / 2) -
        (bounds.x + bounds.height / 2)) /
      (bounds.width - bounds.height)
    );
  }

  #showPosition(x) {
    this.#track.style.setProperty('--prog', this.#calcPosition(x).toString());
  }

  #applyPosition(x) {
    this.#audio.currentTime = this.#calcPosition(x) * this.#audio.duration;
  }
}

if (!customElements.get('audio-control')) {
  customElements.define('audio-control', AudioControl);
}

/**
 * @template {HTMLElement} T
 * @param {T} el
 * @param {string} name
 * @returns {T}
 */
function addClass(el, name) {
  el.classList.add(name);
  return el;
}

/**
 * @template {HTMLElement} T
 * @param {T} el
 * @param {string} name
 * @returns {T}
 */
function remClass(el, name) {
  el.classList.remove(name);
  return el;
}

/**
 * @template {HTMLElement} T
 * @param {T} el
 * @param {string} name
 * @param {boolean} cond
 * @return {T}
 */
function condClass(el, name, cond) {
  if (cond) {
    addClass(el, name);
  } else {
    remClass(el, name);
  }
  return el;
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} typ
 * @param {string} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function withClass(typ, name) {
  const el = document.createElement(typ);
  return addClass(el, name);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

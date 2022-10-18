export class AudioControl extends HTMLElement {
  static get observedAttributes() {
    return ['src'];
  }

  /** @type {HTMLAudioElement | null} */
  #audio = null;

  constructor() {
    super();
    this.#init();
  }

  #init() {
    const shadow = this.attachShadow({ mode: 'open' });

    // Create audio
    this.#audio = document.createElement('audio');
    this.#audio.src = this.getAttribute('src');

    // Create wrapper
    const wrap = withClass('div', 'wrap');
    
    // Create track
    const track = withClass('div', 'track');

    // Create buffered
    const buffered = withClass('div', 'buffered');

    // Create played
    const played = withClass('div', 'played');

    // Create knob
    const knob = withClass('div', 'knob');


    wrap.appendChild(track);
    wrap.appendChild(buffered);
    wrap.appendChild(played);
    wrap.appendChild(knob);

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    const url = new URL(import.meta.url);
    style.href = `${url.origin}/static/controls/audio-control.css`;

    shadow.appendChild(this.#audio);
    shadow.appendChild(wrap);
    shadow.appendChild(style);
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
  if(cond) {
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

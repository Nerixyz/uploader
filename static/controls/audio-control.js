import { addClass, condClass, makeButton, makeSvg, remClass, withClass } from '../lib/dom-tools.js';

const PLAY_SVG = 'M8,5.14V19.14L19,12.14L8,5.14Z';
const PAUSE_SVG = 'M14,19H18V5H14M6,19H10V5H6V19Z';
const REPEAT_SVG = 'M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z';

export class AudioControl extends HTMLElement {
  static get observedAttributes() {
    return ['src'];
  }

  /** @type {HTMLAudioElement | null} */
  #audio = null;

  /** @type {import('./slider-control').SliderControl | null} */
  #slider = null;

  /** @type {HTMLDivElement | null} */
  #container = null;
  /** @type {HTMLSpanElement | null} */
  #timeLbl = null;

  /** @type {HTMLButtonElement | null} */
  #playBtn = null;
  /** @type {HTMLButtonElement | null} */
  #pauseBtn = null;
  /** @type {HTMLButtonElement | null} */
  #repeatBtn = null;

  #dragging = false;

  set playbackRate(rate) {
    this.#audio.playbackRate = rate;
  }

  set volume(lvl) {
    this.#audio.volume = lvl;
  }

  set preservesPitch(pp) {
    this.#audio.preservesPitch = pp;
    this.#audio.mozPreservesPitch = pp;
  }

  get preservesPitch() {
    return this.#audio.preservesPitch ?? this.#audio.mozPreservesPitch;
  }

  constructor() {
    super();
    this.#init();
  }

  #init() {
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    const url = new URL(import.meta.url);
    style.href = `${url.origin}/static/controls/audio-control.css`;

    shadow.appendChild(style);

    // Create audio
    this.#audio = document.createElement('audio');
    this.#audio.src = this.getAttribute('src');

    this.#slider = withClass('slider-control', 'progress');
    this.#slider.formatter = fmtAriaTime;
    this.#slider.setAttribute('value', '0');

    this.#timeLbl = withClass('span', 'time');
    this.#timeLbl.textContent = '0:00 /';

    this.#playBtn = makeButton(makeSvg(PLAY_SVG), 'Play', 'play');
    this.#pauseBtn = makeButton(makeSvg(PAUSE_SVG), 'Pause', 'pause');
    const loading = withClass('div', 'loader');

    this.#repeatBtn = makeButton(makeSvg(REPEAT_SVG), 'Repeat', 'repeat');

    this.#container = withClass('div', 'container');
    this.#container.appendChild(this.#playBtn);
    this.#container.appendChild(this.#pauseBtn);
    this.#container.appendChild(loading);
    this.#container.appendChild(this.#repeatBtn);
    this.#container.appendChild(this.#slider);
    this.#container.appendChild(this.#timeLbl);
    addClass(this.#container, 'loading');

    shadow.appendChild(this.#audio);
    shadow.appendChild(this.#container);
    this.#connectEvents();
  }

  #connectEvents() {
    this.#audio.addEventListener('timeupdate', () => {
      if (!this.#dragging) {
        this.#updateSliderMeta();
      }
      this.#updateLabel();
    });
    this.#audio.addEventListener('durationchange', () => {
      this.#updateSliderMeta();
      this.#updateLabel();
    });

    this.#slider.addEventListener('value-changed', () => {
      this.#audio.currentTime = this.#slider.value;
    });
    this.#slider.addEventListener('drag-knob-start', () => (this.#dragging = true));
    this.#slider.addEventListener('drag-knob-end', () => (this.#dragging = false));

    this.#audio.addEventListener('canplay', () => {
      remClass(this.#container, 'loading');
      remClass(this.#container, 'playing');
      addClass(this.#container, 'paused');
    });
    this.#audio.addEventListener('playing', () => {
      remClass(this.#container, 'loading');
      remClass(this.#container, 'paused');
      addClass(this.#container, 'playing');
    });
    this.#audio.addEventListener('pause', () => {
      remClass(this.#container, 'loading');
      remClass(this.#container, 'playing');
      addClass(this.#container, 'paused');
    });
    this.#audio.addEventListener('waiting', () => {
      remClass(this.#container, 'playing');
      remClass(this.#container, 'paused');
      addClass(this.#container, 'loading');
    });
    this.#playBtn.addEventListener('click', () => {
      this.#audio.play().catch(console.warn);
    });
    this.#pauseBtn.addEventListener('click', () => {
      this.#audio.pause();
    });
    this.#repeatBtn.addEventListener('click', () => {
      this.#audio.loop = !this.#audio.loop;
      condClass(this.#container, 'loop', this.#audio.loop);
    });
    condClass(this.#container, 'loop', this.#audio.loop);

    // TODO: this listener isn't unregistered
    document.addEventListener(
      'keypress',
      e => {
        if (e.code !== 'Space') {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (this.#audio.paused) {
          this.#audio.play().catch(console.warn);
        } else {
          this.#audio.pause();
        }
      },
      { capture: true },
    );
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.#audio.src = newValue;
    }
  }

  #updateSliderMeta() {
    this.#slider.min = 0;
    this.#slider.max = this.#audio.duration;
    this.#slider.value = this.#audio.currentTime;
  }

  #updateLabel() {
    this.#timeLbl.textContent = `${fmtTime(this.#audio.currentTime)} / ${fmtTime(
      this.#audio.duration,
    )}`;
  }
}

if (!customElements.get('audio-control')) {
  customElements.define('audio-control', AudioControl);
}

/**
 * @param {number} time seconds
 */
function fmtTime(time) {
  const seconds = time % 60 | 0;
  time /= 60;
  const minutes = time % 60 | 0;
  time /= 60;
  const hours = time | 0;

  if (hours > 0) {
    return `${hours.toString()}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * @param {number} time seconds
 */
function fmtAriaTime(time) {
  const seconds = time % 60 | 0;
  time /= 60;
  const minutes = time % 60 | 0;
  time /= 60;
  const hours = time | 0;

  if (hours > 0) {
    return `${hours.toString()} hours, ${minutes.toString()} minutes, ${seconds.toString()} seconds`;
  } else {
    return `${minutes.toString()} minutes, ${seconds.toString()} seconds`;
  }
}

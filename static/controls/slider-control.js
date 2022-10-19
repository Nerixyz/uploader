import { addClass, clamp, remClass, withClass } from '../lib/dom-tools.js';

export class SliderControl extends HTMLElement {
  static get observedAttributes() {
    return ['min', 'max', 'value', 'small-change'];
  }

  /** @type {HTMLDivElement | null} */
  #knob = null;
  /** @type {HTMLDivElement | null} */
  #track = null;
  /** @type {HTMLDivElement | null} */
  #trackWrap = null;

  #min = 0;
  #max = 10;
  #value = 5;
  #smallChange = 1;

  /** @type {((v: number) => string) | null} */
  #formatter = null;
  /** @type {string | null} */
  #labelledBy = null;

  /**
   * @param {number} newValue
   */
  set value(newValue) {
    this.#value = clamp(newValue, this.#min, this.#max);
    this.#updateFromValue();
  }

  get value() {
    return this.#value;
  }

  /**
   * @param {((v: number) => string) | null} fmt
   */
  set formatter(fmt) {
    this.#formatter = fmt;
    this.#updateLabels();
  }

  get formatter() {
    return this.#formatter;
  }

  /**
   * @param {string | null} id
   */
  set labelledBy(id) {
    this.#labelledBy = id;
    this.#updateLabels();
  }

  get labelledBy() {
    return this.#labelledBy;
  }

  /** @param {number} min */
  set min(min) {
    this.#min = min;
    this.#value = clamp(this.#value, this.#min, this.#max);
    this.#updateLabels();
  }

  get min() {
    return this.#min;
  }

  /** @param {number} max */
  set max(max) {
    this.#max = max;
    this.#value = clamp(this.#value, this.#min, this.#max);
    this.#updateLabels();
  }

  get max() {
    return this.#max;
  }

  set smallChange(smallChange) {
    this.#smallChange = smallChange;
  }

  get smallChange() {
    return this.#smallChange;
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
    style.href = `${url.origin}/static/controls/slider-control.css`;
    shadow.appendChild(style);

    this.#trackWrap = withClass('div', 'track-wrap');
    this.#track = withClass('div', 'track');
    const activeTrack = withClass('div', 'active-track');
    this.#knob = withClass('div', 'knob');

    this.#track.appendChild(activeTrack);
    this.#track.appendChild(this.#knob);

    this.#trackWrap.appendChild(this.#track);
    this.#trackWrap.setAttribute('tabindex', '0');
    this.#trackWrap.setAttribute('role', 'slider');
    this.#trackWrap.setAttribute('aria-orientation', 'horizontal');

    shadow.appendChild(this.#trackWrap);
    this.#connectEvents();
    this.#updateLabels();
    this.min = Number(this.getAttribute('min') ?? this.#min);
    this.max = Number(this.getAttribute('max') ?? this.#max);
    this.value = Number(this.getAttribute('value') ?? this.#value);
    this.smallChange = Number(this.getAttribute('small-change') ?? this.#smallChange);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'min': {
        this.min = Number(newValue);
        break;
      }
      case 'max': {
        this.max = Number(newValue);
        break;
      }
      case 'value': {
        this.value = Number(newValue);
        break;
      }
      case 'small-change': {
        this.smallChange = Number(newValue);
        break;
      }
    }
  }

  #connectEvents() {
    this.#track.addEventListener('mousedown', e => {
      e.preventDefault();
      addClass(this.#track, 'dragging');

      const controller = new AbortController();
      document.addEventListener(
        'mouseup',
        e => {
          controller.abort();
          remClass(this.#track, 'dragging');
          this.#showPosition(e.clientX, false);
          this.dispatchEvent(new DragKnobEndEvent());
        },
        { once: true },
      );
      document.addEventListener(
        'mousemove',
        e => {
          this.#showPosition(e.clientX, true);
        },
        { signal: controller.signal },
      );

      this.dispatchEvent(new DragKnobStartEvent());
      this.#showPosition(e.clientX, true);
    });

    this.#trackWrap.addEventListener('keydown', e => {
      const emit = (v) => {
        this.#value = clamp(v, this.#min, this.#max);
        this.#updateFromValue();
        this.dispatchEvent(new ValueChangedEvent(this.#value, false));
      };

      switch (e.key) {
        case 'Left':
        case 'ArrowLeft':
        case 'Down':
        case 'ArrowDown':
          emit(this.#value - this.#smallChange);
          break;

        case 'Right':
        case 'ArrowRight':
        case 'Up':
        case 'ArrowUp':
          emit(this.#value + this.#smallChange);
          break;

        case 'PageDown':
          emit(this.#value - 10 * this.#smallChange);
          break;

        case 'PageUp':
          emit(this.#value + 10 * this.#smallChange);
          break;

        case 'Home':
          emit(this.#min);
          break;

        case 'End':
          emit(this.#max);
          break;

        default:
          return;
      }
      e.preventDefault();
      e.stopPropagation();
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

  #showPosition(x, isDragging) {
    const relValue = this.#calcPosition(x);
    const value = (this.#max - this.#min) * relValue + this.#min;
    this.#value = value;
    this.#setDisplayedProgress(value, relValue);
    this.dispatchEvent(new ValueChangedEvent(value, isDragging));
  }

  /**
   * @param {number} value
   * @param {number} relValue
   */
  #setDisplayedProgress(value, relValue) {
    this.#track.style.setProperty('--prog', relValue.toString());
    this.#trackWrap.setAttribute('aria-valuenow', value.toString());
    if (this.#formatter) {
      this.#trackWrap.setAttribute('aria-valuetext', this.#formatter(value));
    }
  }

  #updateLabels() {
    this.#updateFromValue();
    this.#trackWrap.setAttribute('aria-valuemin', this.#min.toString());
    this.#trackWrap.setAttribute('aria-valuemax', this.#max.toString());
    if (this.#formatter) {
      this.#trackWrap.setAttribute('aria-valuetext', this.#formatter(this.#value));
    }
    if (this.#labelledBy) {
      this.#trackWrap.setAttribute('aria-labelledby', this.#labelledBy);
    }
  }

  #updateFromValue() {
    const value = clamp(this.#value, this.#min, this.#max);
    const relValue = (value - this.#min) / (this.#max - this.#min);
    this.#track.style.setProperty('--prog', relValue.toString());
    this.#trackWrap.setAttribute('aria-valuenow', value.toString());
  }
}

export class ValueChangedEvent extends Event {
  #newValue;
  #fromDrag;

  /** @return {number} */
  get newValue() {
    return this.#newValue;
  }

  /** @return {boolean} */
  get fromDrag() {
    return this.#fromDrag;
  }

  /**
   * @param {number} newValue
   * @param {boolean} fromDrag
   */
  constructor(newValue, fromDrag) {
    super('value-changed');
    this.#newValue = newValue;
    this.#fromDrag = fromDrag;
  }
}

export class DragKnobStartEvent extends Event {
  constructor() {
    super('drag-knob-start');
  }
}

export class DragKnobEndEvent extends Event {
  constructor() {
    super('drag-knob-end');
  }
}

if (!customElements.get('slider-control')) {
  customElements.define('slider-control', SliderControl);
}

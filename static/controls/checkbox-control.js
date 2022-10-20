import { addClass, condClass, makeEmptySvg, makePath, withClass } from '../lib/dom-tools.js';

const TICK_PATH = 'M 4.205 12.795 L 9 17.585 L 20.295 6.295';

export class CheckboxControl extends HTMLElement {
  static get observedAttributes() {
    return ['checked'];
  }

  #checked = false;
  /** @type {HTMLDivElement} */
  #box;
  /** @type {HTMLDivElement} */
  #wrap;

  get checked() {
    return this.#checked;
  }

  set checked(checked) {
    if (checked === this.#checked) {
      return;
    }
    this.#checked = checked;
    this.#updateState();
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
    style.href = `${url.origin}/static/controls/checkbox-control.css`;

    shadow.appendChild(style);

    this.#box = withClass('div', 'box');
    const svg = makeEmptySvg();
    const path = makePath(TICK_PATH, 'transparent');
    svg.appendChild(path);
    this.#box.appendChild(svg);

    this.#wrap = withClass('button', 'wrap');
    this.#wrap.appendChild(this.#box);
    this.#wrap.setAttribute('tabindex', '0');
    shadow.appendChild(this.#wrap);

    this.#connectEvents();
    this.#updateState();
    this.dispatchEvent(new ValueChangedEvent(this.value));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked') {
      this.checked = newValue !== null && newValue !== 'false';
    }
  }

  #connectEvents() {
    this.#wrap.addEventListener('click', e => {
      e.preventDefault();
      this.checked = !this.checked;
      this.dispatchEvent(new ValueChangedEvent(this.checked));
    });
  }

  #updateState() {
    condClass(this.#box, 'checked', this.#checked);
  }
}

export class ValueChangedEvent extends Event {
  /** @type {boolean} */
  #value;

  get value() {
    return this.value;
  }

  constructor(value) {
    super('value-changed');
    this.#value = value;
  }
}

if (!customElements.get('checkbox-control')) {
  customElements.define('checkbox-control', CheckboxControl);
}

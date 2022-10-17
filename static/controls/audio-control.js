class AudioControl extends HTMLElement {
  static get observedAttributes() { return ['src']; }

  constructor() {
    super();

  }

}

customElements.define('audio-control', AudioControl);

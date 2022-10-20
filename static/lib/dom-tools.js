/**
 * @template {Element} T
 * @param {T} el
 * @param {string} name
 * @returns {T}
 */
export function addClass(el, name) {
  el.classList.add(name);
  return el;
}

/**
 * @template {HTMLElement} T
 * @param {T} el
 * @param {string} name
 * @returns {T}
 */
export function remClass(el, name) {
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
export function condClass(el, name, cond) {
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
export function withClass(typ, name) {
  const el = document.createElement(typ);
  return addClass(el, name);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function makePath(pathData, fill = 'currentColor', stroke) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', fill);
  if (stroke) {
    path.setAttribute('stroke', stroke);
  }
  return path;
}

export function makeEmptySvg(viewBox = '0 0 24 24') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', viewBox);
  return svg;
}

export function makeSvg(pathData, viewBox = '0 0 24 24') {
  const svg = makeEmptySvg(viewBox);
  svg.append(makePath(pathData));
  return svg;
}

export function makeButton(wrap, title, clazz) {
  const btn = withClass('button', clazz);
  btn.appendChild(wrap);
  btn.title = title;
  return btn;
}

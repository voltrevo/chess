(window as any).$ = require('jquery');
const chessboardJs = require('chessboardjs');

import { entries } from './util';

const createElement = (tag: string, styles: { [key: string]: string } = {}) => {
  const el = document.createElement(tag);

  for (const [key, val] of entries(styles)) {
    (el.style as any)[key] = val;
  }

  return el;
};

window.addEventListener('load', () => {
  const boardContainer = createElement('div');

  const updateSize = () => {
    const windowSize = Math.min(window.innerHeight, window.innerWidth);
    boardContainer.style.width = `${0.9 * windowSize}px`;
    boardContainer.style.height = `${0.9 * windowSize}px`;
  };

  updateSize();
  window.addEventListener('resize', updateSize);

  document.body.appendChild(boardContainer);

  chessboardJs(boardContainer, 'start');
});

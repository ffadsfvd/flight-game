// The pause menu: resume, restart the mission, help, settings or leave to the board.

export function pauseMenuHtml(title) {
  return `<div class="sheet"><h2>Paused</h2><p>${title}</p>
  <button class="btn is-focus" data-action="resume">Resume <small>Esc</small></button>
  <button class="btn" data-action="restart">Restart</button>
  <button class="btn" data-action="controls">Controls</button>
  <button class="btn" data-action="settings">Settings</button>
  <button class="btn" data-action="quit">Quit to mission board</button>
  <button class="btn" data-action="title">Title screen</button></div>`;
}

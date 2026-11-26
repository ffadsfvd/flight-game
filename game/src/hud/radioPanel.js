// Radio and contact messages with the speaker's portrait: a queue of lines from the tower, the
// instructor, dispatch and rivals, each shown for its reading time, then the panel fades.
import { characterById } from '../career/characterRoster.js';
import { paintPortrait } from '../ui/portraitPainter.js';

/** Creates the radio panel in its container. */
export function createRadioPanel(element, onMessage = () => {}) {
  element.innerHTML = '<canvas width="96" height="96"></canvas><div><div class="who"></div><div class="line"></div></div>';
  const canvas = element.querySelector('canvas');
  const who = element.querySelector('.who');
  const line = element.querySelector('.line');
  const queue = [];
  let current = null;
  let shownFor = 0;
  let speaker = null;
  element.classList.add('is-faded');

  function show(message) {
    current = message;
    shownFor = 0;
    const c = characterById(message.who);
    if (speaker !== message.who) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 96, 96);
      paintPortrait(ctx, message.who, 96);
      speaker = message.who;
    }
    who.innerHTML = `${c.callsign}<em>${message.frequency ?? c.role}</em>`;
    line.textContent = message.text;
    element.classList.remove('is-faded');
    onMessage(message);
  }

  return {
    /** Queues a line; `priority` lines jump the queue. */
    say(whoId, text, { priority = false, duration = null, frequency = null } = {}) {
      const message = { who: whoId, text, duration: duration ?? Math.max(3.5, text.length * 0.065), frequency };
      if (priority) {
        queue.length = 0;
        show(message);
      } else if (!current) {
        show(message);
      } else {
        queue.push(message);
      }
    },
    /** Keeps the last line on screen (for screenshots and pauses). */
    hold() {
      shownFor = -9999;
    },
    clear() {
      queue.length = 0;
      current = null;
      element.classList.add('is-faded');
    },
    get current() {
      return current;
    },
    update(dt) {
      if (!current) return;
      shownFor += dt;
      if (shownFor > current.duration) {
        if (queue.length) show(queue.shift());
        else if (shownFor > current.duration + 2.5) {
          current = null;
          element.classList.add('is-faded');
        }
      }
    },
  };
}

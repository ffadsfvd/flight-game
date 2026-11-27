// Turns keys and mouse into the pilot's controls: pitch W/S, roll A/D, yaw Q/E (arrows too),
// throttle Shift/Ctrl or the wheel, brakes B, and one-shot actions (flaps F, gear G, camera C,
// lights L, refuel R, smoke T, drop or photo Space, divert J or press on K at a decision, map M, pause
// Esc, help H). Keyboard axes ramp in and out so taps make small corrections and holds make full
// deflection.
import { createKeyboardInput } from './keyboardInput.js';
import { createMouseStick } from './mouseStick.js';

export const ACTION_KEYS = {
  KeyF: 'flaps', KeyG: 'gear', KeyC: 'camera', KeyL: 'lights', KeyR: 'refuel', KeyT: 'smoke', Space: 'action', KeyI: 'antiIce',
  Escape: 'pause', KeyP: 'pause', KeyH: 'help', F1: 'help', KeyV: 'lookBack', KeyX: 'assist', Enter: 'confirm', KeyN: 'radio',
  KeyJ: 'divert', KeyK: 'pressOn', KeyM: 'map',
};

function rampAxis(current, target, dt) {
  const rate = target === 0 ? 7 : Math.sign(target) !== Math.sign(current) && current !== 0 ? 9 : 3.2;
  const step = rate * dt;
  if (Math.abs(target - current) <= step) return target;
  return current + Math.sign(target - current) * step;
}

/** Creates the control mapper on a canvas. */
export function createFlightControls(canvas, settings) {
  const keyboard = createKeyboardInput(window);
  const mouse = createMouseStick(canvas);
  const axes = { pitch: 0, roll: 0, yaw: 0 };
  const controls = { pitch: 0, roll: 0, yaw: 0, throttle: 0, brakes: 0 };

  return {
    keyboard,
    mouse,
    controls,
    /** Reads the devices for this frame; returns the list of action names triggered. */
    update(dt, enabled = true) {
      const actions = [];
      for (const press of keyboard.takePressed()) {
        const action = ACTION_KEYS[press.code];
        if (action) actions.push(action);
        if (/^Digit[0-9]$/.test(press.code) && enabled) {
          const n = Number(press.code.slice(5));
          controls.throttle = n === 0 ? 1 : n / 10;
        }
      }
      mouse.relax(dt);
      if (!enabled) {
        axes.pitch = axes.roll = axes.yaw = 0;
        controls.pitch = controls.roll = controls.yaw = 0;
        controls.brakes = 1;
        mouse.takeWheel();
        return actions;
      }
      const k = (a, b) => keyboard.anyHeld(...a) ? 1 : keyboard.anyHeld(...b) ? -1 : 0;
      const invert = settings.invertPitch ? -1 : 1;
      const pitchTarget = k(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']) * invert;
      const rollTarget = k(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
      const yawTarget = k(['KeyE'], ['KeyQ']);
      axes.pitch = rampAxis(axes.pitch, pitchTarget, dt);
      axes.roll = rampAxis(axes.roll, rollTarget, dt);
      axes.yaw = rampAxis(axes.yaw, yawTarget, dt);
      const ms = mouse.state;
      controls.pitch = Math.max(-1, Math.min(1, axes.pitch + ms.y * (settings.invertPitch ? -1 : 1)));
      controls.roll = Math.max(-1, Math.min(1, axes.roll + ms.x));
      controls.yaw = axes.yaw;
      if (keyboard.anyHeld('ShiftLeft', 'ShiftRight')) controls.throttle = Math.min(1, controls.throttle + dt * 0.55);
      if (keyboard.anyHeld('ControlLeft', 'ControlRight')) controls.throttle = Math.max(0, controls.throttle - dt * 0.55);
      controls.throttle = Math.max(0, Math.min(1, controls.throttle + mouse.takeWheel() * 0.05));
      controls.brakes = keyboard.held('KeyB') ? 1 : 0;
      return actions;
    },
    /** Snaps everything to neutral (new flight). */
    reset(throttle = 0) {
      axes.pitch = axes.roll = axes.yaw = 0;
      controls.pitch = controls.roll = controls.yaw = 0;
      controls.throttle = throttle;
      controls.brakes = 0;
      mouse.state.x = mouse.state.y = 0;
      keyboard.clear();
    },
  };
}

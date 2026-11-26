// The controls help screen: every key and mouse binding, plus flying tips.

const KEYS = [
  ['W / S', 'Pitch down / up (stick)'], ['A / D', 'Roll left / right'], ['Q / E', 'Rudder left / right, steer on the ground'],
  ['Shift / Ctrl', 'Throttle up / down'], ['1 - 0', 'Throttle 10% - 100%'], ['Mouse wheel', 'Throttle'],
  ['Mouse (click to capture)', 'Stick: pitch and roll'], ['Right mouse drag', 'Free look'], ['F', 'Flaps: next notch (up after full)'],
  ['G', 'Landing gear up / down'], ['B (hold)', 'Wheel brakes'], ['Space', 'Drop crate / water, take photo'],
  ['C', 'Camera: chase, cockpit, fly-by'], ['V', 'Look back'], ['L', 'Landing lights'],
  ['R', 'Refuel (stopped at an airfield)'], ['T', 'Display smoke'], ['X', 'Flight assist on / off'],
  ['Esc / P', 'Pause menu'], ['H', 'This help'],
];

export function controlsHelpHtml() {
  const cells = KEYS.map(([k, v]) => `<div><kbd>${k}</kbd></div><div>${v}</div>`).join('');
  return `<div class="sheet"><h2>Controls</h2><div class="keys">${cells}</div>
  <h3>Flying tips</h3><p>Pitch for speed, power for height. Hold the approach speed on final and let the approach guide's diamonds sit in the middle. Flare a few feet up by easing back, power to idle. Watch the engine temperature in long full-power climbs, and keep an eye on fuel: refuel stopped at an airfield with R.</p>
  <div class="btn-row"><button class="btn" data-action="back">Back</button></div></div>`;
}

// The controls help screen: every key and mouse binding, plus flying tips and how the flying
// discipline score, the bonus goals and the bingo decision work.

const KEYS = [
  ['W / S', 'Pitch down / up (stick)'], ['A / D', 'Roll left / right'], ['Q / E', 'Rudder left / right, steer on the ground'],
  ['Shift / Ctrl', 'Throttle up / down'], ['1 - 0', 'Throttle 10% - 100%'], ['Mouse wheel', 'Throttle'],
  ['Mouse (click to capture)', 'Stick: pitch and roll'], ['Right mouse drag', 'Free look'], ['F', 'Flaps: next notch (up after full)'],
  ['G', 'Landing gear up / down'], ['B (hold)', 'Wheel brakes'], ['Space', 'Drop crate / water, take photo'],
  ['C', 'Camera: chase, cockpit, fly-by'], ['V', 'Look back'], ['L', 'Landing lights'],
  ['R', 'Refuel (stopped at an airfield)'], ['T', 'Display smoke'], ['I', 'Anti-ice on / off (costs 8% power)'], ['X', 'Flight assist on / off'],
  ['J / K', 'At bingo fuel: divert / press on'], ['Esc / P', 'Pause menu'], ['H', 'This help'],
];

export function controlsHelpHtml() {
  const cells = KEYS.map(([k, v]) => `<div><kbd>${k}</kbd></div><div>${v}</div>`).join('');
  return `<div class="sheet"><h2>Controls</h2><div class="keys">${cells}</div>
  <h3>Flying tips</h3><p>Pitch for speed, power for height. Hold the approach speed on final and let the approach guide's diamonds sit in the middle. Flare a few feet up by easing back, power to idle. Watch the engine temperature in long full-power climbs, and keep an eye on fuel: refuel stopped at an airfield with R.</p>
  <h3>Discipline, bonus goals and bingo</h3><p>Every glide-path gate passed on speed and on the path, every coordinated turn, every ring inside its speed band (the cyan bracket on the speed tape) and smooth power earn points and grow a streak up to ×4; a stall warning, a slammed throttle or an unstable gate breaks it. Bonus goals pay credits and count in the medal. At bingo fuel choose: divert to the nearest field for part of the pay, or press on for all of it on a thin reserve.</p>
  <div class="btn-row"><button class="btn" data-action="back">Back</button></div></div>`;
}

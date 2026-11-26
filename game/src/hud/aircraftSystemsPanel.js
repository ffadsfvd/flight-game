// Engine controls and configuration: throttle and RPM bars, flap setting in degrees, gear state
// (down, up, in transit, damaged), brakes, landing lights and flight assist.

const FLAP_DEGREES = ['UP', '15°', '35°'];

function row(label, id) {
  return `<div class="sys-row"><label>${label}</label><div class="bar"><i data-id="${id}"></i></div><b data-id="${id}-v"></b></div>`;
}

/** Creates the systems panel in its container. */
export function createAircraftSystemsPanel(element) {
  element.innerHTML = `<div class="panel-title">Power &amp; configuration</div>${row('THROTTLE', 'thr')}${row('RPM', 'rpm')}<div class="sys-tags"><span data-id="flaps"></span><span data-id="gear"></span><span data-id="brakes">BRK</span></div><div class="sys-tags"><span data-id="lights">LDG LT</span><span data-id="assist">ASSIST</span><span data-id="smoke">SMOKE</span></div>`;
  const q = (id) => element.querySelector(`[data-id="${id}"]`);
  const el = { thr: q('thr'), thrV: q('thr-v'), rpm: q('rpm'), rpmV: q('rpm-v'), flaps: q('flaps'), gear: q('gear'), brakes: q('brakes'), lights: q('lights'), assist: q('assist'), smoke: q('smoke') };
  return {
    update(d) {
      el.thr.style.width = `${Math.round(d.throttle * 100)}%`;
      el.thr.style.background = d.throttle > 0.92 ? '#ffb02e' : '#ffc46a';
      el.thrV.textContent = `${Math.round(d.throttle * 100)}%`;
      const rpm = d.isJet ? Math.round(d.rpm * 100) : Math.round(d.rpm * 2700);
      el.rpm.style.width = `${Math.round(d.rpm * 100)}%`;
      el.rpm.style.background = d.engineRunning ? '#5fe3d0' : '#ff4d3d';
      el.rpmV.textContent = d.engineRunning ? (d.isJet ? `${rpm}%` : String(rpm)) : 'OFF';
      const moving = Math.abs(d.flaps - [0, 0.4, 1][Math.min(2, d.flapSetting)]) > 0.08;
      el.flaps.textContent = `FLAPS ${FLAP_DEGREES[d.flapSetting] ?? d.flapSetting}`;
      el.flaps.className = moving ? 'moving' : d.flapSetting > 0 ? 'on' : '';
      const gearMoving = d.gear > 0.02 && d.gear < 0.98;
      el.gear.textContent = !d.gearRetracts ? 'GEAR FIXED' : gearMoving ? 'GEAR ···' : d.gearDown ? 'GEAR DOWN' : 'GEAR UP';
      el.gear.className = d.gearHealth < 0.6 ? 'bad' : gearMoving ? 'moving' : d.gear > 0.98 ? 'on' : '';
      el.brakes.className = d.brakes > 0 ? 'bad' : '';
      el.lights.className = d.lights ? 'on' : '';
      el.assist.className = d.assist ? 'on' : '';
      el.smoke.className = d.smoke ? 'on' : '';
    },
  };
}

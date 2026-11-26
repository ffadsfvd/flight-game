// Cockpit warnings worked out from the flight state: STALL, PULL UP (terrain closing fast), LOW
// FUEL, OVERSPEED, OVERHEAT, ENGINE OUT, GEAR UP on a low approach, FLAPS beyond their speed,
// ICING, BANK ANGLE and over-G. Returns the active list so the HUD and the sound can both use it.

/** The warnings active for a readout: [{ id, text, level: 'warn'|'danger' }]. */
export function activeWarnings(d, { approachActive = false, runwayApproach = false } = {}) {
  const list = [];
  if (d.onGround) {
    if (!d.engineRunning) list.push({ id: 'engine', text: 'ENGINE OUT', level: 'danger' });
    if (d.fuelFrac < 0.12) list.push({ id: 'fuel', text: 'LOW FUEL', level: 'warn' });
    return list;
  }
  if (d.stall > 0.25 || (d.kt < d.vs1Kt * 1.06 && d.aglFt > 30)) list.push({ id: 'stall', text: 'STALL', level: 'danger' });
  const timeToImpact = d.vsFpm < -300 ? d.aglFt / (-d.vsFpm / 60) : Infinity;
  if (timeToImpact < 9 && d.aglFt < 900 && !(approachActive && d.vsFpm > -1100 && d.gearDown)) list.push({ id: 'pullup', text: 'PULL UP', level: 'danger' });
  if (d.kt > d.vneKt * 0.98) list.push({ id: 'overspeed', text: 'OVERSPEED', level: 'danger' });
  if (!d.engineRunning) list.push({ id: 'engine', text: 'ENGINE OUT', level: 'danger' });
  else if (d.temp > d.tempRed) list.push({ id: 'overheat', text: 'ENGINE HOT', level: 'danger' });
  else if (d.temp > d.tempRed - 20) list.push({ id: 'hot', text: 'TEMP HIGH', level: 'warn' });
  if (d.fuelFrac < 0.12) list.push({ id: 'fuel', text: d.fuelKg < 1 ? 'NO FUEL' : 'LOW FUEL', level: d.fuelFrac < 0.05 ? 'danger' : 'warn' });
  if (d.gearRetracts && runwayApproach && !d.gearDown && d.aglFt < 600 && d.vsFpm < -150) list.push({ id: 'gear', text: 'GEAR UP', level: 'danger' });
  if (d.gearRetracts && approachActive && !runwayApproach && d.gearDown && d.aglFt < 600) list.push({ id: 'gear', text: 'GEAR DOWN ON WATER', level: 'danger' });
  if (d.flaps > 0.05 && d.kt > d.vfeKt) list.push({ id: 'flaps', text: 'FLAP SPEED', level: 'warn' });
  if (d.ice > 0.25) list.push({ id: 'ice', text: d.ice > 0.6 ? 'HEAVY ICE' : 'ICING', level: d.ice > 0.6 ? 'danger' : 'warn' });
  if (Math.abs(d.bank) > 60) list.push({ id: 'bank', text: 'BANK ANGLE', level: 'warn' });
  if (d.gForce > 4.5) list.push({ id: 'g', text: `${d.gForce.toFixed(1)} G`, level: 'warn' });
  return list;
}

/** Shows the warnings as flashing tags in their container. */
export function createWarningPanel(element) {
  let last = '';
  return {
    update(list) {
      const key = list.map((w) => w.id + w.text).join('|');
      if (key === last) return;
      last = key;
      element.innerHTML = list.slice(0, 4).map((w) => `<span class="${w.level}">${w.text}</span>`).join('');
    },
  };
}

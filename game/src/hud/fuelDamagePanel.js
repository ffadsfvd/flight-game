// Fuel and condition: fuel in kilograms with minutes of endurance at the current power, engine
// temperature against its red line, and the health of the engine, airframe and gear, plus the
// cargo or water load when the mission carries one.

function row(label, id) {
  return `<div class="sys-row"><label>${label}</label><div class="bar"><i data-id="${id}"></i></div><b data-id="${id}-v"></b></div>`;
}

function healthColor(v) {
  return v > 0.75 ? '#6be38a' : v > 0.4 ? '#ffb02e' : '#ff4d3d';
}

/** Creates the fuel and damage panel in its container. */
export function createFuelDamagePanel(element) {
  element.innerHTML = `<div class="panel-title">Fuel &amp; condition</div>${row('FUEL', 'fuel')}${row('ENG TEMP', 'temp')}${row('ENGINE', 'eng')}${row('AIRFRAME', 'air')}${row('GEAR', 'gear')}<div data-id="load-row">${row('LOAD', 'load')}</div>`;
  const q = (id) => element.querySelector(`[data-id="${id}"]`);
  const el = {};
  for (const id of ['fuel', 'temp', 'eng', 'air', 'gear', 'load']) {
    el[id] = q(id);
    el[`${id}V`] = q(`${id}-v`);
  }
  const loadRow = q('load-row');
  return {
    update(d, load) {
      el.fuel.style.width = `${Math.round(d.fuelFrac * 100)}%`;
      el.fuel.style.background = d.fuelFrac > 0.25 ? '#ffc46a' : '#ff4d3d';
      el.fuelV.textContent = d.refuelling ? 'FILLING' : `${Math.round(d.fuelKg)}kg ${d.engineRunning ? `${Math.floor(d.fuelMinutes)}m` : ''}`;
      const t = Math.max(0, Math.min(1, (d.temp - 40) / (d.tempRed + 20 - 40)));
      el.temp.style.width = `${Math.round(t * 100)}%`;
      el.temp.style.background = d.temp > d.tempRed ? '#ff4d3d' : d.temp > d.tempRed - 25 ? '#ffb02e' : '#6be38a';
      el.tempV.textContent = `${Math.round(d.temp)}°`;
      for (const [id, v] of [['eng', d.engineHealth], ['air', d.airframe], ['gear', d.gearHealth]]) {
        el[id].style.width = `${Math.round(v * 100)}%`;
        el[id].style.background = healthColor(v);
        el[`${id}V`].textContent = `${Math.round(v * 100)}%`;
      }
      if (load) {
        loadRow.style.display = '';
        el.load.style.width = `${Math.round(load.fraction * 100)}%`;
        el.load.style.background = load.color ?? '#5fe3d0';
        el.loadV.textContent = load.text;
        el.load.parentElement.previousElementSibling.textContent = load.label;
      } else {
        loadRow.style.display = 'none';
      }
    },
  };
}

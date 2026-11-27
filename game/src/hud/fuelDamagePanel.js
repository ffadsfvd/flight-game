// Fuel and condition: fuel in kilograms with minutes of endurance at the current power, the fuel
// plan (bingo, reserve, range, the nearest field and the fuel flow), engine temperature against
// its red line, the health of the engine, airframe and gear with what each damaged part does to
// the flying, plus the cargo, water or comfort load and the ice load in icing conditions.

function row(label, id) {
  return `<div class="sys-row"><label>${label}</label><div class="bar"><i data-id="${id}"></i></div><b data-id="${id}-v"></b></div>`;
}

function healthColor(v) {
  return v > 0.75 ? '#6be38a' : v > 0.4 ? '#ffb02e' : '#ff4d3d';
}

/** Creates the fuel and damage panel in its container. */
export function createFuelDamagePanel(element) {
  element.innerHTML = `<div class="panel-title">Fuel &amp; condition</div>${row('FUEL', 'fuel')}<div class="fuel-plan" data-id="plan"></div>${row('ENG TEMP', 'temp')}${row('ENGINE', 'eng')}${row('AIRFRAME', 'air')}${row('GEAR', 'gear')}<div class="dmg-effects" data-id="effects"></div><div data-id="ice-row">${row('ICE', 'ice')}</div><div data-id="load-row">${row('LOAD', 'load')}</div>`;
  const q = (id) => element.querySelector(`[data-id="${id}"]`);
  const el = {};
  for (const id of ['fuel', 'temp', 'eng', 'air', 'gear', 'ice', 'load']) {
    el[id] = q(id);
    el[`${id}V`] = q(`${id}-v`);
  }
  const plan = q('plan');
  const effects = q('effects');
  const loadRow = q('load-row');
  const iceRow = q('ice-row');
  iceRow.style.display = 'none';
  let lastPlan = '';
  let lastEffects = '';
  return {
    update(d, load, fuelPlan = null, damage = []) {
      const state = fuelPlan?.state ?? 'ok';
      el.fuel.style.width = `${Math.round(d.fuelFrac * 100)}%`;
      el.fuel.style.background = state === 'reserve' || d.fuelFrac < 0.12 ? '#ff4d3d' : state === 'bingo' ? '#ffb02e' : '#ffc46a';
      el.fuelV.textContent = d.refuelling ? 'FILLING' : `${Math.round(d.fuelKg)}kg ${d.engineRunning ? `${Math.floor(d.fuelMinutes)}m` : ''}`;
      if (fuelPlan) {
        const html = `<span class="${state === 'bingo' ? 'is-warn' : ''}"><i>BINGO</i><b>${Math.round(fuelPlan.bingoKg)}</b></span><span class="${state === 'reserve' ? 'is-bad' : ''}"><i>RESERVE</i><b>${Math.round(fuelPlan.reserveKg)}</b></span><span><i>RANGE</i><b>${fuelPlan.rangeNm < 10 ? fuelPlan.rangeNm.toFixed(1) : Math.round(fuelPlan.rangeNm)} NM</b></span><small>${fuelPlan.nearest ? `${fuelPlan.nearest.code} ${fuelPlan.nearestNm.toFixed(1)} NM` : ''} · FLOW ${fuelPlan.flowKgMin.toFixed(1)} KG/MIN</small>`;
        if (html !== lastPlan) {
          plan.innerHTML = html;
          lastPlan = html;
        }
        plan.style.display = '';
      } else {
        plan.style.display = 'none';
      }
      const t = Math.max(0, Math.min(1, (d.temp - 40) / (d.tempRed + 20 - 40)));
      el.temp.style.width = `${Math.round(t * 100)}%`;
      el.temp.style.background = d.temp > d.tempRed ? '#ff4d3d' : d.temp > d.tempRed - 25 ? '#ffb02e' : '#6be38a';
      el.tempV.textContent = `${Math.round(d.temp)}°`;
      for (const [id, v] of [['eng', d.engineHealth], ['air', d.airframe], ['gear', d.gearHealth]]) {
        el[id].style.width = `${Math.round(v * 100)}%`;
        el[id].style.background = healthColor(v);
        el[`${id}V`].textContent = `${Math.round(v * 100)}%`;
      }
      const effectsHtml = damage.slice(0, 3).map((e) => `<div class="${e.level}"><b>${e.part}</b> ${e.text}</div>`).join('');
      if (effectsHtml !== lastEffects) {
        effects.innerHTML = effectsHtml;
        lastEffects = effectsHtml;
      }
      if (d.icingLevelFt !== null || d.ice > 0.01) {
        iceRow.style.display = '';
        el.ice.style.width = `${Math.max(2, Math.round(d.ice * 100))}%`;
        el.ice.style.background = d.ice > 0.6 ? '#ff4d3d' : d.ice > 0.25 ? '#ffb02e' : '#bfe4ff';
        el.iceV.textContent = d.ice > 0.01 ? `${Math.round(d.ice * 100)}%` : `FZL ${Math.round((d.icingLevelFt ?? 0) / 10) * 10}`;
      } else {
        iceRow.style.display = 'none';
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

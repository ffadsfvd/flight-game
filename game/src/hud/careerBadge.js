// The career badge in the corner: pilot rank, money, the local time and weather of the sortie.

/** Creates the badge in its container. */
export function createCareerBadge(element) {
  let last = '';
  return {
    update({ rank, money, clock, weather, aircraft }) {
      const key = `${rank}|${money}|${clock}|${weather}|${aircraft}`;
      if (key === last) return;
      last = key;
      element.innerHTML = `<span class="rank">★ ${rank}</span><span class="money">${money.toLocaleString('en-US')} cr</span><span class="clock">${aircraft} · ${clock} · ${weather}</span>`;
    },
  };
}

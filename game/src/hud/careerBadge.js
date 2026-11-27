// The career badge in the corner: pilot rank, money, medals won of all missions, and the aircraft
// of the sortie.

/** Creates the badge in its container. */
export function createCareerBadge(element) {
  let last = '';
  return {
    update({ rank, money, aircraft, medals }) {
      const medalText = medals ? `${medals.medals}/${medals.missions}` : '';
      const key = `${rank}|${money}|${aircraft}|${medalText}`;
      if (key === last) return;
      last = key;
      element.innerHTML = `<span class="rank">★ ${rank}</span><span class="money">${money.toLocaleString('en-US')} cr</span>${medals ? `<span class="medals">● ${medalText} <small>MEDALS</small></span>` : ''}<span class="clock">${aircraft}</span>`;
    },
  };
}

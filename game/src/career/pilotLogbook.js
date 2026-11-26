// The pilot's logbook: hours flown, landings and their grades, crashes, distance, missions and
// best times, plus the last flights as entries.

export function createLogbook() {
  return { hours: 0, landings: 0, greasers: 0, hardLandings: 0, crashes: 0, distanceKm: 0, missionsFlown: 0, missionsPassed: 0, bestTimes: {}, entries: [], fieldsLanded: {}, aircraftFlown: {}, nightLandings: 0, waterLandings: 0, aPlusLandings: 0 };
}

/** Adds a flight to the log. */
export function logFlight(log, { title, aircraft, aircraftId, night, seconds, distance, landings, crashed, result }) {
  log.hours += seconds / 3600;
  log.distanceKm += distance / 1000;
  log.fieldsLanded = log.fieldsLanded ?? {};
  log.aircraftFlown = log.aircraftFlown ?? {};
  if (aircraftId && seconds > 20) log.aircraftFlown[aircraftId] = true;
  for (const l of landings) {
    log.landings += 1;
    if (l.fpm <= 150) log.greasers += 1;
    if (l.fpm > 500) log.hardLandings += 1;
    if (l.runway) log.fieldsLanded[l.runway.id] = true;
    if (l.water) log.waterLandings = (log.waterLandings ?? 0) + 1;
    if (night && l.runway && !l.water) log.nightLandings = (log.nightLandings ?? 0) + 1;
    if (l.grade === 'A+') log.aPlusLandings = (log.aPlusLandings ?? 0) + 1;
  }
  if (crashed) log.crashes += 1;
  if (result && result.missionId) {
    log.missionsFlown += 1;
    if (result.success) log.missionsPassed += 1;
    if (result.success && result.courseTime) {
      const best = log.bestTimes[result.missionId];
      if (!best || result.courseTime < best) log.bestTimes[result.missionId] = Math.round(result.courseTime * 10) / 10;
    }
  }
  log.entries.unshift({
    title,
    aircraft,
    minutes: Math.round(seconds / 6) / 10,
    outcome: crashed ? 'Crashed' : result?.success ? `Passed ${result.medal !== 'none' ? `(${result.medal})` : ''}` : result?.missionId ? 'Failed' : 'Free flight',
    landing: landings.at(-1)?.grade ?? '-',
    date: new Date().toISOString().slice(0, 10),
  });
  log.entries = log.entries.slice(0, 14);
}

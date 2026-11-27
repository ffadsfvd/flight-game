// Objective: fly a course of rings in order against the clock (and, in a race, against AI rivals).
// A ring passed outside costs a time penalty; the score compares the time with the par time.
// Every ring is flown inside a speed band (shown on the speed tape) that the discipline score
// and the bonus goals judge.
import * as THREE from 'three';
import { createRingMarkers, ringCrossing } from '../../effects/ringMarkers.js';
import { failEngine } from '../../flight/engineModel.js';
import { ringSpeedBand } from '../bonusGoals.js';

/** Turns a course [[x, z, height, absolute?]] into rings facing along the course. */
export function buildCourseRings(course, terrain, radius = 26) {
  const points = course.map(([x, z, h, absolute]) => new THREE.Vector3(x, absolute ? h : Math.max(0, terrain.heightAt(x, z)) + h, z));
  return points.map((p, i) => {
    const next = points[i + 1] ?? p.clone().add(p.clone().sub(points[i - 1]));
    const prev = points[i - 1] ?? p.clone().sub(next.clone().sub(p));
    const normal = next.clone().sub(prev).setY((next.y - prev.y) * 0.5).normalize();
    return { position: p, normal, radius: course[i][4] ?? radius };
  });
}

export function createRingCourseObjective(stage) {
  let rings = [];
  let markers = null;
  let next = 0;
  let start = null;
  let elapsed = 0;
  let penalties = 0;
  let missed = 0;
  let rivals = [];
  let finishPlace = 1;
  let band = null;
  const last = new THREE.Vector3();
  const objective = {
    kind: stage.rivals ? 'race' : 'rings',
    score: 0,
    rows: [],
    /** The speed band in knots the rings are judged in (null for races and soaring). */
    get band() {
      return band;
    },
    /** Index of the next ring to fly. */
    get next() {
      return next;
    },
    begin(ctx) {
      rings = buildCourseRings(stage.course, ctx.world.terrain, stage.radius);
      markers = createRingMarkers(ctx.scene, rings);
      last.copy(ctx.body.position);
      start = ctx.time;
      band = stage.rivals || stage.engineOff ? null : ringSpeedBand(stage, ctx.body.spec);
      ctx.report({ kind: 'course-start', time: ctx.time, band });
      // Soaring courses are flown with the motor stopped: climb in thermals and ridge lift.
      if (stage.engineOff) failEngine(ctx.body.engine, 'motor stopped for soaring');
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
      if (stage.rivals) {
        const path = rings.map((r) => r.position.clone());
        rivals = stage.rivals.map((r, i) => ctx.createAiFlyer(ctx.scene, { aircraft: r.aircraft, path, speed: r.speed, startDelay: r.delay ?? 0, lateral: (i - 1) * 14, start: ctx.body.position.clone().add(new THREE.Vector3((i + 1) * 22, 4, 18 + i * 10)), name: r.name, color: r.color }));
      }
      ctx.cleanup(() => objective.end());
    },
    /** Removes the rings and rivals once the course is flown. */
    end() {
      if (!markers) return;
      markers.dispose();
      markers = null;
      for (const r of rivals) r.dispose();
      rivals = [];
    },
    update(dt, ctx) {
      elapsed = ctx.time - start;
      const p = ctx.body.position;
      if (next < rings.length) {
        const hit = ringCrossing(rings[next], last, p);
        if (hit === 'hit') {
          next += 1;
          ctx.sound('ring');
          ctx.report({ kind: 'ring', n: next, total: rings.length, kt: ctx.body.airspeed * KT, band, hit: true });
          if (next < rings.length) ctx.toast(`RING ${next} / ${rings.length}`, 'good');
        } else if (hit === 'miss') {
          next += 1;
          missed += 1;
          penalties += stage.penalty ?? 5;
          ctx.sound('miss');
          ctx.report({ kind: 'ring', n: next, total: rings.length, kt: ctx.body.airspeed * KT, band, hit: false });
          ctx.toast(`MISSED RING  +${stage.penalty ?? 5} s`, 'bad');
        }
      }
      last.copy(p);
      markers.update(next, ctx.time, dt);
      for (const r of rivals) r.update(dt, ctx.time - start);
      if (next >= rings.length) {
        const total = elapsed + penalties;
        const par = stage.par ?? 120;
        objective.score = Math.round(Math.max(0, Math.min(100, 100 - ((total - par) / par) * 120)) * (missed ? Math.max(0.4, 1 - missed * 0.15) : 1));
        if (rivals.length) {
          finishPlace = 1 + rivals.filter((r) => r.finished).length;
          objective.score = Math.round([100, 72, 48, 30][Math.min(3, finishPlace - 1)] * (missed ? Math.max(0.5, 1 - missed * 0.12) : 1));
          objective.rows.push(['Finishing place', `${finishPlace}${['st', 'nd', 'rd', 'th'][Math.min(3, finishPlace - 1)]} of ${rivals.length + 1}`]);
          ctx.report({ kind: 'race-done', place: finishPlace });
        }
        objective.rows.push(['Course time', `${total.toFixed(1)} s (par ${par} s)`], ['Rings', `${rings.length - missed} / ${rings.length}`]);
        objective.time = total;
        ctx.report({ kind: 'course-done', time: total, total: rings.length, missed });
        return 'done';
      }
      return 'active';
    },
    info() {
      const stats = [['RINGS', `${next} / ${rings.length}`], ['TIME', `${(elapsed + penalties).toFixed(1)} s`], band ? ['BAND KT', `${band[0]}-${band[1]}`] : ['PAR', `${stage.par ?? 120} s`]];
      if (band) stats[1] = ['TIME / PAR', `${(elapsed + penalties).toFixed(0)} / ${stage.par ?? 120} s`];
      if (rivals.length) {
        const ahead = rivals.filter((r) => r.progress > next / Math.max(1, rings.length)).length;
        stats[2] = ['PLACE', `${1 + ahead} / ${rivals.length + 1}`];
      }
      return { objective: stage.label ?? `Fly through ring ${Math.min(rings.length, next + 1)} of ${rings.length}`, next: stage.hint ?? 'Gold ring is next, cyan ones follow', stats, progress: next / Math.max(1, rings.length) };
    },
    markers() {
      return rings.map((r, i) => ({ x: r.position.x, z: r.position.z, kind: 'ring', active: i === next, label: i === next ? String(i + 1) : null })).filter((m, i) => i >= next);
    },
    others() {
      return rivals.map((r) => ({ x: r.position.x, z: r.position.z, color: r.color }));
    },
    guidance: () => null,
    /** Marks the first `n` rings as flown `seconds` ago and returns ring n (screenshots, tests). */
    jumpTo(n, ctx, seconds = 0) {
      next = Math.min(n, rings.length - 1);
      start = ctx.time - seconds;
      return rings[next];
    },
    get rings() {
      return rings;
    },
    bearing(ctx) {
      if (next >= rings.length) return null;
      const r = rings[next].position;
      return (THREE.MathUtils.radToDeg(Math.atan2(r.x - ctx.body.position.x, -(r.z - ctx.body.position.z))) + 360) % 360;
    },
  };
  return objective;
}

const KT = 1.94384;

// Objective: land at an airfield and come to a stop, graded on the touchdown. Variants: a set
// runway end or the one into the wind, a short-field limit (touch down within N metres of the
// threshold), a water landing on a seaplane lane, and a dead-stick landing after the engine is
// failed on purpose (any runway counts, the nearest is suggested).
import * as THREE from 'three';
import { AIRFIELDS, airfieldById, landingDirection, nearestAirfield } from '../../world/airfieldDirectory.js';
import { approachGuidance } from '../../world/approachGeometry.js';
import { failEngine } from '../../flight/engineModel.js';

function intoWindEnd(field, windFrom) {
  const diff = (h) => Math.abs(((h - windFrom + 540) % 360) - 180);
  return diff(landingDirection(field, 0).heading) <= diff(landingDirection(field, 1).heading) ? 0 : 1;
}

export function createLandingObjective(stage) {
  let report = null;
  let fieldId = stage.field;
  let end = stage.end ?? null;
  let warned = false;
  const objective = {
    kind: stage.water ? 'water-landing' : stage.failEngine ? 'dead-stick' : 'landing',
    score: 0,
    rows: [],
    report: null,
    begin(ctx) {
      if (stage.failEngine) {
        failEngine(ctx.body.engine, 'a broken crankshaft');
        ctx.sound('engine-fail');
        const options = AIRFIELDS.filter((f) => (f.kind === 'water') === Boolean(ctx.body.spec.floats && stage.water));
        const near = nearestAirfield(ctx.body.position.x, ctx.body.position.z, (f) => f.kind !== 'water' || ctx.body.spec.floats);
        fieldId = near.field.id;
        if (!options.length) fieldId = near.field.id;
      }
      if (fieldId === 'nearest') fieldId = nearestAirfield(ctx.body.position.x, ctx.body.position.z, (f) => (f.kind === 'water') === Boolean(stage.water)).field.id;
      if (end === null) end = intoWindEnd(airfieldById(fieldId), ctx.windFrom());
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    onEvent(e, ctx) {
      if (e.kind !== 'landed' || report) return;
      const r = e.report;
      const okField = stage.failEngine ? r.runway !== null : r.runway && r.runway.id === fieldId;
      if (!okField) {
        if (!warned) {
          ctx.radio(stage.coach ?? 'ines', r.runway ? `That was ${r.runway.name}. We need you at ${airfieldById(fieldId).name}.` : 'Off-field landing. Get back in the air if you can.', { priority: true });
          warned = true;
        }
        if (stage.failEngine || !r.runway) {
          report = r;
          objective.failedReason = r.runway ? 'Landed at the wrong airfield' : `Off-field landing ${r.place}`;
        }
        return;
      }
      report = r;
    },
    update(dt, ctx) {
      if (!report) return 'active';
      if (objective.failedReason) {
        objective.score = 0;
        return 'failed';
      }
      let score = report.score;
      objective.rows.push(['Touchdown', `${report.fpm} fpm`], ['Centreline', `${report.centreline.toFixed(1)} m ${report.side}`], ['Past threshold', `${Math.round(report.distance)} m`], ['Bounces', String(report.bounces)], ['Landing grade', report.grade]);
      if (stage.shortField) {
        const ok = report.distance >= 0 && report.distance <= stage.shortField;
        objective.rows.push(['Short-field limit', ok ? `made it (${stage.shortField} m)` : `missed (${stage.shortField} m)`]);
        score = ok ? Math.min(100, score + 10) : score * 0.5;
      }
      objective.score = Math.round(score);
      objective.report = report;
      ctx.toast(`LANDING ${report.grade}`, report.score >= 55 ? 'good' : 'bad');
      return 'done';
    },
    info(ctx) {
      const field = airfieldById(fieldId);
      const g = approachGuidance(fieldId, end, ctx.body.position);
      const dir = landingDirection(field, end);
      const dist = Math.hypot(field.x - ctx.body.position.x, field.z - ctx.body.position.z);
      const what = field.kind === 'water' ? `water lane ${dir.name}` : `runway ${dir.name}`;
      let next = stage.hint ?? (field.kind === 'water' ? 'Gear UP on water, flaps down, gentle descent' : 'Gear down, full flaps, stabilised on the glide path');
      if (ctx.body.onGround && !report) next = 'Brakes (B) and come to a stop';
      if (stage.failEngine && !ctx.body.onGround) next = `Glide at ${Math.round(ctx.body.spec.vApproach * 1.944 * 1.15)} kt, nearest field ${(dist / 1852).toFixed(1)} NM`;
      return {
        objective: stage.label ?? `Land on ${what} at ${field.name}`,
        next,
        stats: [['DIST', dist > 900 ? `${(dist / 1852).toFixed(1)} NM` : `${Math.round(dist)} m`], ['RWY', dir.name], stage.shortField ? ['LIMIT', `${stage.shortField} m`] : ['TGT SPD', `${Math.round(ctx.body.spec.vApproach * 1.944)} KT`]],
        progress: Math.max(0, Math.min(1, 1 - g.distance / 6000)),
      };
    },
    markers() {
      const field = airfieldById(fieldId);
      const dir = landingDirection(field, end);
      return [{ x: dir.threshold.x, z: dir.threshold.z, kind: 'target', active: true, label: field.code }];
    },
    guidance(ctx) {
      const g = approachGuidance(fieldId, end, ctx.body.position);
      if (g.distance > 9000 || g.distance < -airfieldById(fieldId).length || Math.abs(g.lateral) > 2500) return null;
      if (ctx.body.onGround && ctx.body.groundSpeed < 8) return null;
      return g;
    },
    bearing(ctx) {
      const field = airfieldById(fieldId);
      const dir = landingDirection(field, end);
      const g = approachGuidance(fieldId, end, ctx.body.position);
      const aim = g.distance > 1500 ? { x: dir.threshold.x - Math.sin(THREE.MathUtils.degToRad(dir.heading)) * 1200, z: dir.threshold.z + Math.cos(THREE.MathUtils.degToRad(dir.heading)) * 1200 } : dir.threshold;
      return (THREE.MathUtils.radToDeg(Math.atan2(aim.x - ctx.body.position.x, -(aim.z - ctx.body.position.z))) + 360) % 360;
    },
    target() {
      return { fieldId, end };
    },
  };
  return objective;
}

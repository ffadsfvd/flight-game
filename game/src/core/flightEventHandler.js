// Reacts to what just happened in flight: touchdowns kick up dust and thump, bounces and hard
// landings get called out, bird strikes, failures and wing ice come over the radio, cockpit
// switches click and whirr, and a crash sets off the fireball.

const FPM_LIMIT_CALL = 450;

/** Creates the handler with the systems it talks to. */
export function createFlightEventHandler({ effects, sfx, hud, radioFor }) {
  return {
    handleSim(events, body) {
      for (const e of events) {
        if (e.kind === 'touchdown') {
          const td = e.touchdown;
          sfx.play(td.water ? 'splash' : 'touchdown', Math.min(1.5, 0.4 + td.fpm / 500));
          effects.burst(td.water ? 'splash' : 'touchdown', body.position, body.velocity);
          if (td.fpm > FPM_LIMIT_CALL) hud.toast(`${td.fpm > body.spec.gearLimitFpm ? 'HARD' : 'FIRM'} ${td.fpm} FPM`, 'bad');
        } else if (e.kind === 'bounce') {
          hud.toast('BOUNCE', 'bad');
        } else if (e.kind === 'landed') {
          hud.toast(`LANDED · ${e.report.grade} · ${e.report.fpm} FPM`, e.report.score >= 55 ? 'good' : 'bad');
        } else if (e.kind === 'liftoff') {
          hud.toast('AIRBORNE', 'good');
        } else if (e.kind === 'bird') {
          sfx.play('bird');
          effects.burst('bird', body.position, body.velocity);
          hud.radio.say(radioFor('warn'), e.part === 'engine' ? `${e.text}. Power is capped now: keep the speed up and fly a long, flat final.` : `${e.text}. She'll pull ${e.text.includes('left') ? 'left' : 'right'}: hold a little opposite aileron.`, { priority: true });
        } else if (e.kind === 'hard-landing' || e.kind === 'overstress' || e.kind === 'overspeed' || e.kind === 'flaps' || e.kind === 'gear' || e.kind === 'scrape') {
          sfx.play('warning');
          hud.toast(e.text.toUpperCase(), 'bad');
        } else if (e.kind === 'refuel-full') {
          hud.toast('TANKS FULL', 'good');
        } else if (e.kind === 'icing') {
          sfx.play('warning');
          hud.toast('ICE ON THE WINGS', 'bad');
          const fzl = Math.round((e.level * 3.281) / 10) * 10;
          hud.radio.say(radioFor('coach'), body.antiIce ? `Ice is still building on the wings. Get down below the freezing level, ${fzl} ft, and keep your speed up.` : `Ice is building on the wings. Anti-ice on, that's I, or get below the freezing level at ${fzl} ft. Your stall speed is going up.`, { priority: true });
        } else if (e.kind === 'engine-out') {
          const planned = e.cause === 'a broken crankshaft' || e.cause === 'motor stopped for soaring';
          sfx.play(planned && e.cause !== 'a broken crankshaft' ? 'click' : 'engine-fail');
          hud.toast(e.cause === 'motor stopped for soaring' ? 'MOTOR OFF · SOARING' : 'ENGINE FAILURE', e.cause === 'motor stopped for soaring' ? 'good' : 'bad');
          if (!planned) hud.radio.say(radioFor('warn'), `Engine failure: ${e.cause}. Best glide speed, pick the nearest field and commit.`, { priority: true });
        } else if (e.kind === 'ended') {
          if (e.result.severity === 'crash') {
            effects.burst('crash', body.position);
            sfx.play('crash');
          } else if (e.result.severity === 'ditch') {
            effects.burst('splash', body.position, body.velocity);
            sfx.play('splash');
          } else {
            sfx.play('touchdown', 1.5);
          }
        }
      }
    },
    handleNotices(notices) {
      for (const n of notices) {
        if (n.kind === 'gear') {
          sfx.play('gear');
          hud.toast(n.down ? 'GEAR DOWN' : 'GEAR UP');
        } else if (n.kind === 'gear-blocked') hud.toast('GEAR LOCKED ON THE GROUND', 'bad');
        else if (n.kind === 'gear-stuck') hud.toast("GEAR DAMAGED · WON'T RETRACT", 'bad');
        else if (n.kind === 'gear-fixed') hud.toast('FIXED GEAR ON THIS AIRCRAFT');
        else if (n.kind === 'flaps') {
          sfx.play('flaps');
          hud.toast(`FLAPS ${['UP', '15°', '35°'][n.setting] ?? n.setting}`);
        } else if (n.kind === 'lights') hud.toast(n.on ? 'LANDING LIGHTS ON' : 'LANDING LIGHTS OFF');
        else if (n.kind === 'antiIce') hud.toast(n.on ? 'ANTI-ICE ON · 8% LESS POWER' : 'ANTI-ICE OFF', n.on ? 'good' : '');
        else if (n.kind === 'smoke') hud.toast(n.on ? 'SMOKE ON' : 'SMOKE OFF');
        else if (n.kind === 'assist') hud.toast(n.on ? 'FLIGHT ASSIST ON' : 'FLIGHT ASSIST OFF');
        else if (n.kind === 'refuel-start') hud.toast(`REFUELLING AT ${n.field.code}`, 'good');
        else if (n.kind === 'refuel-stop') hud.toast('REFUELLING STOPPED');
        else if (n.kind === 'refuel-denied') hud.toast('REFUEL: STOP AT AN AIRFIELD FIRST', 'bad');
        else if (n.kind === 'camera') sfx.play('click');
      }
    },
  };
}

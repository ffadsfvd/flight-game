// A forest fire as burning patches: each hot spot is a set of patches spread over its radius, each
// with its own heat. Water puts out the patches it lands on (the flames there shrink and go out
// and the patch steams white), so a good drop visibly knocks the fire down where it hits and a
// miss changes nothing. Once a hot spot has lost most of its heat, its last patches die down on
// their own (the ground crews mop up), so every hot spot can be finished in a pass or two.

const DIE_DOWN_BELOW = 0.4;
const DIE_DOWN_RATE = 0.11;
const STEAM_SECONDS = 7;

/** Creates a hot spot of `radius` m at (x, y, z): about one patch per 22 m across it. */
export function createBurningFire(x, y, z, radius) {
  const count = Math.max(6, Math.round((radius * radius) / 160));
  const patches = [];
  for (let i = 0; i < count; i += 1) {
    // Sunflower spread: even cover of the circle, no clumps.
    const a = i * 2.39996;
    const r = radius * 0.92 * Math.sqrt((i + 0.5) / count);
    patches.push({ x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, heat: 1, steam: 0 });
  }
  const patchRadius = radius / Math.sqrt(count) * 1.05;
  const fire = {
    x,
    y,
    z,
    radius,
    patches,
    patchRadius,
    /** Mean heat of the patches, 0..1. Setting it sets every patch (0 puts the fire out). */
    get intensity() {
      return patches.reduce((s, p) => s + p.heat, 0) / patches.length;
    },
    set intensity(value) {
      for (const p of patches) p.heat = Math.min(p.heat, Math.max(0, value));
    },
    /** True while any patch still burns. */
    get burning() {
      return patches.some((p) => p.heat > 0.02);
    },
    /**
     * Water landing at (wx, wz): `amount` is its share of a full tank, `spread` the radius it
     * covers on the ground. Returns the heat it took off this fire (0 for a miss).
     */
    douse(wx, wz, amount, spread) {
      let knocked = 0;
      const strength = amount * 5.4 * (28 / spread);
      for (const p of patches) {
        const d = Math.hypot(p.x - wx, p.z - wz);
        if (d >= spread || p.heat <= 0) continue;
        const knock = Math.min(p.heat, strength * (1 - d / spread));
        p.heat -= knock;
        knocked += knock;
        if (knock > 0.004) p.steam = STEAM_SECONDS;
      }
      return knocked / patches.length;
    },
    /** Per frame: steam fades; a fire down to its last patches dies down by itself. */
    update(dt) {
      const dying = fire.intensity < DIE_DOWN_BELOW;
      for (const p of patches) {
        if (p.steam > 0) p.steam = Math.max(0, p.steam - dt);
        if (dying && p.heat > 0) {
          const before = p.heat;
          p.heat = Math.max(0, p.heat - DIE_DOWN_RATE * dt);
          if (before > 0.02) p.steam = Math.max(p.steam, 2);
        }
      }
    },
  };
  return fire;
}

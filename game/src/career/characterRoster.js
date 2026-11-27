// The people of the Solvara career: who they are, what they do on the radio and how their
// portraits are painted.

export const CHARACTERS = {
  ines: { name: 'Ines Varga', role: 'Chief instructor', callsign: 'Varga', skin: '#c68a5f', hair: '#2a1a12', hairStyle: 'bun', shirt: '#13827f', backdrop: '#1d4f5c', headset: true },
  dario: { name: 'Dario Pell', role: 'Tower 118.40', callsign: 'Marenza Tower', skin: '#e2b690', hair: '#5a3a22', hairStyle: 'short', shirt: '#2f4f7a', backdrop: '#26365a', headset: true, beard: true },
  mags: { name: 'Mags Okafor', role: 'Brightwater Freight', callsign: 'Brightwater Ops', skin: '#7a4a2e', hair: '#141010', hairStyle: 'curly', shirt: '#e8641e', backdrop: '#5a2e18', glasses: true },
  lena: { name: 'Lena Sato', role: 'Solvara Sea Rescue', callsign: 'Rescue Control', skin: '#e9c6a2', hair: '#1a1414', hairStyle: 'bob', shirt: '#c8321f', backdrop: '#5a1e1a', headset: true },
  bruno: { name: 'Bruno Keel', role: 'Island fire marshal', callsign: 'Fire Base Calvera', skin: '#d4a07a', hair: '#9a9a96', hairStyle: 'bald', shirt: '#b8401e', backdrop: '#4a2a14', helmet: true, beard: true },
  teo: { name: 'Teo Ranieri', role: 'Rival racer, team Scirocco', callsign: 'Scirocco One', skin: '#d9a87e', hair: '#c79a3a', hairStyle: 'swept', shirt: '#1f3f8a', backdrop: '#1c2a52', shades: true },
  nadia: { name: 'Nadia Ferro', role: 'Solvara Gazette photographer', callsign: 'Gazette', skin: '#b9825a', hair: '#6a2c1a', hairStyle: 'long', shirt: '#7a4ab0', backdrop: '#3a2458' },
  pia: { name: 'Pia Lund', role: 'Unicom 122.75', callsign: 'Solvara Radio', skin: '#f0c9a8', hair: '#8a5a2a', hairStyle: 'bob', shirt: '#3a6a4a', backdrop: '#1e3a2e', headset: true },
  rosa: { name: 'Rosa Bellini', role: 'Celeste Air Tours', callsign: 'Celeste Tours', skin: '#c9946a', hair: '#3a1e14', hairStyle: 'long', shirt: '#2a8a9a', backdrop: '#17464f', glasses: true },
  walt: { name: 'Walt Haddon', role: 'Passenger, row two', callsign: 'Passenger', skin: '#efc7a4', hair: '#b89a6a', hairStyle: 'short', shirt: '#d84a7a', backdrop: '#4a2238', shades: true },
  sofi: { name: 'Sofi Bruni', role: 'Passenger, honeymoon', callsign: 'Passenger', skin: '#d9a47c', hair: '#1e1410', hairStyle: 'swept', shirt: '#f2e6d0', backdrop: '#5a3a2a' },
  elio: { name: 'Elio Vasa', role: 'Passenger, Lumeno fisherman', callsign: 'Passenger', skin: '#b07a4e', hair: '#d8d4cc', hairStyle: 'bald', shirt: '#2f5a3a', backdrop: '#1e3a28', beard: true },
};

/** The character for an id (the instructor if unknown). */
export function characterById(id) {
  return CHARACTERS[id] ?? CHARACTERS.ines;
}

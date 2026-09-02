// Reference table of animal average weights (in kg) and top speeds (in
// km/h) used for the "animal-equivalence" reveals. Sorted ascending by
// weight. wikiTitle is the Wikipedia article title used to fetch a real photo.
const ANIMALS = [
  { name: "cat", plural: "cats", article: "A", weightKg: 4.5, topSpeedKmh: 48, wikiTitle: "Cat" },
  { name: "dog", plural: "dogs", article: "A", weightKg: 10, topSpeedKmh: 30, wikiTitle: "Dog" },
  { name: "penguin", plural: "penguins", article: "A", weightKg: 30, topSpeedKmh: 6, wikiTitle: "Emperor penguin" },
  { name: "wolf", plural: "wolves", article: "A", weightKg: 49, topSpeedKmh: 50, wikiTitle: "Wolf" },
  { name: "cheetah", plural: "cheetahs", article: "A", weightKg: 50, topSpeedKmh: 70, wikiTitle: "Cheetah" },
  { name: "kangaroo", plural: "kangaroos", article: "A", weightKg: 55, topSpeedKmh: 55, wikiTitle: "Red kangaroo" },
  { name: "goat", plural: "goats", article: "A", weightKg: 66, topSpeedKmh: 25, wikiTitle: "Goat" },
  { name: "sheep", plural: "sheep", article: "A", weightKg: 80, topSpeedKmh: 40, wikiTitle: "Sheep" },
  { name: "panda", plural: "pandas", article: "A", weightKg: 100, topSpeedKmh: 20, wikiTitle: "Giant panda" },
  { name: "black bear", plural: "black bears", article: "A", weightKg: 135, topSpeedKmh: 48, wikiTitle: "American black bear" },
  { name: "gorilla", plural: "gorillas", article: "A", weightKg: 160, topSpeedKmh: 40, wikiTitle: "Gorilla" },
  { name: "lion", plural: "lions", article: "A", weightKg: 180, topSpeedKmh: 80, wikiTitle: "Lion" },
  { name: "tiger", plural: "tigers", article: "A", weightKg: 200, topSpeedKmh: 65, wikiTitle: "Tiger" },
  { name: "grizzly bear", plural: "grizzly bears", article: "A", weightKg: 225, topSpeedKmh: 56, wikiTitle: "Grizzly bear" },
  { name: "dolphin", plural: "dolphins", article: "A", weightKg: 300, topSpeedKmh: 30, wikiTitle: "Common bottlenose dolphin" },
  { name: "polar bear", plural: "polar bears", article: "A", weightKg: 450, topSpeedKmh: 40, wikiTitle: "Polar bear" },
  { name: "horse", plural: "horses", article: "A", weightKg: 500, topSpeedKmh: 70, wikiTitle: "Horse" },
  { name: "cow", plural: "cows", article: "A", weightKg: 635, topSpeedKmh: 35, wikiTitle: "Cattle" },
  { name: "shark", plural: "sharks", article: "A", weightKg: 700, topSpeedKmh: 50, wikiTitle: "Great white shark" },
  { name: "bison", plural: "bison", article: "A", weightKg: 800, topSpeedKmh: 57, wikiTitle: "American bison" },
  { name: "giraffe", plural: "giraffes", article: "A", weightKg: 800, topSpeedKmh: 60, wikiTitle: "Giraffe" },
  { name: "hippo", plural: "hippos", article: "A", weightKg: 1500, topSpeedKmh: 30, wikiTitle: "Hippopotamus" },
  { name: "rhino", plural: "rhinos", article: "A", weightKg: 2300, topSpeedKmh: 50, wikiTitle: "White rhinoceros" },
  { name: "elephant", plural: "elephants", article: "An", weightKg: 5400, topSpeedKmh: 40, wikiTitle: "African bush elephant" },
  { name: "blue whale", plural: "blue whales", article: "A", weightKg: 130000, topSpeedKmh: 30, wikiTitle: "Blue whale" },
];

// Weighted-random choice among candidates, favoring lower `score` (a
// closer match) without making it a guaranteed argmin — otherwise anyone
// with a consistent training routine (similar total volume/pace session to
// session) would always land on the exact same single "best" animal, since
// that band of totals always resolves to one winner. A small epsilon keeps
// the weighting from blowing up on a near-perfect (score ≈ 0) match.
function weightedRandomPick(candidates) {
  const EPSILON = 0.15;
  const weights = candidates.map(c => 1 / (c.score + EPSILON));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

// Re-rolls once if the pick matches the last-shown animal for this reveal
// type, so consecutive sessions with similar totals can't repeat back to back.
function pickWithNoImmediateRepeat(candidates, storageKey) {
  let chosen = weightedRandomPick(candidates);
  const last = localStorage.getItem(storageKey);
  if (chosen.animal.name === last && candidates.length > 1) {
    chosen = weightedRandomPick(candidates.filter(c => c.animal.name !== last));
  }
  localStorage.setItem(storageKey, chosen.animal.name);
  return chosen;
}

// Picks the animal that yields a "readable" (satisfying) count for a given
// total weight lifted (in kg) — weighted toward counts near a sweet-spot
// magnitude, but randomized among reasonable matches rather than always
// the single closest one.
function pickAnimal(totalKg) {
  const SWEET_SPOT = 30;
  const candidates = [];

  for (const animal of ANIMALS) {
    const count = totalKg / animal.weightKg;
    if (count < 1) continue; // skip animals that would round to 0
    const score = Math.abs(Math.log10(count) - Math.log10(SWEET_SPOT));
    candidates.push({ animal, count, score });
  }

  // Total weight is lighter than even the smallest animal on the list.
  if (candidates.length === 0) {
    const animal = ANIMALS[0];
    return { animal, count: Math.max(1, Math.round(totalKg / animal.weightKg)) };
  }

  const chosen = pickWithNoImmediateRepeat(candidates, 'ft_last_weight_animal');
  const count = Math.max(1, Math.round(chosen.count));
  return { animal: chosen.animal, count };
}

// Picks the animal whose top speed makes the runner's average speed land
// near a "satisfying" percentage of it (sweet spot ~50%), same weighted-random
// approach as pickAnimal — avoids always comparing against the same animal
// for a runner with a fairly consistent pace.
function pickSpeedAnimal(speedKmh) {
  const TARGET_PCT = 0.5;
  const candidates = [];

  for (const animal of ANIMALS) {
    if (!animal.topSpeedKmh) continue;
    const pct = speedKmh / animal.topSpeedKmh;
    if (pct <= 0) continue;
    const score = Math.abs(Math.log10(pct) - Math.log10(TARGET_PCT));
    candidates.push({ animal, pct, score });
  }

  if (candidates.length === 0) {
    const animal = ANIMALS.find(a => a.topSpeedKmh) || ANIMALS[0];
    return { animal, pct: Math.max(1, Math.round((speedKmh / animal.topSpeedKmh) * 100)) };
  }

  const chosen = pickWithNoImmediateRepeat(candidates, 'ft_last_speed_animal');
  const pct = Math.max(1, Math.round((speedKmh / chosen.animal.topSpeedKmh) * 100));
  return { animal: chosen.animal, pct };
}

// Fetches a real photo for the animal from Wikipedia's pageimages API.
// Falls back gracefully (returns null) if offline or the lookup fails.
const _imageCache = {};
async function fetchAnimalImage(wikiTitle) {
  if (_imageCache[wikiTitle]) return _imageCache[wikiTitle];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const pages = data.query && data.query.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    const src = page && page.thumbnail && page.thumbnail.source;
    if (src) _imageCache[wikiTitle] = src;
    return src || null;
  } catch (e) {
    return null;
  }
}

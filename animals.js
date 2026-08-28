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

// Picks the animal that yields the most "readable" (satisfying) count for a
// given total weight lifted (in kg). Prefers counts near a sweet-spot
// magnitude rather than always defaulting to the same animal.
function pickAnimal(totalKg) {
  const SWEET_SPOT = 30;
  let best = null;
  let bestScore = Infinity;

  for (const animal of ANIMALS) {
    const count = totalKg / animal.weightKg;
    if (count < 1) continue; // skip animals that would round to 0
    const score = Math.abs(Math.log10(count) - Math.log10(SWEET_SPOT));
    if (score < bestScore) {
      bestScore = score;
      best = animal;
    }
  }

  // Total weight is lighter than even the smallest animal on the list.
  if (!best) best = ANIMALS[0];

  const rawCount = totalKg / best.weightKg;
  const count = Math.max(1, Math.round(rawCount));
  return { animal: best, count };
}

// Picks the animal whose top speed makes the runner's average speed land
// near a "satisfying" percentage of it (sweet spot ~50%), same log-distance
// approach as pickAnimal — avoids always comparing against the fastest
// (cheetah) or slowest (penguin) animal on the list.
function pickSpeedAnimal(speedKmh) {
  const TARGET_PCT = 0.5;
  let best = null;
  let bestScore = Infinity;

  for (const animal of ANIMALS) {
    if (!animal.topSpeedKmh) continue;
    const pct = speedKmh / animal.topSpeedKmh;
    if (pct <= 0) continue;
    const score = Math.abs(Math.log10(pct) - Math.log10(TARGET_PCT));
    if (score < bestScore) {
      bestScore = score;
      best = animal;
    }
  }

  if (!best) best = ANIMALS.find(a => a.topSpeedKmh) || ANIMALS[0];

  const pct = Math.max(1, Math.round((speedKmh / best.topSpeedKmh) * 100));
  return { animal: best, pct };
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

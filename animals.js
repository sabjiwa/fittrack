// Reference table of animal average weights (in kg) used for the
// "animal-equivalence" reveal. Sorted ascending by weight.
// wikiTitle is the Wikipedia article title used to fetch a real photo.
const ANIMALS = [
  { name: "mouse", plural: "mice", article: "A", weightKg: 0.03, wikiTitle: "House mouse" },
  { name: "rat", plural: "rats", article: "A", weightKg: 0.3, wikiTitle: "Brown rat" },
  { name: "squirrel", plural: "squirrels", article: "A", weightKg: 0.45, wikiTitle: "Squirrel" },
  { name: "cat", plural: "cats", article: "A", weightKg: 4.5, wikiTitle: "Cat" },
  { name: "small dog", plural: "small dogs", article: "A", weightKg: 10, wikiTitle: "Beagle" },
  { name: "wolf", plural: "wolves", article: "A", weightKg: 49, wikiTitle: "Wolf" },
  { name: "kangaroo", plural: "kangaroos", article: "A", weightKg: 55, wikiTitle: "Red kangaroo" },
  { name: "goat", plural: "goats", article: "A", weightKg: 66, wikiTitle: "Goat" },
  { name: "sheep", plural: "sheep", article: "A", weightKg: 80, wikiTitle: "Sheep" },
  { name: "pig", plural: "pigs", article: "A", weightKg: 100, wikiTitle: "Domestic pig" },
  { name: "black bear", plural: "black bears", article: "A", weightKg: 135, wikiTitle: "American black bear" },
  { name: "gorilla", plural: "gorillas", article: "A", weightKg: 160, wikiTitle: "Gorilla" },
  { name: "lion", plural: "lions", article: "A", weightKg: 180, wikiTitle: "Lion" },
  { name: "tiger", plural: "tigers", article: "A", weightKg: 200, wikiTitle: "Tiger" },
  { name: "grizzly bear", plural: "grizzly bears", article: "A", weightKg: 225, wikiTitle: "Grizzly bear" },
  { name: "polar bear", plural: "polar bears", article: "A", weightKg: 450, wikiTitle: "Polar bear" },
  { name: "horse", plural: "horses", article: "A", weightKg: 500, wikiTitle: "Horse" },
  { name: "cow", plural: "cows", article: "A", weightKg: 635, wikiTitle: "Cattle" },
  { name: "bison", plural: "bison", article: "A", weightKg: 800, wikiTitle: "American bison" },
  { name: "giraffe", plural: "giraffes", article: "A", weightKg: 800, wikiTitle: "Giraffe" },
  { name: "hippo", plural: "hippos", article: "A", weightKg: 1500, wikiTitle: "Hippopotamus" },
  { name: "rhino", plural: "rhinos", article: "A", weightKg: 2300, wikiTitle: "White rhinoceros" },
  { name: "elephant", plural: "elephants", article: "An", weightKg: 5400, wikiTitle: "African bush elephant" },
  { name: "blue whale", plural: "blue whales", article: "A", weightKg: 130000, wikiTitle: "Blue whale" },
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

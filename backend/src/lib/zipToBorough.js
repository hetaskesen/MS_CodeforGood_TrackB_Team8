/**
 * NYC zip code to borough mapping.
 * Manhattan 10001-10282, Bronx 10451-10475, Brooklyn 11201-11256,
 * Queens 11004-11109 & 11351-11697, Staten Island 10301-10314.
 */

const RANGES = [
  [10001, 10282, "Manhattan"],
  [10301, 10314, "Staten Island"],
  [10451, 10475, "Bronx"],
  [11004, 11109, "Queens"],
  [11201, 11256, "Brooklyn"],
  [11351, 11697, "Queens"],
];

/** @param {string} zip */
function getBorough(zip) {
  if (!zip || typeof zip !== "string") return null;
  const n = parseInt(zip.trim(), 10);
  if (Number.isNaN(n)) return null;
  for (const [lo, hi, borough] of RANGES) {
    if (n >= lo && n <= hi) return borough;
  }
  return null;
}

const ZIP_TO_BOROUGH = {};
for (const [lo, hi, borough] of RANGES) {
  for (let z = lo; z <= hi; z++) {
    ZIP_TO_BOROUGH[String(z)] = borough;
  }
}

module.exports = { getBorough, ZIP_TO_BOROUGH };

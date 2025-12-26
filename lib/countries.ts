/**
 * FIFA Countries Database
 * Contains all FIFA member nations with their codes for flag display
 */

export interface Country {
  name: string;
  fifa: string;      // FIFA 3-letter code
  iso2: string;      // ISO 3166-1 alpha-2 (for flagcdn.com)
  aliases?: string[]; // Alternative names/spellings
}

// All 211 FIFA member nations + common territories
export const countries: Country[] = [
  // A
  { name: "Afghanistan", fifa: "afg", iso2: "af" },
  { name: "Albania", fifa: "alb", iso2: "al" },
  { name: "Algeria", fifa: "alg", iso2: "dz" },
  { name: "American Samoa", fifa: "asa", iso2: "as" },
  { name: "Andorra", fifa: "and", iso2: "ad" },
  { name: "Angola", fifa: "ang", iso2: "ao" },
  { name: "Anguilla", fifa: "aia", iso2: "ai" },
  { name: "Antigua and Barbuda", fifa: "atg", iso2: "ag", aliases: ["Antigua"] },
  { name: "Argentina", fifa: "arg", iso2: "ar" },
  { name: "Armenia", fifa: "arm", iso2: "am" },
  { name: "Aruba", fifa: "aru", iso2: "aw" },
  { name: "Australia", fifa: "aus", iso2: "au" },
  { name: "Austria", fifa: "aut", iso2: "at" },
  { name: "Azerbaijan", fifa: "aze", iso2: "az" },

  // B
  { name: "Bahamas", fifa: "bah", iso2: "bs" },
  { name: "Bahrain", fifa: "bhr", iso2: "bh" },
  { name: "Bangladesh", fifa: "ban", iso2: "bd" },
  { name: "Barbados", fifa: "brb", iso2: "bb" },
  { name: "Belarus", fifa: "blr", iso2: "by" },
  { name: "Belgium", fifa: "bel", iso2: "be" },
  { name: "Belize", fifa: "blz", iso2: "bz" },
  { name: "Benin", fifa: "ben", iso2: "bj" },
  { name: "Bermuda", fifa: "ber", iso2: "bm" },
  { name: "Bhutan", fifa: "bhu", iso2: "bt" },
  { name: "Bolivia", fifa: "bol", iso2: "bo" },
  { name: "Bosnia and Herzegovina", fifa: "bih", iso2: "ba", aliases: ["Bosnia"] },
  { name: "Botswana", fifa: "bot", iso2: "bw" },
  { name: "Brazil", fifa: "bra", iso2: "br", aliases: ["Brasil"] },
  { name: "British Virgin Islands", fifa: "vgb", iso2: "vg" },
  { name: "Brunei", fifa: "bru", iso2: "bn", aliases: ["Brunei Darussalam"] },
  { name: "Bulgaria", fifa: "bul", iso2: "bg" },
  { name: "Burkina Faso", fifa: "bfa", iso2: "bf" },
  { name: "Burundi", fifa: "bdi", iso2: "bi" },

  // C
  { name: "Cambodia", fifa: "cam", iso2: "kh" },
  { name: "Cameroon", fifa: "cmr", iso2: "cm" },
  { name: "Canada", fifa: "can", iso2: "ca" },
  { name: "Cape Verde", fifa: "cpv", iso2: "cv", aliases: ["Cabo Verde"] },
  { name: "Cayman Islands", fifa: "cay", iso2: "ky" },
  { name: "Central African Republic", fifa: "cta", iso2: "cf" },
  { name: "Chad", fifa: "cha", iso2: "td" },
  { name: "Chile", fifa: "chi", iso2: "cl" },
  { name: "China", fifa: "chn", iso2: "cn", aliases: ["China PR", "People's Republic of China"] },
  { name: "Chinese Taipei", fifa: "tpe", iso2: "tw", aliases: ["Taiwan"] },
  { name: "Colombia", fifa: "col", iso2: "co" },
  { name: "Comoros", fifa: "com", iso2: "km" },
  { name: "Congo", fifa: "cgo", iso2: "cg", aliases: ["Republic of the Congo", "Congo-Brazzaville"] },
  { name: "Congo DR", fifa: "cod", iso2: "cd", aliases: ["Democratic Republic of the Congo", "Congo-Kinshasa", "DRC"] },
  { name: "Cook Islands", fifa: "cok", iso2: "ck" },
  { name: "Costa Rica", fifa: "crc", iso2: "cr" },
  { name: "Croatia", fifa: "cro", iso2: "hr" },
  { name: "Cuba", fifa: "cub", iso2: "cu" },
  { name: "Curaçao", fifa: "cuw", iso2: "cw", aliases: ["Curacao"] },
  { name: "Cyprus", fifa: "cyp", iso2: "cy" },
  { name: "Czech Republic", fifa: "cze", iso2: "cz", aliases: ["Czechia"] },

  // D
  { name: "Denmark", fifa: "den", iso2: "dk" },
  { name: "Djibouti", fifa: "dji", iso2: "dj" },
  { name: "Dominica", fifa: "dma", iso2: "dm" },
  { name: "Dominican Republic", fifa: "dom", iso2: "do" },

  // E
  { name: "Ecuador", fifa: "ecu", iso2: "ec" },
  { name: "Egypt", fifa: "egy", iso2: "eg" },
  { name: "El Salvador", fifa: "slv", iso2: "sv" },
  { name: "England", fifa: "eng", iso2: "gb-eng" },
  { name: "Equatorial Guinea", fifa: "eqg", iso2: "gq" },
  { name: "Eritrea", fifa: "eri", iso2: "er" },
  { name: "Estonia", fifa: "est", iso2: "ee" },
  { name: "Eswatini", fifa: "swz", iso2: "sz", aliases: ["Swaziland"] },
  { name: "Ethiopia", fifa: "eth", iso2: "et" },

  // F
  { name: "Faroe Islands", fifa: "fro", iso2: "fo" },
  { name: "Fiji", fifa: "fij", iso2: "fj" },
  { name: "Finland", fifa: "fin", iso2: "fi" },
  { name: "France", fifa: "fra", iso2: "fr" },

  // G
  { name: "Gabon", fifa: "gab", iso2: "ga" },
  { name: "Gambia", fifa: "gam", iso2: "gm", aliases: ["The Gambia"] },
  { name: "Georgia", fifa: "geo", iso2: "ge" },
  { name: "Germany", fifa: "ger", iso2: "de" },
  { name: "Ghana", fifa: "gha", iso2: "gh" },
  { name: "Gibraltar", fifa: "gib", iso2: "gi" },
  { name: "Greece", fifa: "gre", iso2: "gr" },
  { name: "Grenada", fifa: "grn", iso2: "gd" },
  { name: "Guam", fifa: "gum", iso2: "gu" },
  { name: "Guatemala", fifa: "gua", iso2: "gt" },
  { name: "Guinea", fifa: "gui", iso2: "gn" },
  { name: "Guinea-Bissau", fifa: "gnb", iso2: "gw" },
  { name: "Guyana", fifa: "guy", iso2: "gy" },

  // H
  { name: "Haiti", fifa: "hai", iso2: "ht" },
  { name: "Honduras", fifa: "hon", iso2: "hn" },
  { name: "Hong Kong", fifa: "hkg", iso2: "hk" },
  { name: "Hungary", fifa: "hun", iso2: "hu" },

  // I
  { name: "Iceland", fifa: "isl", iso2: "is" },
  { name: "India", fifa: "ind", iso2: "in" },
  { name: "Indonesia", fifa: "idn", iso2: "id" },
  { name: "Iran", fifa: "irn", iso2: "ir", aliases: ["IR Iran", "Islamic Republic of Iran"] },
  { name: "Iraq", fifa: "irq", iso2: "iq" },
  { name: "Ireland", fifa: "irl", iso2: "ie", aliases: ["Republic of Ireland"] },
  { name: "Israel", fifa: "isr", iso2: "il" },
  { name: "Italy", fifa: "ita", iso2: "it" },
  { name: "Ivory Coast", fifa: "civ", iso2: "ci", aliases: ["Côte d'Ivoire", "Cote d'Ivoire"] },

  // J
  { name: "Jamaica", fifa: "jam", iso2: "jm" },
  { name: "Japan", fifa: "jpn", iso2: "jp" },
  { name: "Jordan", fifa: "jor", iso2: "jo" },

  // K
  { name: "Kazakhstan", fifa: "kaz", iso2: "kz" },
  { name: "Kenya", fifa: "ken", iso2: "ke" },
  { name: "Kosovo", fifa: "kos", iso2: "xk" },
  { name: "Kuwait", fifa: "kuw", iso2: "kw" },
  { name: "Kyrgyzstan", fifa: "kgz", iso2: "kg" },

  // L
  { name: "Laos", fifa: "lao", iso2: "la" },
  { name: "Latvia", fifa: "lva", iso2: "lv" },
  { name: "Lebanon", fifa: "lbn", iso2: "lb" },
  { name: "Lesotho", fifa: "les", iso2: "ls" },
  { name: "Liberia", fifa: "lbr", iso2: "lr" },
  { name: "Libya", fifa: "lby", iso2: "ly" },
  { name: "Liechtenstein", fifa: "lie", iso2: "li" },
  { name: "Lithuania", fifa: "ltu", iso2: "lt" },
  { name: "Luxembourg", fifa: "lux", iso2: "lu" },

  // M
  { name: "Macau", fifa: "mac", iso2: "mo", aliases: ["Macao"] },
  { name: "Madagascar", fifa: "mad", iso2: "mg" },
  { name: "Malawi", fifa: "mwi", iso2: "mw" },
  { name: "Malaysia", fifa: "mas", iso2: "my" },
  { name: "Maldives", fifa: "mdv", iso2: "mv" },
  { name: "Mali", fifa: "mli", iso2: "ml" },
  { name: "Malta", fifa: "mlt", iso2: "mt" },
  { name: "Mauritania", fifa: "mtn", iso2: "mr" },
  { name: "Mauritius", fifa: "mri", iso2: "mu" },
  { name: "Mexico", fifa: "mex", iso2: "mx" },
  { name: "Moldova", fifa: "mda", iso2: "md" },
  { name: "Mongolia", fifa: "mng", iso2: "mn" },
  { name: "Montenegro", fifa: "mne", iso2: "me" },
  { name: "Montserrat", fifa: "msr", iso2: "ms" },
  { name: "Morocco", fifa: "mar", iso2: "ma" },
  { name: "Mozambique", fifa: "moz", iso2: "mz" },
  { name: "Myanmar", fifa: "mya", iso2: "mm", aliases: ["Burma"] },

  // N
  { name: "Namibia", fifa: "nam", iso2: "na" },
  { name: "Nepal", fifa: "nep", iso2: "np" },
  { name: "Netherlands", fifa: "ned", iso2: "nl", aliases: ["Holland"] },
  { name: "New Caledonia", fifa: "ncl", iso2: "nc" },
  { name: "New Zealand", fifa: "nzl", iso2: "nz" },
  { name: "Nicaragua", fifa: "nca", iso2: "ni" },
  { name: "Niger", fifa: "nig", iso2: "ne" },
  { name: "Nigeria", fifa: "nga", iso2: "ng" },
  { name: "North Korea", fifa: "prk", iso2: "kp", aliases: ["Korea DPR", "DPR Korea"] },
  { name: "North Macedonia", fifa: "mkd", iso2: "mk", aliases: ["Macedonia", "FYR Macedonia"] },
  { name: "Northern Ireland", fifa: "nir", iso2: "gb-nir" },
  { name: "Norway", fifa: "nor", iso2: "no" },

  // O
  { name: "Oman", fifa: "oma", iso2: "om" },

  // P
  { name: "Pakistan", fifa: "pak", iso2: "pk" },
  { name: "Palestine", fifa: "ple", iso2: "ps" },
  { name: "Panama", fifa: "pan", iso2: "pa" },
  { name: "Papua New Guinea", fifa: "png", iso2: "pg" },
  { name: "Paraguay", fifa: "par", iso2: "py" },
  { name: "Peru", fifa: "per", iso2: "pe" },
  { name: "Philippines", fifa: "phi", iso2: "ph" },
  { name: "Poland", fifa: "pol", iso2: "pl" },
  { name: "Portugal", fifa: "por", iso2: "pt" },
  { name: "Puerto Rico", fifa: "pur", iso2: "pr" },

  // Q
  { name: "Qatar", fifa: "qat", iso2: "qa" },

  // R
  { name: "Romania", fifa: "rou", iso2: "ro" },
  { name: "Russia", fifa: "rus", iso2: "ru" },
  { name: "Rwanda", fifa: "rwa", iso2: "rw" },

  // S
  { name: "Saint Kitts and Nevis", fifa: "skn", iso2: "kn", aliases: ["St Kitts and Nevis", "St. Kitts"] },
  { name: "Saint Lucia", fifa: "lca", iso2: "lc", aliases: ["St Lucia", "St. Lucia"] },
  { name: "Saint Vincent and the Grenadines", fifa: "vin", iso2: "vc", aliases: ["St Vincent", "St. Vincent"] },
  { name: "Samoa", fifa: "sam", iso2: "ws" },
  { name: "San Marino", fifa: "smr", iso2: "sm" },
  { name: "São Tomé and Príncipe", fifa: "stp", iso2: "st", aliases: ["Sao Tome and Principe"] },
  { name: "Saudi Arabia", fifa: "ksa", iso2: "sa" },
  { name: "Scotland", fifa: "sco", iso2: "gb-sct" },
  { name: "Senegal", fifa: "sen", iso2: "sn" },
  { name: "Serbia", fifa: "srb", iso2: "rs" },
  { name: "Seychelles", fifa: "sey", iso2: "sc" },
  { name: "Sierra Leone", fifa: "sle", iso2: "sl" },
  { name: "Singapore", fifa: "sin", iso2: "sg" },
  { name: "Slovakia", fifa: "svk", iso2: "sk" },
  { name: "Slovenia", fifa: "svn", iso2: "si" },
  { name: "Solomon Islands", fifa: "sol", iso2: "sb" },
  { name: "Somalia", fifa: "som", iso2: "so" },
  { name: "South Africa", fifa: "rsa", iso2: "za" },
  { name: "South Korea", fifa: "kor", iso2: "kr", aliases: ["Korea Republic", "Korea", "Republic of Korea"] },
  { name: "South Sudan", fifa: "ssd", iso2: "ss" },
  { name: "Spain", fifa: "esp", iso2: "es" },
  { name: "Sri Lanka", fifa: "sri", iso2: "lk" },
  { name: "Sudan", fifa: "sdn", iso2: "sd" },
  { name: "Suriname", fifa: "sur", iso2: "sr" },
  { name: "Sweden", fifa: "swe", iso2: "se" },
  { name: "Switzerland", fifa: "sui", iso2: "ch" },
  { name: "Syria", fifa: "syr", iso2: "sy" },

  // T
  { name: "Tahiti", fifa: "tah", iso2: "pf" },
  { name: "Tajikistan", fifa: "tjk", iso2: "tj" },
  { name: "Tanzania", fifa: "tan", iso2: "tz" },
  { name: "Thailand", fifa: "tha", iso2: "th" },
  { name: "Timor-Leste", fifa: "tls", iso2: "tl", aliases: ["East Timor"] },
  { name: "Togo", fifa: "tog", iso2: "tg" },
  { name: "Tonga", fifa: "tga", iso2: "to" },
  { name: "Trinidad and Tobago", fifa: "tri", iso2: "tt", aliases: ["Trinidad"] },
  { name: "Tunisia", fifa: "tun", iso2: "tn" },
  { name: "Turkey", fifa: "tur", iso2: "tr", aliases: ["Türkiye", "Turkiye"] },
  { name: "Turkmenistan", fifa: "tkm", iso2: "tm" },
  { name: "Turks and Caicos Islands", fifa: "tca", iso2: "tc" },

  // U
  { name: "Uganda", fifa: "uga", iso2: "ug" },
  { name: "Ukraine", fifa: "ukr", iso2: "ua" },
  { name: "United Arab Emirates", fifa: "uae", iso2: "ae", aliases: ["UAE"] },
  { name: "United States", fifa: "usa", iso2: "us", aliases: ["USA", "US", "United States of America"] },
  { name: "Uruguay", fifa: "uru", iso2: "uy" },
  { name: "US Virgin Islands", fifa: "vir", iso2: "vi" },
  { name: "Uzbekistan", fifa: "uzb", iso2: "uz" },

  // V
  { name: "Vanuatu", fifa: "van", iso2: "vu" },
  { name: "Venezuela", fifa: "ven", iso2: "ve" },
  { name: "Vietnam", fifa: "vie", iso2: "vn" },

  // W
  { name: "Wales", fifa: "wal", iso2: "gb-wls" },

  // Y
  { name: "Yemen", fifa: "yem", iso2: "ye" },

  // Z
  { name: "Zambia", fifa: "zam", iso2: "zm" },
  { name: "Zimbabwe", fifa: "zim", iso2: "zw" },
];

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity percentage (0-100)
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return Math.round((1 - distance / maxLen) * 100);
}

export interface CountryMatch {
  country: Country;
  similarity: number;
  matchedOn: 'name' | 'alias' | 'fifa' | 'iso2';
}

/**
 * Find countries matching a search query
 * Returns matches sorted by similarity (best first)
 */
export function searchCountries(query: string, limit: number = 5): CountryMatch[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const matches: CountryMatch[] = [];

  for (const country of countries) {
    let bestSimilarity = 0;
    let matchedOn: CountryMatch['matchedOn'] = 'name';

    // Check exact matches first (highest priority)
    if (country.name.toLowerCase() === normalizedQuery) {
      matches.push({ country, similarity: 100, matchedOn: 'name' });
      continue;
    }

    if (country.fifa.toLowerCase() === normalizedQuery) {
      matches.push({ country, similarity: 100, matchedOn: 'fifa' });
      continue;
    }

    if (country.iso2.toLowerCase() === normalizedQuery) {
      matches.push({ country, similarity: 100, matchedOn: 'iso2' });
      continue;
    }

    // Check aliases for exact match
    if (country.aliases?.some(a => a.toLowerCase() === normalizedQuery)) {
      matches.push({ country, similarity: 100, matchedOn: 'alias' });
      continue;
    }

    // Fuzzy match on name
    const nameSim = similarity(normalizedQuery, country.name);
    if (nameSim > bestSimilarity) {
      bestSimilarity = nameSim;
      matchedOn = 'name';
    }

    // Check if query starts with or is contained in name
    if (country.name.toLowerCase().startsWith(normalizedQuery)) {
      bestSimilarity = Math.max(bestSimilarity, 85);
      matchedOn = 'name';
    }

    // Check aliases
    if (country.aliases) {
      for (const alias of country.aliases) {
        const aliasSim = similarity(normalizedQuery, alias);
        if (aliasSim > bestSimilarity) {
          bestSimilarity = aliasSim;
          matchedOn = 'alias';
        }
        if (alias.toLowerCase().startsWith(normalizedQuery)) {
          bestSimilarity = Math.max(bestSimilarity, 85);
          matchedOn = 'alias';
        }
      }
    }

    // Only include if similarity is above threshold
    if (bestSimilarity >= 50) {
      matches.push({ country, similarity: bestSimilarity, matchedOn });
    }
  }

  // Sort by similarity (descending) and return top matches
  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Find the best matching country for a given name
 * Returns null if no good match found (similarity < 70%)
 */
export function findCountry(name: string): CountryMatch | null {
  const matches = searchCountries(name, 1);
  if (matches.length === 0) return null;
  if (matches[0].similarity < 70) return null;
  return matches[0];
}

/**
 * Get a country by exact FIFA or ISO code
 */
export function getCountryByCode(code: string): Country | null {
  const normalizedCode = code.toLowerCase();
  return countries.find(
    c => c.fifa.toLowerCase() === normalizedCode || c.iso2.toLowerCase() === normalizedCode
  ) || null;
}

/**
 * Validate if a code is a valid FIFA or ISO country code
 */
export function isValidCountryCode(code: string): boolean {
  return getCountryByCode(code) !== null;
}

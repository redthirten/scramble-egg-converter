/**
 * Converts a Pelican-style Egg into a Pterodactyl-style Egg.
 *
 * Converts keys, normalizes startup/variables/config formats, and enforces
 * Pterodactyl key ordering expected by format guidelines. The function performs
 * in-memory transformations and returns a new object; it does not mutate
 * the input.
 *
 * @author David Wolfe <red_thirten@yahoo.com>
 * @license AGPL-3.0-only
 *
 * @param {Object} pelicanObj - Source Pelican Egg in object form
 * @returns {Object} Pterodactyl-formatted Egg in object form
 */
export function convertToPterodactyl(pelicanObj) {
  const ptero = structuredClone(pelicanObj);
  
  /* === Define helper functions === */

  // Normalize whitespace: remove raw newlines, collapse runs of whitespace, trim
  const normalizeWhitespace = (s) => (typeof s === 'string' ? s.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim() : s);

  // Normalize empty-object values to arrays for keys that may be {}.
  const normalizeEmptyObjectToArray = (val) => {
    if (Array.isArray(val)) return val.slice();
    if (val && typeof val === 'object' && Object.keys(val).length === 0) return [];
    return [];
  };

  /* === Conversion steps === */

  // Set standard Pterodactyl comment
  ptero._comment = "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY PTERODACTYL PANEL - PTERODACTYL.IO";

  // Modify metadata
  ptero.meta.version = "PTDL_v2";
  ptero.meta.update_url = null;

  // Normalize top-level description to remove newlines and collapse whitespace
  ptero.description = normalizeWhitespace(ptero.description);

  // Delete unused keys
  delete ptero.uuid;
  delete ptero.tags;
  delete ptero.icon;
  delete ptero.image; // Depreciated (now "icon"), but kept for backwards compatibility with older Eggs

  // Convert startup_commands object to string (first key only)
  if (ptero.startup_commands && typeof ptero.startup_commands === "object") {
    const firstKey = Object.keys(ptero.startup_commands)[0];
    if (firstKey) {
      ptero.startup = ptero.startup_commands[firstKey];
    }
    delete ptero.startup_commands;
  }

  // Convert Startup Variables
  if (Array.isArray(ptero.variables)) {
    ptero.variables = ptero.variables
      // create a shallow copy so we don't mutate the input array
      .slice()
      // sort ascending by Pelican's `sort` property
      .sort((a, b) => a.sort - b.sort)
      // map to Pterodactyl variable format
      .map(v => {
        const newVar = { ...v };
        // Remove `sort` key
        delete newVar.sort;
        // Normalize variable description whitespace/newlines
        newVar.description = normalizeWhitespace(newVar.description);
        // Ensure default_value is always a string for Pterodactyl
        newVar.default_value = String(newVar.default_value ?? '');
        // Convert rules array to pipe separated string
        newVar.rules = Array.isArray(v.rules) ? v.rules.join('|') : v.rules;
        newVar.field_type = "text"; // default to "text" since it's always present in Pterodactyl
        return newVar;
      });
  }

  // Stringify JSON Config values
  ptero.config.files = JSON.stringify(ptero.config.files, null, 4);
  ptero.config.startup = JSON.stringify(ptero.config.startup, null, 4);
  ptero.config.logs = JSON.stringify(ptero.config.logs, null, 4);

  /*
  Config Files:
    - "server.environment" -> "server.build.env"
    - "server.allocations.default" -> "server.build.default"
  */
  if (ptero.config && typeof ptero.config.files === 'string') {
    ptero.config.files = ptero.config.files.replace(/server\.environment/g, 'server.build.env');
    ptero.config.files = ptero.config.files.replace(/server\.allocations\.default/g, 'server.build.default');
  }

  // Handle keys that should be arrays when empty
  ptero.features = normalizeEmptyObjectToArray(ptero.features);
  ptero.file_denylist = normalizeEmptyObjectToArray(ptero.file_denylist);

  // === Enforce key order for Pterodactyl ===
  const ordered = {};
  ordered._comment = ptero._comment;
  ordered.meta = ptero.meta;
  ordered.exported_at = ptero.exported_at;
  ordered.name = ptero.name;
  ordered.author = ptero.author;
  ordered.description = ptero.description;
  ordered.features = ptero.features;
  ordered.docker_images = ptero.docker_images;
  ordered.file_denylist = ptero.file_denylist;

  // Ensure startup comes *right after* file_denylist
  if (ptero.startup) {
    ordered.startup = ptero.startup;
  }

  // Append remaining keys
  for (const key of Object.keys(ptero)) {
    if (!ordered.hasOwnProperty(key)) {
      ordered[key] = ptero[key];
    }
  }

  return ordered;
}

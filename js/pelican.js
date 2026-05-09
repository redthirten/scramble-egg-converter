/**
 * Converts a Pterodactyl-style Egg into a Pelican-style Egg.
 *
 * Converts keys, normalizes startup/variables/config formats, and enforces
 * Pelican key ordering expected by format guidelines. The function performs
 * in-memory transformations and returns a new object; it does not mutate
 * the input.
 *
 * @author David Wolfe <red_thirten@yahoo.com>
 * @license AGPL-3.0-only
 * 
 * @param {Object} pteroObj - Source Pterodactyl Egg in object form
 * @param {string} [providedUUID] - Optional UUID to set on the Pelican Egg
 * @param {string} [providedUpdateURL] - Optional update URL to include in meta
 * @param {string} [providedIconBase64] - Optional Base64 icon string
 * @param {string[]} [providedTags] - Optional array of tags
 * @returns {Object} Pelican-formatted Egg in object form
 */
export function convertToPelican(pteroObj, providedUUID, providedUpdateURL, providedIconBase64, providedTags) {
  const pelican = structuredClone(pteroObj);

  // Set standard Pelican comment
  pelican._comment = "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY PANEL";

  // Modify metadata
  pelican.meta = pelican.meta || {};
  pelican.meta.version = "PLCN_v3";
  pelican.meta.update_url = providedUpdateURL || null;
  pelican.icon = providedIconBase64 || null;
  pelican.tags = providedTags || [];

  // Generate UUID if not provided
  pelican.uuid = providedUUID || crypto.randomUUID();

  // Convert startup string to object
  if (typeof pelican.startup === "string") {
    pelican.startup_commands = { Default: pelican.startup };
    delete pelican.startup;
  }

  // Convert variable rules to array and add sort
  if (Array.isArray(pelican.variables)) {
    pelican.variables = pelican.variables.map((v, i) => {
      const newVar = { ...v };
      delete newVar.field_type; // field_type doesn't exist in Pelican
      newVar.sort = i + 1;
      newVar.rules = v.rules.split('|').map(rule => rule.trim());
      return newVar;
    });
  }

  /*
  Config Files:
    - "server.build.env" -> "server.environment"
    - "server.build.default" -> "server.allocations.default"
  */
  if (pelican.config && typeof pelican.config.files === 'string') {
    pelican.config.files = pelican.config.files.replace(/server\.build\.env/g, 'server.environment');
    pelican.config.files = pelican.config.files.replace(/server\.build\.default/g, 'server.allocations.default');
  }

  // Parse JSON Config values
  pelican.config.files = JSON.parse(pelican.config.files);
  pelican.config.startup = JSON.parse(pelican.config.startup);
  pelican.config.logs = JSON.parse(pelican.config.logs);

  // === Enforce key order for Pelican ===
  const ordered = {};
  ordered._comment = pelican._comment;
  ordered.meta = pelican.meta;
  ordered.exported_at = pelican.exported_at;
  ordered.name = pelican.name;
  ordered.author = pelican.author;
  ordered.uuid = pelican.uuid;
  ordered.description = pelican.description;
  ordered.icon = pelican.icon;
  ordered.tags = pelican.tags;
  ordered.features = pelican.features;
  ordered.docker_images = pelican.docker_images;
  ordered.file_denylist = pelican.file_denylist;

  // Ensure startup_commands comes *right after* file_denylist
  if (pelican.startup_commands) {
    ordered.startup_commands = pelican.startup_commands;
  }

  // Append remaining keys
  for (const key of Object.keys(pelican)) {
    if (!ordered.hasOwnProperty(key)) {
      ordered[key] = pelican[key];
    }
  }

  return ordered;
}

export function convertToPterodactyl(pelicanJson) {
  const ptero = structuredClone(pelicanJson);

  // Set standard Pterodactyl comment
  ptero._comment = "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY PTERODACTYL PANEL - PTERODACTYL.IO";

  // Modify metadata
  ptero.meta.version = "PTDL_v2";
  ptero.meta.update_url = null;

  delete ptero.uuid;
  delete ptero.tags;
  delete ptero.image;

  // Convert startup_commands object to string (first key only)
  if (ptero.startup_commands && typeof ptero.startup_commands === "object") {
    const firstKey = Object.keys(ptero.startup_commands)[0];
    if (firstKey) {
      ptero.startup = ptero.startup_commands[firstKey];
    }
    delete ptero.startup_commands;
  }

  // Convert variable rules array to string and remove sort
  if (Array.isArray(ptero.variables)) {
    ptero.variables = ptero.variables.map(v => {
      const newVar = { ...v };
      delete newVar.sort;
      newVar.rules = Array.isArray(v.rules) ? v.rules.join('|') : v.rules;
      newVar.field_type = "text"; // default to "text" since it's always present in Pterodactyl
      return newVar;
    });
  }

  /*
  Config Files:
    - "server.environment" -> "server.build.env"
    - "server.allocations.default" -> "server.build.default"
  */
  if (ptero.config && typeof ptero.config.files === 'string') {
    ptero.config.files = ptero.config.files.replace(/server\.environment/g, 'server.build.env');
    ptero.config.files = ptero.config.files.replace(/server\.allocations\.default/g, 'server.build.default');
  }

  // Remove empty feature arrays
  if (Array.isArray(ptero.features) && !ptero.features.length) {
    ptero.features = null;
  }

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

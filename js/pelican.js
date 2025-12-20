export function convertToPelican(pteroJson, providedUUID, providedUpdateURL) {
  const pelican = structuredClone(pteroJson);

  // Set standard Pelican comment
  pelican._comment = "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY PANEL";

  // Update version
  pelican.meta.version = "PLCN_v3";
  pelican.meta.update_url = providedUpdateURL ?? null;
  pelican.image = null;

  // Generate UUID
  const uuid = providedUUID || crypto.randomUUID();

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

  // === Enforce key order for Pelican ===
  const ordered = {};
  ordered._comment = pelican._comment;
  ordered.meta = pelican.meta;
  ordered.exported_at = pelican.exported_at;
  ordered.name = pelican.name;
  ordered.author = pelican.author;
  ordered.uuid = uuid;
  ordered.description = pelican.description;
  ordered.image = pelican.image; 
  ordered.tags = pelican.tags ?? [];
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

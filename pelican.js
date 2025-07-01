function convertToPelican(pteroJson, providedUUID, providedUpdateURL) {
  const pelican = structuredClone(pteroJson);

  // Set standard Pelican comment
  pelican._comment = "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY PANEL";

  // Update version
  pelican.meta.version = "PLCN_v1";
  pelican.meta.update_url = providedUpdateURL ?? null;

  // Generate UUID
  const uuid = providedUUID || crypto.randomUUID();

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

  // Replace "build.env" with "environment" in config.files string (reverse conversion)
  if (pelican.config && typeof pelican.config.files === 'string') {
    pelican.config.files = pelican.config.files.replace(/build\.env/g, 'environment');
  }

  // Enforce key ordering to match spec (author, uuid, then rest)
  const ordered = {};

  // Manually copy fields in order
  ordered._comment = pelican._comment;
  ordered.meta = pelican.meta;
  ordered.exported_at = pelican.exported_at;
  ordered.name = pelican.name;
  ordered.author = pelican.author;
  ordered.uuid = uuid;

  // Copy rest of keys (preserving original order)
  for (const key of Object.keys(pelican)) {
    if (!ordered.hasOwnProperty(key)) {
      ordered[key] = pelican[key];
    }
  }

  return ordered;
}

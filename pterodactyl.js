function convertToPterodactyl(pelicanJson) {
  const ptero = structuredClone(pelicanJson);

  // Set standard Pterodactyl comment
  ptero._comment = "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY PTERODACTYL PANEL - PTERODACTYL.IO";

  // Modify metadata
  ptero.meta.version = "PTDL_v2";
  ptero.meta.update_url = null;
  delete ptero.uuid;

  // Convert variables
  if (Array.isArray(ptero.variables)) {
    ptero.variables = ptero.variables.map(v => {
      const newVar = { ...v };
      delete newVar.sort;
      newVar.rules = Array.isArray(v.rules) ? v.rules.join('|') : v.rules;
      newVar.field_type = "text"; // default to "text" since it's always present in Pterodactyl
      return newVar;
    });
  }

  // Replace "environment" with "build.env" in config.files string
  if (ptero.config && typeof ptero.config.files === 'string') {
    ptero.config.files = ptero.config.files.replace(/environment/g, 'build.env');
  }

  return ptero;
}

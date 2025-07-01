import { convertToPelican } from './pelican.js';
import { convertToPterodactyl } from './pterodactyl.js';

const metadataContainer = document.getElementById('add-metadata');
const uuidInput = document.getElementById('uuid-input');
const updateUrlInput = document.getElementById('update-url-input');
const uploadInput = document.getElementById('upload');
const downloadButton = document.getElementById('download');

let originalFileName = '';
let originalJsonText = '';
let conversionTarget = '';

document.querySelectorAll('input[name="conversion"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const value = radio.value;
    conversionTarget = value;

    // Show UUID field if Pelican is selected
    metadataContainer.classList.toggle('hidden', value !== 'Pelican');

    // Enable file upload
    uploadInput.disabled = false;
  });
});

uploadInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  originalFileName = file.name.replace(/\.json$/i, '');
  originalJsonText = await file.text();
  downloadButton.disabled = false;
});

document.getElementById('download').addEventListener('click', () => {
  if (!originalJsonText || !conversionTarget) {
    alert("Please select a file and conversion type.");
    return;
  }

  let originalJson;
  try {
    originalJson = JSON.parse(originalJsonText);
    // Lazy check to see if JSON appears to be formatted like an Egg
    if (!('exported_at' in originalJson) || !('name' in originalJson) || !('author' in originalJson)) {
      alert("This file does not appear to be a valid Egg file.");
      return;
    }
  } catch (e) {
    alert("Invalid JSON file.");
    return;
  }

  let transformed;
  if (conversionTarget === 'Pelican') {
    if (originalJson.meta?.version?.includes("PLCN")) {
      alert("This file already appears to be a Pelican Egg.");
      return;
    }
    const userUUID = uuidInput.value.trim();
    const userUpdateURL = updateUrlInput.value.trim();
    transformed = convertToPelican(originalJson, userUUID || undefined, userUpdateURL || null);
  } else {
    if (originalJson.meta?.version?.includes("PTDL")) {
      alert("This file already appears to be a Pterodactyl Egg.");
      return;
    }
    transformed = convertToPterodactyl(originalJson);
  }

  const transformedData = JSON.stringify(transformed, null, 4).replace(/\//g, '\\/');

  // Clean the original name: lowercase, remove format indicators
  let cleanName = originalFileName.toLowerCase()
    .replace(/pelican/g, '')
    .replace(/pterodactyl/g, '')
    .replace(/--+/g, '-') // remove accidental double dashes
    .replace(/[^a-z0-9\-]/g, '-') // replace invalid chars with dashes
    .replace(/^-+|-+$/g, ''); // trim dashes at start/end

  const fileName = `${conversionTarget.toLowerCase()}-${cleanName || 'converted'}.json`;

  const blob = new Blob([transformedData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
});

import { convertToPelican } from './pelican.js';
import { convertToPterodactyl } from './pterodactyl.js';

const metadataContainer = document.getElementById('add-metadata');
const uuidInput = document.getElementById('uuid-input');
const updateUrlInput = document.getElementById('update-url-input');
const imageBase64Input = document.getElementById('image-base64-input');
const uploadInput = document.getElementById('upload');
const downloadButton = document.getElementById('download');

let originalFileExt = '';
let originalFileName = '';
let originalText = '';
let conversionTarget = '';

document.querySelectorAll('input[name="conversion"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const value = radio.value;
    conversionTarget = value;

    // Show metadata container if Pelican is selected
    metadataContainer.classList.toggle('hidden', value !== 'Pelican');

    // Enable file upload
    uploadInput.disabled = false;
  });
});

uploadInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Store base name (without extension) and the raw content
  const parts = file.name.split('.');
  if (parts.length > 1) {
    originalFileExt = parts[parts.length - 1].toLowerCase();
    parts.pop();
  } else {
    originalFileExt = '';
  }
  originalFileName = parts.join('.');
  originalText = await file.text();
  downloadButton.disabled = false;
});

document.getElementById('download').addEventListener('click', () => {
  if (!originalText || !conversionTarget) {
    alert("Please select a file and conversion type.");
    return;
  }

  let originalObj;
  try {
    if (originalFileExt === 'yml' || originalFileExt === 'yaml') {
      originalObj = jsyaml.load(originalText);
    } else {
      originalObj = JSON.parse(originalText);
    }

    // Lazy check to see if JSON/YAML appears to be formatted like an Egg
    if (!originalObj || !('exported_at' in originalObj) || !('name' in originalObj) || !('author' in originalObj)) {
      alert("This file does not appear to be a valid Egg file.");
      return;
    }
  } catch (e) {
    alert("Invalid file format.");
    return;
  }

  let transformed;
  let outData = '';
  let outExt = 'json';
  if (conversionTarget === 'Pelican') {
    if (originalObj.meta?.version?.includes("PLCN")) {
      alert("This file already appears to be a Pelican Egg.");
      return;
    }
    const userUUID = uuidInput.value.trim();
    const userUpdateURL = updateUrlInput.value.trim();
    const userImageBase64 = imageBase64Input.value.trim();
    transformed = convertToPelican(
      originalObj,
      userUUID,
      userUpdateURL,
      userImageBase64
    );
    outData = jsyaml.dump(transformed, { noRefs: true, lineWidth: -1 });
    outExt = 'yaml';
  } else {
    if (originalObj.meta?.version?.includes("PTDL")) {
      alert("This file already appears to be a Pterodactyl Egg.");
      return;
    }
    transformed = convertToPterodactyl(originalObj);
    outData = JSON.stringify(transformed, null, 4).replace(/\//g, '\\/');
    outExt = 'json';
  }

  // Clean the original name: lowercase, remove format indicators
  let cleanName = originalFileName.toLowerCase()
    .replace(/pelican/g, '')
    .replace(/pterodactyl/g, '')
    .replace(/--+/g, '-') // remove accidental double dashes
    .replace(/[^a-z0-9\-]/g, '-') // replace invalid chars with dashes
    .replace(/^-+|-+$/g, ''); // trim dashes at start/end

  const fileName = `${conversionTarget.toLowerCase()}-${cleanName || 'converted'}.${outExt}`;

  const blob = new Blob([outData], { type: outExt === 'yaml' ? 'text/yaml' : 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
});

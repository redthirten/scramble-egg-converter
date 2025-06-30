const uuidContainer = document.getElementById('uuid-container');
const uuidInput = document.getElementById('uuid-input');
const uploadInput = document.getElementById('upload');
const downloadButton = document.getElementById('download');

let transformedData = null;
let originalFileName = '';

uploadInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const selected = document.querySelector('input[name="conversion"]:checked');
  if (!selected) {
    alert("Please select a conversion type first.");
    return;
  }

  const conversionTarget = selected.value;
  originalFileName = file.name.replace(/\.json$/i, '');

  const text = await file.text();
  const originalJson = JSON.parse(text);

  let transformed;
  if (conversionTarget === 'Pelican') {
    uuidInput.disabled = true;
    const userUUID = uuidInput.value.trim();
    transformed = convertToPelican(originalJson, userUUID || undefined);
  } else {
    transformed = convertToPterodactyl(originalJson);
  }

  transformedData = JSON.stringify(transformed, null, 4).replace(/\//g, '\\/');
  downloadButton.disabled = false;
});

document.querySelectorAll('input[name="conversion"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const value = radio.value;

    // Show UUID field if Pelican is selected
    uuidContainer.style.display = value === 'Pelican' ? 'block' : 'none';

    // Enable file upload once a conversion type is selected
    uploadInput.disabled = false;
  });
});

document.getElementById('download').addEventListener('click', () => {
  if (!transformedData) return;

  const conversionTarget = document.querySelector('input[name="conversion"]:checked').value.toLowerCase();

  // Clean the original name: lowercase, remove "pelican" or "pterodactyl"
  let cleanName = originalFileName.toLowerCase()
    .replace(/pelican/g, '')
    .replace(/pterodactyl/g, '')
    .replace(/--+/g, '-')       // remove accidental double dashes
    .replace(/[^a-z0-9\-]/g, '-') // replace invalid chars with dashes
    .replace(/^-+|-+$/g, '');   // trim dashes at start/end

  const fileName = `${conversionTarget}-${cleanName || 'converted'}.json`;

  const blob = new Blob([transformedData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
});

/**
 * main.js -- Handles main page flow and functionality.
 * Copyright (C) 2026  David Wolfe (Red‑Thirten)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { convertToPelican } from './pelican.js';
import { convertToPterodactyl } from './pterodactyl.js';

// Main elements
const uploadInput = document.getElementById('upload');
const downloadButton = document.getElementById('download');

// Metadata elements (Pelican only)
const metadataContainer = document.getElementById('add-metadata');
const uuidInput = document.getElementById('uuid-input');
const updateUrlInput = document.getElementById('update-url-input');
const iconBase64Input = document.getElementById('icon-base64-input');
const tagsInput = document.getElementById('tags-input');
const tagsList = document.getElementById('tags-list');
let tags = [];

let originalFileExt = '';
let originalFileName = '';
let originalText = '';
let conversionTarget = '';

/** Conversion radio buttons change */
document.querySelectorAll('input[name="conversion"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const value = radio.value;
    conversionTarget = value;

    // Show metadata container if Pelican is selected
    metadataContainer.classList.toggle('hidden', value !== 'Pelican');

    // Restrict accepted file types based on conversion target
    if (value === 'Pelican') {
      uploadInput.accept = '.json';
    } else {
      uploadInput.accept = '.yaml,.yml';
    }

    // Reset any previously selected file and enable upload
    uploadInput.value = '';
    downloadButton.disabled = true;
    uploadInput.disabled = false;
  });
});

/** Upload file is chosen */
uploadInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]; // Only get first file if multiple files selected
  if (!file) return;

  // Parse filename into extension & base name variables
  const parts = file.name.split('.');
  if (parts.length > 1) {
    originalFileExt = parts[parts.length - 1].toLowerCase();
    parts.pop();
  } else {
    originalFileExt = '';
  }
  originalFileName = parts.join('.');

  // Validate source file format is suitable for the chosen conversion target
  if (conversionTarget === 'Pelican' && originalFileExt !== 'json') {
    alert('Please upload a JSON file when converting to Pelican.');
    uploadInput.value = '';
    downloadButton.disabled = true;
    return;
  }
  else if (conversionTarget === 'Pterodactyl' && !(originalFileExt === 'yaml' || originalFileExt === 'yml')) {
    alert('Please upload a YAML file when converting to Pterodactyl.');
    uploadInput.value = '';
    downloadButton.disabled = true;
    return;
  }
  
  // Store file text and enable download button
  originalText = await file.text();
  downloadButton.disabled = false;
});

/** Tags Field */
if (tagsInput && tagsList) {
  // Input behavior: press Enter to add tag; ignore empty/duplicate
  tagsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = tagsInput.value.trim();
      if (!value) return;
      if (!tags.includes(value)) {
        tags.push(value);
        renderTags();
      }
      tagsInput.value = '';
    }
  });

  // Delete tag: click X on specific tag to remove it
  tagsList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-index]');
    if (!btn) return;
    const idx = Number(btn.getAttribute('data-index'));
    if (Number.isFinite(idx)) {
      tags.splice(idx, 1);
      renderTags();
    }
  });

  // Tag rendering
  function renderTags() {
    tagsList.innerHTML = tags.map((t, i) =>
      `<span class="inline-flex items-center bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm ring-1 ring-gray-400">
         <span class="mr-2">${escapeHtml(t)}</span>
         <button type="button" data-index="${i}" class="text-gray-500 hover:text-gray-800">&times;</button>
       </span>`
    ).join('');
  }

  // Sanitize inputs before rendering
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

/** Download button click */
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
    const uuid = uuidInput.value.trim();
    const updateUrl = updateUrlInput.value.trim().replace(/\\\//g, '/'); // Extra sanitization for a JSON encoded URL string which may be inputted
    const iconBase64 = iconBase64Input.value.trim();
    transformed = convertToPelican(
      originalObj,
      uuid,
      updateUrl,
      iconBase64,
      tags
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

// Source file from the docmd project — https://github.com/mgks/docmd

const lucideStatic = require('lucide-static');

// On first load, log debug information about a specific icon to understand its structure
let debugRun = false;
if (debugRun) {
  console.log(`[docmd] Lucide static icons loaded - type: ${typeof lucideStatic}`);
  if (typeof lucideStatic === 'object') {
    console.log(`[docmd] Available icon keys (first 10): ${Object.keys(lucideStatic).slice(0, 10).join(', ')}...`);
    console.log(`[docmd] Total icons available: ${Object.keys(lucideStatic).length}`);
    
    // Inspect a sample icon to understand its structure
    const sampleIcon = lucideStatic['Home'];
    if (sampleIcon) {
        console.log(`[docmd] Sample icon (Home) structure:`, 
        JSON.stringify(sampleIcon).substring(0, 150) + '...');
    }
  }
  debugRun = false;
}

// Convert kebab-case to PascalCase for icon names (lucide-static uses PascalCase)
function kebabToPascal(str) {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

// Map of special case icon mappings that can't be handled by the kebabToPascal conversion
// Only keep truly necessary mappings that can't be derived from kebab-case
const iconSpecialCases = {
  'arrow-up-right-square': 'ExternalLink', // Different name entirely
  'cloud-upload': 'UploadCloud',           // Different word order
  'file-cog': 'Settings',                  // Completely different icon
};

const warnedMissingIcons = new Set();

function renderIcon(iconName, options = {}) {
  // Try different ways to get the icon data
  let iconData;
  
  // 1. Check special cases mapping for exceptions
  if (iconSpecialCases[iconName]) {
    iconData = lucideStatic[iconSpecialCases[iconName]];
  }
  
  // 2. If not found, try standard PascalCase conversion
  if (!iconData) {
    const pascalCaseName = kebabToPascal(iconName);
    iconData = lucideStatic[pascalCaseName];
  }

  if (!iconData) {
    if (!warnedMissingIcons.has(iconName)) { // Check if already warned
      console.warn(`[docmd] Lucide icon not found: ${iconName}. Falling back to empty string.`);
      warnedMissingIcons.add(iconName); // Add to set so it doesn't warn again
    }
    return '';
  }

  try {
    // The iconData is a string containing a complete SVG
    // We need to extract the contents and apply our own attributes
    const svgString = iconData.trim();
    
    // Extract the SVG content between the opening and closing tags
    const contentMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (!contentMatch) {
      return ''; // Not a valid SVG
    }
    
    const svgContent = contentMatch[1];
    
    // Create our custom attributes for the SVG
    const attributes = {
      class: `lucide-icon icon-${iconName} ${options.class || ''}`.trim(),
      width: options.width || '1em',
      height: options.height || '1em',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: options.stroke || 'currentColor',
      'stroke-width': options.strokeWidth || '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    };
    
    const attributesString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    // Return the new SVG with our attributes and the original content
    return `<svg ${attributesString}>${svgContent}</svg>`;
  } catch (err) {
    console.error(`[docmd] Error rendering icon ${iconName}:`, err);
    return '';
  }
}

function clearWarnedIcons() {
    warnedMissingIcons.clear();
}

module.exports = { renderIcon, clearWarnedIcons };
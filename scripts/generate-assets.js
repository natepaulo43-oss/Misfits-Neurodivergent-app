const fs = require('fs');
const path = require('path');

/**
 * Asset Generation Script for Misfits App
 * 
 * This script generates the required app assets from the source icon.
 * It uses sharp for image processing to create properly sized icons and splash screens.
 * 
 * Requirements:
 * - icon.png: 1024x1024 (no transparency)
 * - adaptive-icon.png: 1024x1024 (no transparency)
 * - splash.png: 1242x2436
 * 
 * Usage:
 * 1. Install sharp: npm install --save-dev sharp
 * 2. Run: node scripts/generate-assets.js
 */

async function generateAssets() {
  try {
    // Try to load sharp
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.error('❌ Sharp is not installed. Please run: npm install --save-dev sharp');
      console.log('\nAlternatively, you can use online tools to convert and resize:');
      console.log('1. Convert AVIF to PNG: https://cloudconvert.com/avif-to-png');
      console.log('2. Resize to 1024x1024: https://www.iloveimg.com/resize-image');
      console.log('3. Create splash screen with background color');
      process.exit(1);
    }

    const rootDir = path.join(__dirname, '..');
    const sourceIcon = path.join(rootDir, 'Alkhair_1.avif');
    const assetsDir = path.join(rootDir, 'misfits', 'assets');

    // Check if source icon exists
    if (!fs.existsSync(sourceIcon)) {
      console.error('❌ Source icon not found at:', sourceIcon);
      process.exit(1);
    }

    console.log('🎨 Starting asset generation...\n');

    // Generate icon.png (1024x1024, no transparency, white background)
    console.log('📱 Generating icon.png (1024x1024)...');
    await sharp(sourceIcon)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✅ icon.png created');

    // Generate adaptive-icon.png (1024x1024, no transparency, white background)
    console.log('📱 Generating adaptive-icon.png (1024x1024)...');
    await sharp(sourceIcon)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✅ adaptive-icon.png created');

    // Generate splash.png (1242x2436 - iPhone 11 Pro Max size)
    // Center the icon on a white background
    console.log('📱 Generating splash.png (1242x2436)...');
    
    // First, resize the icon to a reasonable size for the splash (e.g., 400x400)
    const iconBuffer = await sharp(sourceIcon)
      .resize(400, 400, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer();

    // Create splash screen with centered icon
    await sharp({
      create: {
        width: 1242,
        height: 2436,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([{
      input: iconBuffer,
      top: Math.floor((2436 - 400) / 2),
      left: Math.floor((1242 - 400) / 2)
    }])
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ splash.png created');

    // Generate favicon.png (48x48 for web)
    console.log('🌐 Generating favicon.png (48x48)...');
    await sharp(sourceIcon)
      .resize(48, 48, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✅ favicon.png created');

    console.log('\n🎉 All assets generated successfully!');
    console.log('\nGenerated files:');
    console.log('  - misfits/assets/icon.png (1024x1024)');
    console.log('  - misfits/assets/adaptive-icon.png (1024x1024)');
    console.log('  - misfits/assets/splash.png (1242x2436)');
    console.log('  - misfits/assets/favicon.png (48x48)');

  } catch (error) {
    console.error('❌ Error generating assets:', error.message);
    process.exit(1);
  }
}

// Run the script
generateAssets();

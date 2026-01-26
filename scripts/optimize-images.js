#!/usr/bin/env node

/**
 * Image Optimization Script for G-Map
 * Run with: node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imagesDir = path.join(__dirname, '..', 'public', 'images');

function optimizeImages() {
  console.log('🔍 Checking for image optimization tools...');

  try {
    // Check if sharp is available (Node.js image processing)
    require('sharp');
    console.log('✅ Sharp available for image processing');
  } catch {
    console.log('⚠️  Sharp not found. Install with: npm install -g sharp-cli');
    console.log('   Or use online tools like TinyPNG, ImageOptim');
    return;
  }

  const locationsDir = path.join(imagesDir, 'locations');
  const categoriesDir = path.join(imagesDir, 'categories');

  // Process location images
  if (fs.existsSync(locationsDir)) {
    console.log('📸 Optimizing location images...');
    const files = fs.readdirSync(locationsDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

    files.forEach(file => {
      const inputPath = path.join(locationsDir, file);
      const outputPath = path.join(locationsDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

      try {
        // Using sharp for conversion (if available)
        execSync(`sharp "${inputPath}" -o "${outputPath}" --webp --quality 80 --effort 6`);
        console.log(`✅ Converted ${file} to WebP`);
      } catch (error) {
        console.log(`❌ Failed to optimize ${file}:`, error.message);
      }
    });
  }

  // Process category images
  if (fs.existsSync(categoriesDir)) {
    console.log('🏷️  Optimizing category images...');
    const files = fs.readdirSync(categoriesDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

    files.forEach(file => {
      const inputPath = path.join(categoriesDir, file);
      const outputPath = path.join(categoriesDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

      try {
        execSync(`sharp "${inputPath}" -o "${outputPath}" --webp --quality 85 --effort 6`);
        console.log(`✅ Converted ${file} to WebP`);
      } catch (error) {
        console.log(`❌ Failed to optimize ${file}:`, error.message);
      }
    });
  }

  console.log('🎉 Image optimization complete!');
  console.log('📝 Remember to update locationImages.ts with .webp extensions if needed');
}

if (require.main === module) {
  optimizeImages();
}

module.exports = { optimizeImages };
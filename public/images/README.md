# Image Management Strategy for G-Map

## Overview
This document outlines the strategy for managing images in the G-Map application, optimized for performance with 500+ locations.

## Directory Structure
```
public/images/
├── locations/          # Specific location images
│   ├── convocation-arena.jpg
│   ├── engineering-block.jpg
│   └── ...
├── categories/         # Category fallback images
│   ├── academics.jpg
│   ├── offices.jpg
│   └── ...
└── default-location.jpg # Ultimate fallback
```

## Image Specifications

### Location Images
- **Format**: WebP (preferred), JPEG, PNG
- **Resolution**: 800x400px (2:1 aspect ratio)
- **File size**: < 100KB per image
- **Naming**: kebab-case, matching location ID

### Category Images
- **Format**: WebP (preferred), JPEG, PNG
- **Resolution**: 800x400px (2:1 aspect ratio)
- **File size**: < 50KB per image
- **Purpose**: Fallback when specific location image unavailable

## Optimization Techniques

### 1. Image Compression
```bash
# Using ImageOptim or similar tools
# Target: 70-80% quality for JPEG/WebP
# Maximum file size: 100KB for locations, 50KB for categories
```

### 2. Modern Formats
- **WebP**: Best compression, supported by all modern browsers
- **AVIF**: Even better compression (future consideration)
- **Fallback**: JPEG for older browsers

### 3. Lazy Loading
- Images load only when entering viewport
- Priority loading for above-the-fold content
- Loading states with skeleton/spinner

## Implementation

### Adding New Location Images
1. Add optimized image to `public/images/locations/`
2. Update `src/data/locationImages.ts` with the mapping
3. Use descriptive filenames: `convocation-arena.jpg`

### Category Fallbacks
- Automatically used when location image unavailable
- Defined in `src/data/locationImages.ts`
- Covers all location categories

## Performance Benefits

### Bundle Size
- Images not bundled in JavaScript
- Only URL strings in code (< 1KB total)
- Dynamic imports for image components

### Loading Performance
- Lazy loading reduces initial page load
- Optimized file sizes (100KB → ~50KB average)
- CDN-ready structure

### Scalability
- 500 locations × 50KB = ~25MB total (reasonable)
- Easy to add/remove images
- Maintainable file structure

## Tools & Workflow

### Image Optimization
```bash
# Install image optimization tools
npm install -g imagemin-cli

# Optimize images
imagemin public/images/locations/*.jpg --out-dir=public/images/locations/ --plugin=mozjpeg
```

### Build Process
- Images copied to dist/ during build
- No processing needed (static assets)
- Cache headers can be set at CDN level

## Future Enhancements

### Progressive Loading
- Blur placeholder → low-res → high-res
- WebP with JPEG fallbacks

### CDN Integration
- Cloudflare Images, Cloudinary, or similar
- Automatic optimization and resizing
- Global distribution

### Offline Support
- Service worker caching for critical images
- App shell with essential location images

## Migration from Current Setup

1. Move images from external URLs to local files
2. Update `locationImages.ts` mappings
3. Replace `<img>` with `<OptimizedImage>` component
4. Test loading states and fallbacks
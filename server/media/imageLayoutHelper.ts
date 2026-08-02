/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImagePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

/**
 * Calculates cover or contain placement coordinates for rendering an image inside a target bounding box.
 * Preserves source aspect ratio and prevents negative or zero dimensions.
 */
export function calculateCoverPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
  mode: 'cover' | 'contain' = 'cover',
  focalPointX: number = 0.5,
  focalPointY: number = 0.5
): ImagePlacement {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    throw new Error(`Invalid dimensions for image placement: source(${sourceWidth}x${sourceHeight}), target(${targetWidth}x${targetHeight})`);
  }

  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  let renderWidth: number;
  let renderHeight: number;
  let scale: number;

  if (mode === 'cover') {
    if (sourceAspect > targetAspect) {
      // Source is wider than target
      renderHeight = targetHeight;
      renderWidth = targetHeight * sourceAspect;
      scale = targetHeight / sourceHeight;
    } else {
      // Source is taller than target
      renderWidth = targetWidth;
      renderHeight = targetWidth / sourceAspect;
      scale = targetWidth / sourceWidth;
    }
  } else {
    // contain mode
    if (sourceAspect > targetAspect) {
      renderWidth = targetWidth;
      renderHeight = targetWidth / sourceAspect;
      scale = targetWidth / sourceWidth;
    } else {
      renderHeight = targetHeight;
      renderWidth = targetHeight * sourceAspect;
      scale = targetHeight / sourceHeight;
    }
  }

  // Calculate crop rectangle in source coordinates
  const cropWidth = Math.min(sourceWidth, targetWidth / scale);
  const cropHeight = Math.min(sourceHeight, targetHeight / scale);

  const maxCropX = sourceWidth - cropWidth;
  const maxCropY = sourceHeight - cropHeight;

  const cropX = Math.max(0, Math.min(maxCropX, maxCropX * Math.max(0, Math.min(1, focalPointX))));
  const cropY = Math.max(0, Math.min(maxCropY, maxCropY * Math.max(0, Math.min(1, focalPointY))));

  const renderX = targetX + (targetWidth - renderWidth) * Math.max(0, Math.min(1, focalPointX));
  const renderY = targetY + (targetHeight - renderHeight) * Math.max(0, Math.min(1, focalPointY));

  return {
    x: Math.round(renderX),
    y: Math.round(renderY),
    width: Math.round(renderWidth),
    height: Math.round(renderHeight),
    scale,
    cropX: Math.round(cropX),
    cropY: Math.round(cropY),
    cropWidth: Math.round(cropWidth),
    cropHeight: Math.round(cropHeight)
  };
}

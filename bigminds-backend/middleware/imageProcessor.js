const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

/**
 * Process and resize avatar image into multiple sizes
 * @param {String} filePath - Path to the original image file
 * @param {String} baseName - Base name for output files (without extension)
 * @returns {Promise<Object>} Object with paths to small, medium, and large versions
 */
exports.processAvatar = async (filePath, baseName) => {
  const uploadDir = path.dirname(filePath);
  const ext = path.extname(filePath) || '.jpg';
  
  const sizes = {
    small: { width: 100, height: 100, suffix: "small" },
    medium: { width: 300, height: 300, suffix: "medium" },
    large: { width: 600, height: 600, suffix: "large" },
  };

  const processedImages = {};

  try {
    // Read the image first to determine format
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const format = metadata.format || 'jpeg';

    for (const [key, { width, height, suffix }] of Object.entries(sizes)) {
      const outputPath = path.join(uploadDir, `${baseName}_${suffix}.jpg`);
      
      let pipeline = image.clone().resize(width, height, {
        fit: "cover",
        position: "center",
      });

      // Convert to JPEG for consistency
      if (format !== 'jpeg') {
        pipeline = pipeline.jpeg({ quality: 90 });
      } else {
        pipeline = pipeline.jpeg({ quality: 90 });
      }

      await pipeline.toFile(outputPath);

      processedImages[key] = `/uploads/profiles/${path.basename(outputPath)}`;
    }

    // Also keep original but optimize it
    const originalOptimized = path.join(uploadDir, `${baseName}_original.jpg`);
    let originalPipeline = image.clone();
    if (format !== 'jpeg') {
      originalPipeline = originalPipeline.jpeg({ quality: 90 });
    } else {
      originalPipeline = originalPipeline.jpeg({ quality: 90 });
    }
    await originalPipeline.toFile(originalOptimized);

    return {
      small: processedImages.small,
      medium: processedImages.medium,
      large: processedImages.large,
      original: `/uploads/profiles/${path.basename(originalOptimized)}`,
    };
  } catch (error) {
    console.error("Error processing avatar:", error);
    throw new Error("Failed to process avatar image");
  }
};

/**
 * Delete avatar files (all sizes)
 * @param {String} basePath - Base path without size suffix
 */
exports.deleteAvatarFiles = async (basePath) => {
  const sizes = ["small", "medium", "large", "original"];
  const uploadDir = path.join(__dirname, "..", "uploads", "profiles");
  
  for (const size of sizes) {
    const filePath = path.join(uploadDir, `${basePath}_${size}.jpg`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Error deleting ${size} avatar:`, error);
      }
    }
  }
};


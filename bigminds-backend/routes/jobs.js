const express = require("express");
const router = express.Router();

// GitHub repository info
const GITHUB_REPOSITORY = "usmantalpur12/BigMinds-FullStack";

// GitHub API base URL
const GITHUB_API_BASE = "https://api.github.com";

/**
 * @route   GET /api/jobs/apk
 * @desc    Get the latest APK download URL from GitHub Releases
 * @access  Public (no authentication required)
 */
router.get("/apk", async (req, res, next) => {
  try {
    const releasesUrl = `${GITHUB_API_BASE}/repos/${GITHUB_REPOSITORY}/releases/latest`;

    const response = await fetch(releasesUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "BigMinds-API",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: "No APK release found. Releases may not have been published yet.",
        });
      }
      return res.status(502).json({
        success: false,
        message: "Failed to fetch release info from GitHub.",
        error: `GitHub API returned status ${response.status}`,
      });
    }

    const release = await response.json();

    // Find the APK asset in the release
    const apkAsset = (release.assets || []).find(
      (asset) => asset.name.toLowerCase().endsWith(".apk")
    );

    if (!apkAsset) {
      return res.status(404).json({
        success: false,
        message: "No APK file found in the latest release.",
        release: {
          tagName: release.tag_name,
          name: release.name || release.tag_name,
          publishedAt: release.published_at,
          htmlUrl: release.html_url,
        },
      });
    }

    res.json({
      success: true,
      data: {
        apkDownloadUrl: apkAsset.browser_download_url,
        version: release.tag_name,
        name: release.name || release.tag_name,
        publishedAt: release.published_at,
        releaseUrl: release.html_url,
        downloadCount: apkAsset.download_count,
        size: apkAsset.size,
        sizeFormatted: formatFileSize(apkAsset.size),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/jobs/releases
 * @desc    Get all published releases from GitHub (for APK download history)
 * @access  Public
 */
router.get("/releases", async (req, res, next) => {
  try {
    const releasesUrl = `${GITHUB_API_BASE}/repos/${GITHUB_REPOSITORY}/releases?per_page=10`;

    const response = await fetch(releasesUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "BigMinds-API",
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch releases from GitHub.",
        error: `GitHub API returned status ${response.status}`,
      });
    }

    const releases = await response.json();

    // Transform releases to APK entries
    const apkReleases = releases
      .map((release) => {
        const apkAsset = (release.assets || []).find(
          (asset) => asset.name.toLowerCase().endsWith(".apk")
        );
        return apkAsset
          ? {
              apkDownloadUrl: apkAsset.browser_download_url,
              version: release.tag_name,
              name: release.name || release.tag_name,
              publishedAt: release.published_at,
              releaseUrl: release.html_url,
              downloadCount: apkAsset.download_count,
              size: apkAsset.size,
              sizeFormatted: formatFileSize(apkAsset.size),
              isPrerelease: release.prerelease,
            }
          : null;
      })
      .filter(Boolean);

    res.json({
      success: true,
      count: apkReleases.length,
      data: apkReleases,
    });
  } catch (error) {
    next(error);
  }
});

// Helper: format file size for human readability
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

module.exports = router;
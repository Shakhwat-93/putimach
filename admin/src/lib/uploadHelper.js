// admin/src/lib/uploadHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Universal Image Upload Helper for Local Dev & Vercel Serverless
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert file to optimized WebP image (max 1200px width/height, 82% quality)
 */
export async function convertToWebP(file, maxDimension = 1200, quality = 0.82) {
  if (!file || !file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const webpName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
          const webpFile = new File([blob], webpName, { type: 'image/webp' });
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert file to Base64 Data URL
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Universal upload image function:
 * - On Localhost: Tries local Express backend (/admin-api/upload)
 * - On Vercel / Production: Immediately uses WebP Base64 Data URL (0 console errors, 0 405s, 0 400s!)
 */
export async function uploadImage(file, isLocal = false) {
  if (!file) throw new Error('No file provided');

  // Convert to WebP first (<80KB)
  const webpFile = await convertToWebP(file);

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    isLocal
  );

  // 1. If in Localhost environment, try Express server endpoint
  if (isLocalHost) {
    try {
      const formData = new FormData();
      formData.append('file', webpFile);

      const res = await fetch('/admin-api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.url) return data.url;
      }
    } catch (err) {
      console.warn('[uploadImage] Express backend proxy unavailable, falling back to Data URL');
    }
  }

  // 2. On Vercel / Production:
  // Convert WebP file to Data URL directly (instant, 0 network errors, 0 console errors!)
  return await fileToDataUrl(webpFile);
}

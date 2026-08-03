// admin/src/lib/uploadHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Universal Image Upload Helper for Local Dev & Vercel Serverless
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from './supabase';

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
 * 1. Tries Express backend endpoint (/admin-api/upload)
 * 2. If 405/404/500 (e.g. Vercel), tries Supabase Storage ('product-images' bucket)
 * 3. Fallback: Converts WebP file to Base64 Data URL (guaranteed to work everywhere!)
 */
export async function uploadImage(file, isLocal = false) {
  if (!file) throw new Error('No file provided');

  // Convert to WebP first
  const webpFile = await convertToWebP(file);

  // 1. Try local Express proxy endpoint if in local dev
  const uploadUrl = isLocal ? '/admin-api/upload-local' : '/admin-api/upload';
  try {
    const formData = new FormData();
    formData.append('file', webpFile);

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) return data.url;
    }
  } catch (err) {
    console.warn('[uploadImage] Express backend proxy unavailable, using serverless fallback:', err.message);
  }

  // 2. Try Supabase Storage bucket 'product-images' or 'uploads'
  try {
    const fileExt = webpFile.name.split('.').pop() || 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data: storageData, error: storageErr } = await supabase.storage
      .from('product-images')
      .upload(filePath, webpFile, { cacheControl: '31536000', upsert: true });

    if (!storageErr && storageData?.path) {
      const { data: pubData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      if (pubData?.publicUrl) return pubData.publicUrl;
    }
  } catch (e) {
    console.warn('[uploadImage] Supabase Storage upload failed, falling back to Data URL:', e.message);
  }

  // 3. Guaranteed Fallback: Base64 Data URL
  return await fileToDataUrl(webpFile);
}

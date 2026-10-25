const MAX_EDGE = 1920;
const MAX_BYTES = 800_000;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= MAX_BYTES) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      const mime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.82));
      if (!blob || blob.size >= file.size) {
        return file;
      }
      const ext = blob.type === 'image/webp' ? '.webp' : '.jpg';
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, {
        type: blob.type,
        lastModified: Date.now()
      });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

// Downscale an uploaded photo to a square JPEG data URL so it fits in storage.
export function fileToAvatar(file, size = 320) {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith('image/')) return reject(new Error('Please choose an image file.'))
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = size
      const s = Math.min(img.width, img.height)
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = URL.createObjectURL(file)
  })
}

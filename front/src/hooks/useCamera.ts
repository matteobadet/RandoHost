import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export function useCamera() {
  const isNative = Capacitor.isNativePlatform()

  async function pickFromGallery(): Promise<File | null> {
    if (isNative) {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 90,
      })
      if (!photo.dataUrl) return null
      const res = await fetch(photo.dataUrl)
      const blob = await res.blob()
      return new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
    }
    return null
  }

  async function takePhoto(): Promise<File | null> {
    if (isNative) {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90,
      })
      if (!photo.dataUrl) return null
      const res = await fetch(photo.dataUrl)
      const blob = await res.blob()
      return new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
    }
    return null
  }

  return { isNative, pickFromGallery, takePhoto }
}

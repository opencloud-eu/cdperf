import { Platform } from '@/values'

export const platformGuard = (platform: Platform) => {
  return {
    isOpenCloud: platform === Platform.openCloud,
    isOwnCloudServer: platform === Platform.ownCloudServer,
    isNextcloud: platform === Platform.nextcloud
  }
}

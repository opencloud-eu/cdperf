import { expect, test } from 'vitest'

import { Platform } from '@/values'

import { platformGuard } from './guard'

test.each([
  { platform: Platform.openCloud },
  { platform: Platform.ownCloudServer },
  { platform: Platform.nextcloud }
])('platformGuard returns a list of guards to provide information the requested platform ($platform) is detected)', ({ platform }) => {
  const {
    isOpenCloud,
    isOwnCloudServer,
    isNextcloud
  } = platformGuard(platform as Platform)

  expect(isOpenCloud).toBe(platform === Platform.openCloud)
  expect(isOwnCloudServer).toBe(platform === Platform.ownCloudServer)
  expect(isNextcloud).toBe(platform === Platform.nextcloud)
})

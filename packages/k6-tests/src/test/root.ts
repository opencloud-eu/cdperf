import { Client } from '@opencloud-eu/k6-tdk/lib/client'
import { platformGuard, queryJson } from '@opencloud-eu/k6-tdk/lib/utils'
import { Platform } from '@opencloud-eu/k6-tdk/lib/values'

import { TestRootType } from '@/values'

const buildGuards = (p: { resourceType: TestRootType, platform: Platform, isOwner?: boolean }) => {
  return {
    ...platformGuard(p.platform),
    isSpace: p.resourceType === TestRootType.space,
    isDirectory: p.resourceType === TestRootType.directory,
    isOwner: !!p.isOwner
  }
}

export const getTestRoot = async (p: {
  client: Client,
  platform: Platform,
  userLogin: string,
  resourceName: string,
  resourceType: TestRootType,
  isOwner: boolean
}): Promise<{
  root: string,
  path: string
}> => {
  const rv = { root: '', path: '' }
  const guards = buildGuards(p)
  let query
  let params

  if (guards.isSpace) {
    query = `driveAlias === 'project/${p.resourceName}'`
    params = { $filter: "driveType eq 'project'" }
  }

  if (guards.isDirectory && !guards.isOwner) {
    query = `driveAlias === 'mountpoint/${p.resourceName}'`
    params = { $filter: "driveType eq 'mountpoint'" }
  }

  if (guards.isDirectory && guards.isOwner) {
    query = `driveAlias === 'personal/${p.userLogin}'`
    params = { $filter: "driveType eq 'personal'" }
  }

  if (guards.isOpenCloud) {
    const getMyDrivesResponse = await p.client.me.getMyDrives({ params })
    ;[rv.root] = queryJson(`$.value[?(@.${query})].id`, getMyDrivesResponse?.body)
  }

  if (!guards.isOpenCloud) {
    rv.root = p.userLogin
  }

  if (!guards.isOpenCloud || guards.isDirectory && guards.isOwner) {
    rv.path = p.resourceName
  }

  return rv
}

export const createTestRoot = async (p: {
  client: Client,
  platform: Platform,
  userLogin: string,
  resourceName: string,
  resourceType: TestRootType
}): Promise<{
  root: string,
  path: string
}> => {
  const rv = { root: '', path: '' }
  const guards = buildGuards(p)

  if (guards.isOpenCloud && guards.isSpace) {
    const existingSpace = await getTestRoot({ ...p, isOwner: true })
    if (existingSpace.root) {
      return existingSpace
    }

    const createDriveResponse = await p.client.drive.createDrive({ driveName: p.resourceName })
    const [createdDriveId] = queryJson('$.id', createDriveResponse?.body)
    rv.root = createdDriveId
  }

  if (guards.isOpenCloud && guards.isDirectory) {
    const getMyDrivesResponse = p.client.me.getMyDrives({})
    const [personalDriveId] = queryJson("$.value[?(@.driveType === 'personal')].id", getMyDrivesResponse?.body)
    rv.root = personalDriveId
  }

  if (!guards.isOpenCloud) {
    rv.root = p.userLogin
  }

  if (guards.isDirectory) {
    rv.path = p.resourceName
    await p.client.resource.createResource({ root: rv.root, resourcePath: p.resourceName })
  }

  return rv
}

export const deleteTestRoot = async (p: {
  client: Client,
  platform: Platform,
  userLogin: string,
  resourceName: string,
  resourceType: TestRootType
}): Promise<void> => {
  const existingTestRoot = await getTestRoot({ ...p, isOwner: true })
  if (!existingTestRoot.root && !existingTestRoot.path) {
    return
  }

  const guards = buildGuards(p)

  if (guards.isOpenCloud && guards.isSpace) {
    await p.client.drive.deactivateDrive({ driveId: existingTestRoot.root })
    await p.client.drive.deleteDrive({ driveId: existingTestRoot.root })
    return
  }

  p.client.resource.deleteResource({ root: existingTestRoot.root, resourcePath: existingTestRoot.path })
}

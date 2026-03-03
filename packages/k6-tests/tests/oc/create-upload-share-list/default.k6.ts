import {ENV, queryJson, randomString, store, queryXml} from '@opencloud-eu/k6-tdk/lib/utils'
import exec from 'k6/execution'
import {Options} from 'k6/options'
import { Permission, ShareType } from '@opencloud-eu/k6-tdk/lib/values'
import {clientFor} from '@/shortcuts'
import {getPoolItem} from '@/utils';
import {PoolUser, userPool} from '@/pools';
import {envValues} from '@/values';
import {times} from 'lodash';
import {randomBytes} from 'k6/crypto';
import { Trend } from 'k6/metrics';

const settings = {
  ...envValues(),
  asset: {
    size: parseInt(ENV('ASSET_SIZE', '1000'), 10),
  }
}

export const options: Options = {
  vus: 2,
  insecureSkipTLSVerify: true
}

export interface Environment {
  data: {
    user: PoolUser;
    root: string;
    folder: string;
  }[];
}

const metrics = {
  list_home: new Trend('list_home', true),
  upload_resource: new Trend('upload_resource', true),
  create_resource: new Trend('create_resource', true),
  create_share: new Trend('create_share', true),
  accept_share: new Trend('accept_share', true),
}

export async function setup(): Promise<Environment> {
  if (!options.vus || options.vus < 2) {
    exec.test.abort('This test requires at least 2 VUs')
  }

  const userData = await Promise.all(times(options.vus || 1, async (n) => {
    const user = getPoolItem({pool: userPool, n: n + 1})
    const client = clientFor(user)
    const getMyDrivesResponse = await client.me.getMyDrives({params: {$filter: "driveType eq 'personal'"}})
    const [root = user.userLogin] = queryJson("$.value[?(@.driveType === 'personal')].id", getMyDrivesResponse?.body)
    const folder = ['oc-create-upload-share-list', randomString()].join('-')

    client.resource.createResource({root, resourcePath: folder})

    return {root, folder, user}
  }))

  return {data: userData}
}

export default async function actor(env: Environment): Promise<void> {
  const user = getPoolItem({ pool: userPool, n: exec.vu.idInTest })
  const userStore = store(user.userLogin)
  const client = await userStore.setOrGet('client', async () => {
    return clientFor(user)
  })
  const {root, folder} = await userStore.setOrGet('userEnv', async () => {
    const data = env.data.find(d => d.user.userLogin === user.userLogin)
    return {
      root: data!.root,
      folder: data!.folder
    }
  })

  const shareFolderName = [user.userLogin.replace(/[^A-Za-z0-9]/g, ''), randomString(), 'iteration', exec.vu.iterationInInstance + 1].join('-')

  // create a folder
  const createResourceResponse = await client.resource.createResource({ root, resourcePath: [folder, shareFolderName].join('/') })
  metrics.create_resource.add(createResourceResponse.timings.waiting)

  // upload a file
  const uploadResourceResponse = await client.resource.uploadResource({
    root,
    resourcePath: [folder, shareFolderName, `${shareFolderName}.txt`].join('/'),
    resourceBytes: randomBytes(settings.asset.size)
  })
  metrics.upload_resource.add(uploadResourceResponse.timings.waiting)

  const shareReceiverID = Array.from({length: options.vus || 1}, (_, i) => i + 1).filter(i => i != exec.vu.idInTest).sort(() => 0.5 - Math.random())[0]
  const shareReceiver = getPoolItem({ pool: userPool, n: shareReceiverID })

  if (!shareReceiver) {
    exec.test.abort('No share receiver found')
  }

  // create a share
  const createShareResponse = await client.share.createShare({
    shareResourcePath: [folder, shareFolderName].join('/'),
    shareReceiver: shareReceiver.userLogin,
    shareType: ShareType.user,
    shareReceiverPermission: Permission.all
  })
  metrics.create_share.add(createShareResponse.timings.waiting)

  const [createdShareId] = queryXml('ocs.data.id', createShareResponse.body)

  const shareReceiverClient = await userStore.setOrGet(['client', shareReceiver.userLogin].join('-'), async () => {
    return clientFor(shareReceiver)
  })

  // accept share
  const acceptShareResponse = await shareReceiverClient.share.acceptShare({ shareId: createdShareId })
  metrics.accept_share.add(acceptShareResponse.timings.waiting)

  // list home
  const getResourcePropertiesResponse = await client.resource.getResourceProperties({ root, resourcePath: "/" })
  metrics.list_home.add(getResourcePropertiesResponse.timings.waiting)
}

export async function teardown(env: Environment): Promise<void> {
  const chain: Array<() => Promise<void>> = []

  env.data.forEach(d => {
    chain.push(async () => {
      const client = clientFor(d.user)
      client.resource.deleteResource({ root: d.root, resourcePath: d.folder })
    })
  })

  await Promise.all(chain.map(fn => fn()))
}

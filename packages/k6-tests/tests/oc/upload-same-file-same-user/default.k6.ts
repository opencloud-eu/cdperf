import {ENV, queryJson, store} from '@opencloud-eu/k6-tdk/lib/utils'
import {Options} from 'k6/options'

import {clientFor} from '@/shortcuts'
import {envValues} from '@/values'
import exec from 'k6/execution'

/**/
export const settings = {
  ...envValues(),
  testFile: ENV('TEST_FILE', 'test-file.txt'),
  user: {
    login: ENV('USER_LOGIN', 'admin'),
    password: ENV('USER_PASSWORD', 'admin')
  },
}

/**/
export const options: Options = {
  vus: 1,
  iterations: 1,
  insecureSkipTLSVerify: true
}


async function getShared() {
  // the test should upload the same file with the same user all the time,
  // even across vu's
  const user = {
    userLogin: settings.user.login,
    userPassword: settings.user.password
  }
  const userStore = store(user.userLogin)
  const client = await userStore.setOrGet('client', async () => {
    return clientFor(user)
  })
  const root = await userStore.setOrGet('root', async () => {
    const getMyDrivesResponse = await client.me.getMyDrives({params: {$filter: "driveType eq 'personal'"}})
    const [actorRoot = user.userLogin] = queryJson("$.value[?(@.driveType === 'personal')].id", getMyDrivesResponse?.body)

    return actorRoot
  })

  return {client, root}
}

async function cleanup() {
  const {root, client} = await getShared()
  client.resource.deleteResource(
    {root, resourcePath: settings.testFile},
    {
      allowStatus: [
        204,
        425, // depending on the load, the resource may still be in post-processing
        404, // depending on the state, the resource may not exist
      ]
    },
  )
}

export async function setup() {
  await cleanup()
}

export default async function actor() {
  const {root, client} = await getShared()

  client.resource.uploadResource(
    {
      root,
      resourcePath: settings.testFile,
      resourceBytes: `${exec.vu.idInTest}-${exec.scenario.iterationInInstance}`
    },
    {
      allowStatus: [
        201,
        204,
        412, // if a file is new, oc does not allow creating revisions before pp is finished
      ]
    },
  )
}

export async function teardown() {
  await cleanup()
}

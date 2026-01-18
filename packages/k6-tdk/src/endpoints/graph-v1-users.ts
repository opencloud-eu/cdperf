import { objectToQueryString } from '@/utils'

import { Endpoint } from './endpoints'

export const POST__create_user: Endpoint<{ userLogin: string, userPassword: string }, 'text'> = (httpClient, {
  userLogin,
  userPassword
}) => {
  return httpClient('POST', '/graph/v1.0/users', JSON.stringify({
    onPremisesSamAccountName: userLogin,
    displayName: userLogin,
    mail: `${userLogin}@cdperf.org`,
    passwordProfile: { password: userPassword }
  }))
}

export const GET__get_users: Endpoint<{ params?: Record<string, unknown> }, 'text'> = (httpClient, { params }) => {
  return httpClient('GET', `/graph/v1.0/users?${objectToQueryString(params)}`)
}

// LibreGraph API requires userId (UUID), not userLogin (username).
// If only userLogin is provided, we lookup the userId first.
export const DELETE__delete_user: Endpoint<{ userId?: string, userLogin?: string }, 'none'> = (httpClient, { userId, userLogin }) => {
  let resolvedUserId = userId
  if (!resolvedUserId && userLogin) {
    const response = GET__get_users(httpClient, {})
    const users = response ? JSON.parse(response.body).value : []
    const user = users.find((u: { onPremisesSamAccountName: string }) => u.onPremisesSamAccountName === userLogin)
    resolvedUserId = user?.id
  }
  if (!resolvedUserId) {
    return httpClient('DELETE', '/graph/v1.0/users/unknown') // will 404
  }
  return httpClient('DELETE', `/graph/v1.0/users/${resolvedUserId}`)
}

export const POST__add_app_role_to_user: Endpoint<{
  principalId: string,
  appRoleId: string,
  resourceId: string
}, 'text'> = (httpClient, { resourceId, principalId, appRoleId }) => {
  return httpClient('POST', `/graph/v1.0/users/${principalId}/appRoleAssignments`, JSON.stringify({
    appRoleId,
    principalId,
    resourceId
  }))
}

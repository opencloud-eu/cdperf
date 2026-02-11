import { Endpoint } from './endpoints'

export const POST__create_user: Endpoint<{
  userLogin: string,
  userPassword: string
}, 'text'> = (httpClient, { userPassword, userLogin }) => {
  return httpClient('POST', '/ocs/v2.php/cloud/users', {
    userid: userLogin,
    password: userPassword,
    email: `${userLogin}@cdperf.org`
  }, {
    headers: {
      'OCS-APIRequest': 'true'
    }
  })
}

export const PUT__enable_user: Endpoint<{ userId: string }, 'text'> = (httpClient, { userId }) => {
  return httpClient('PUT', `/ocs/v2.php/cloud/users/${userId}/enable`, undefined, {
    headers: {
      'OCS-APIRequest': 'true'
    }
  })
}

export const DELETE__delete_user: Endpoint<{ userId: string }, 'text'> = (httpClient, { userId }) => {
  return httpClient('DELETE', `/ocs/v1.php/cloud/users/${userId}`, undefined, {
    headers: {
      'OCS-APIRequest': 'true'
    }
  })
}

export const POST__add_user_to_group: Endpoint<{ groupId: string, userId: string }, 'none'> = (httpClient, { groupId, userId }) => {
  return httpClient('POST', `/ocs/v2.php/cloud/users/${userId}/groups`, {
    groupid: groupId,
  }, {
    headers: {
      'OCS-APIRequest': 'true'
    }
  })
}

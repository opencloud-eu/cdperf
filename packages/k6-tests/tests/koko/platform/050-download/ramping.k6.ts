import { ENV } from '@opencloud-eu/k6-tdk/lib/utils'
import { Options } from 'k6/options'
import { omit } from 'lodash'

import { options as inherited_options } from './baseline.k6'

export { download_050 } from './simple.k6'

export const options: Options = {
  ...omit(inherited_options, 'iterations', 'duration'),
  scenarios: {
    download_050: {
      executor: 'ramping-vus',
      startVUs: 0,
      exec: 'download_050',
      env: {
        SLEEP_AFTER_ITERATION: ENV('TEST_KOKO_PLATFORM_050_RAMPING_SLEEP_AFTER_ITERATION', '30s')
      },
      stages: [
        {
          target: parseInt(ENV('TEST_KOKO_PLATFORM_050_RAMPING_STAGES_VUS', '500'), 10),
          duration: ENV('TEST_KOKO_PLATFORM_050_RAMPING_STAGES_UP_DURATION', '20m')
        },
        {
          target: parseInt(ENV('TEST_KOKO_PLATFORM_050_RAMPING_STAGES_VUS', '500'), 10),
          duration: ENV('TEST_KOKO_PLATFORM_050_RAMPING_STAGES_PEAK_DURATION', '30m')
        },
        {
          target: 0,
          duration: ENV('TEST_KOKO_PLATFORM_050_RAMPING_STAGES_DOWN_DURATION', '10m')
        }
      ]
    }
  }
}

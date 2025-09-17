import { Options } from 'k6/options'

import { options as options_040 } from '@/tests/koko/platform/040-create-upload-rename-delete-folder-and-file/ramping.k6'
export {
  create_upload_rename_delete_folder_and_file_040
} from '@/tests/koko/platform/040-create-upload-rename-delete-folder-and-file/simple.k6'

export const options: Options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    ...options_040.scenarios,
  }
}

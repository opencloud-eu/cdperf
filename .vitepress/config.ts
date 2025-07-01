import {defineConfig} from 'vitepress';
import * as glob from 'fast-glob';
import * as path from 'path';
import {createRequire} from 'module'
import {lowerCase} from 'lodash';

// @ts-ignore
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const sidebarK6Tests = () => {

  const testsNavigation = Object.values(glob.sync(['tests/**/*.md'], {
    cwd: path.dirname(require.resolve('../packages/k6-tests/package.json'))
  }).map(item => {
    const info = path.parse(item)
    const name = info.dir.split('/').slice(1).map(lowerCase).join(' / ')
    return {text: '- ' + name, link: path.join('/k6-tests/', info.dir, info.name)}
  }))

  const srcNavigation = Object.values(glob.sync(['src/**/*.md'], {
    cwd: path.dirname(require.resolve('../packages/k6-tests/package.json'))
  }).map(item => {
    const info = path.parse(item)
    const name = [...info.dir.split('/').slice(1), info.name].map(lowerCase).join(' / ')
    return {text: '- ' + name, link: path.join('/k6-tests/', info.dir, info.name)}
  }))

  return {
    '/k6-tests/': [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          {text: '- Welcome', link: '/k6-tests/docs/'},
          {text: '- Considerations', link: '/k6-tests/docs/considerations'},
          {text: '- How to run', link: '/k6-tests/docs/run'},
        ]
      },
      {
        text: 'Src',
        collapsed: false,
        items: srcNavigation
      },
      {
        text: 'Tests',
        collapsed: false,
        items: testsNavigation
      },
    ],
  }
}

const vitePressConfig = defineConfig({
  lang: 'en-US',
  title: 'cdPerf',
  description: 'openCloud cloud testing toolbox.',
  lastUpdated: true,
  cleanUrls: true,
  base: '/cdperf/',
  srcExclude: [
    'README.md'
  ],
  head: [
    ['meta', {name: 'theme-color', content: '#3c8772'}],
  ],

  rewrites: {
    'docs/(.*)': '(.*)',
    'packages/:pkg/:ds(docs|tests|src)/(.*)': ':pkg/:ds/(.*)',
  },

  themeConfig: {
    nav: [
      {
        text: 'OpenCloud',
        link: 'https://github.com/opencloud-eu/opencloud'
      },
      {
        text: 'Web',
        link: 'https://github.com/opencloud-eu/web'
      },
      {
        text: pkg.version,
        items: [
          {
            text: 'Contributing',
            link: 'https://github.com/opencloud-eu/cdperf/blob/main/.github/contributing.md'
          }
        ]
      }
    ],

    sidebar: {
      ...sidebarK6Tests()
    },

    socialLinks: [
      {icon: 'github', link: 'https://github.com/opencloud-eu/cdperf'}
    ],

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: `Copyright (c) ${new Date().getFullYear()} OpenCloud GmbH <https://opencloud.eu/>`
    },
  }
})

export default vitePressConfig

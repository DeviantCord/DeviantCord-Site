import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', 'f54'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '182'),
    exact: true
  },
  {
    path: '/blog/authors',
    component: ComponentCreator('/blog/authors', '0b7'),
    exact: true
  },
  {
    path: '/blog/deviantcord4-upcoming-release',
    component: ComponentCreator('/blog/deviantcord4-upcoming-release', '431'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '287'),
    exact: true
  },
  {
    path: '/blog/tags/deviantcord-4',
    component: ComponentCreator('/blog/tags/deviantcord-4', '9cf'),
    exact: true
  },
  {
    path: '/blog/tags/update',
    component: ComponentCreator('/blog/tags/update', '9b3'),
    exact: true
  },
  {
    path: '/deviantcord',
    component: ComponentCreator('/deviantcord', '04d'),
    exact: true
  },
  {
    path: '/deviantcord4-status',
    component: ComponentCreator('/deviantcord4-status', 'f1e'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '71f'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '985'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'ec7'),
            routes: [
              {
                path: '/docs/category/commands',
                component: ComponentCreator('/docs/category/commands', 'd91'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/category/self-hosting',
                component: ComponentCreator('/docs/category/self-hosting', 'ad4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/commands/admin-commands',
                component: ComponentCreator('/docs/commands/admin-commands', '53a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/commands/command-list',
                component: ComponentCreator('/docs/commands/command-list', '4c7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/commands/listener-commands',
                component: ComponentCreator('/docs/commands/listener-commands', '1a9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/commands/update-commands',
                component: ComponentCreator('/docs/commands/update-commands', '4dc'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/self-hosting/requirements',
                component: ComponentCreator('/docs/self-hosting/requirements', '276'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/self-hosting/setup-docker',
                component: ComponentCreator('/docs/self-hosting/setup-docker', 'cc9'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', 'f21'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '1d3'),
    exact: true
  },
  {
    path: '/blog/deviantcord4-upcoming-release',
    component: ComponentCreator('/blog/deviantcord4-upcoming-release', '43f'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '243'),
    exact: true
  },
  {
    path: '/blog/tags/deviantcord-4',
    component: ComponentCreator('/blog/tags/deviantcord-4', '463'),
    exact: true
  },
  {
    path: '/blog/tags/update',
    component: ComponentCreator('/blog/tags/update', 'c60'),
    exact: true
  },
  {
    path: '/deviantcord',
    component: ComponentCreator('/deviantcord', 'ae3'),
    exact: true
  },
  {
    path: '/deviantcord4-status',
    component: ComponentCreator('/deviantcord4-status', 'd83'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '827'),
    routes: [
      {
        path: '/docs/category/commands',
        component: ComponentCreator('/docs/category/commands', '17f'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/category/self-hosting',
        component: ComponentCreator('/docs/category/self-hosting', '839'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/commands/admin-commands',
        component: ComponentCreator('/docs/commands/admin-commands', 'c59'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/commands/command-list',
        component: ComponentCreator('/docs/commands/command-list', '77b'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/commands/listener-commands',
        component: ComponentCreator('/docs/commands/listener-commands', '711'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/commands/update-commands',
        component: ComponentCreator('/docs/commands/update-commands', '23e'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/self-hosting/cockroach-serverless',
        component: ComponentCreator('/docs/self-hosting/cockroach-serverless', 'cb8'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/self-hosting/setup-docker',
        component: ComponentCreator('/docs/self-hosting/setup-docker', '3f3'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '0a6'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

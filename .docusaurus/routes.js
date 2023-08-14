import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', '96f'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '1d3'),
    exact: true
  },
  {
    path: '/blog/first-blog-post',
    component: ComponentCreator('/blog/first-blog-post', 'ab1'),
    exact: true
  },
  {
    path: '/blog/long-blog-post',
    component: ComponentCreator('/blog/long-blog-post', 'ff7'),
    exact: true
  },
  {
    path: '/blog/mdx-blog-post',
    component: ComponentCreator('/blog/mdx-blog-post', '58b'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '243'),
    exact: true
  },
  {
    path: '/blog/tags/docusaurus',
    component: ComponentCreator('/blog/tags/docusaurus', '55b'),
    exact: true
  },
  {
    path: '/blog/tags/facebook',
    component: ComponentCreator('/blog/tags/facebook', 'd29'),
    exact: true
  },
  {
    path: '/blog/tags/hello',
    component: ComponentCreator('/blog/tags/hello', 'dec'),
    exact: true
  },
  {
    path: '/blog/tags/hola',
    component: ComponentCreator('/blog/tags/hola', '6d4'),
    exact: true
  },
  {
    path: '/blog/welcome',
    component: ComponentCreator('/blog/welcome', '772'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '2e6'),
    exact: true
  },
  {
    path: '/test-page',
    component: ComponentCreator('/test-page', '8c7'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '4dd'),
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
        path: '/docs/intro',
        component: ComponentCreator('/docs/intro', 'aed'),
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

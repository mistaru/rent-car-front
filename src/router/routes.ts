import type { RouteRecordRaw } from 'vue-router';

const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { public: true },
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: () => import('@/pages/Vehicles.vue'),
    meta: { public: true },
  },
  {
    path: '/checkout/:id?',
    name: 'Checkout',
    component: () => import('@/pages/Checkout.vue'),
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
  },
  {
    path: '/auth',
    name: 'Users',
    component: () => import('@/pages/Credentials/Users.vue'),
  },
  {
    path: '/roles',
    name: 'Roles',
    component: () => import('@/pages/Credentials/Roles.vue'),
  },
  {
    path: '/permission',
    name: 'Permission',
    component: () => import('@/pages/Credentials/Permissions.vue'),
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
  },
];

export default staticRoutes;

import type { RouteRecordRaw } from 'vue-router';

const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/vehicles',
  },
  {
    path: '/home',
    redirect: '/bookings',
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: () => import('@/pages/rental/Vehicles.vue'),
    meta: { public: true },
  },
  {
    path: '/checkout/:id?',
    name: 'Checkout',
    component: () => import('@/pages/rental/Checkout.vue'),
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
    path: '/bookings',
    name: 'BookingsAdmin',
    component: () => import('@/pages/BookingsAdmin.vue'),
  },
  {
    path: '/vehicles-admin',
    name: 'VehiclesAdmin',
    component: () => import('@/pages/VehiclesAdmin.vue'),
  },
  {
    path: '/payments-admin',
    name: 'PaymentsAdmin',
    component: () => import('@/pages/PaymentAdmin.vue'),
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
    path: '/services-admin',
    name: 'ServicesAdmin',
    component: () => import('@/pages/ServicesAdmin.vue'),
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/pages/Reports.vue'),
  },
  {
    path: '/vehicle-attrs',
    name: 'VehicleAttrsAdmin',
    component: () => import('@/pages/VehicleAttrsAdmin.vue'),
  },
  {
    path: '/bookings-calendar',
    name: 'BookingsCalendar',
    component: () => import('@/pages/BookingsCalendar.vue'),
  },
  {
    path: '/bookings-table-calendar',
    name: 'BookingsTableCalendar',
    component: () => import('@/pages/BookingsTableCalendar.vue'),
  },
  {
    path: '/audit-log',
    name: 'AuditLog',
    component: () => import('@/pages/AuditLogAdmin.vue'),
  },
  {
    path: '/pricing-templates',
    name: 'PricingTemplatesAdmin',
    component: () => import('@/pages/PricingTemplatesAdmin.vue'),
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
  },
];

export default staticRoutes;

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from './stores/app';
import router from './router';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const drawer = ref(true);
const rail = ref(false);
const timeNow = ref(Date.now());
const lastUserActiveTime = ref<number | null>(null);
const expired = ref<number>(Number(sessionStorage.getItem('expired')) || 0);
const token = ref<string | null>(sessionStorage.getItem('token') || '');
const { menuList } = storeToRefs(store);

interface Permission {
  title: string
  icon: string
  path?: string
  value?: string
  children?: Permission[]
}
const links = computed(() => {
  return menuList.value
    .map(menu => {
      const isAdmin = menu?.screen?.value === 'ADMINISTRATION';
      const isDictScreen = menu?.screen?.value === 'DICT_SCREEN';  // Проверка для DICT_SCREEN
      const children = menu.permissions
        .map((permission) => ({
          title: permission.description,
          path: `/${permission.view}`,
          icon: permission.icon ?? 'mdi-credit-card-multiple',
        } as Permission));

      if (children.length === 1) {
        return {
          title: children[0].title,
          path: children[0].path,
          icon: children[0].icon,
        };
      }

      if (children.length > 0) {
        if (isAdmin) {
          return {
            title: menu.screen.description,
            icon: menu.screen.icon || 'mdi-view-dashboard',
            value: menu.screen.value,
            children,
          };
        } else if (isDictScreen) {
          return {
            title: menu.screen.description,
            icon: menu.screen.icon || 'mdi-folder',
            value: menu.screen.value,
            children,
          };
        } else {
          return children;
        }
      }

      return null;
    }).flat()
    .filter(Boolean);
});

const logout = () => {
  store.logout();
  router.push('/login');
};

const goToProfile = () => {
  router.push('/profile');
};

const isLoginPage = computed(() => router.currentRoute.value.path === '/login');
const isPublicPage = computed(() => router.currentRoute.value.meta?.public === true);

const convertTimesToMilliseconds = (time1: number, time2: number) => {
  return Math.abs(time1 - time2);
};

const refreshToken = async() => {
  try {
    console.info('Обновление токена');
    await store.refreshToken();
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
  }
};

watch(timeNow, (newTimeNow) => {
  if (newTimeNow && store.isLoggedIn) {
    const secondsTillLogout = Math.round((expired.value - newTimeNow) / 1000);
    const secondsForRefresh = 180;

    if (secondsTillLogout <= secondsForRefresh && token.value && lastUserActiveTime.value) {
      if (convertTimesToMilliseconds(timeNow.value, lastUserActiveTime.value) < secondsForRefresh) {
        refreshToken();
      }
    }
  }
});
if (!isLoginPage.value && !isPublicPage.value) {
  store.fetchMenu();
  store.init().then(() => {
    store.initialized = true;
  });
}
</script>

<template>
  <v-app>
    <template v-if="isLoginPage || isPublicPage">
      <router-view />
    </template>

    <template v-else>
      <template v-if="store.initialized">
        <v-navigation-drawer
          v-model="drawer"
          :rail="rail"
          permanent
          class="sidebar"
          @click="rail = false"
        >
          <!-- Brand header -->
          <div class="sidebar-brand pa-4 d-flex align-center ga-3" :class="{ 'justify-center': rail }">
            <v-avatar size="36" color="primary" variant="flat" rounded="lg">
              <v-icon color="white" size="20">mdi-car-sports</v-icon>
            </v-avatar>
            <div v-if="!rail" class="sidebar-brand__text">
              <div class="text-subtitle-2 font-weight-bold">LuxeDrive</div>
              <div class="text-caption text-medium-emphasis" style="font-size: 0.65rem; line-height: 1.2">Admin Panel</div>
            </div>
          </div>

          <v-divider class="mx-3" />

          <!-- Rental section -->
          <div v-if="!rail" class="sidebar-section-label">Аренда</div>
          <v-list density="compact" nav class="px-2">
            <v-list-item
              prepend-icon="mdi-calendar-check-outline"
              title="Бронирования"
              to="/bookings"
              rounded="lg"
              nav
              class="sidebar-item"
            />
            <v-list-item
              prepend-icon="mdi-calendar-month-outline"
              title="Календарь"
              to="/bookings-calendar"
              rounded="lg"
              nav
              class="sidebar-item"
            />
            <v-list-item
              prepend-icon="mdi-calendar-month-outline"
              title="Табличный - Календарь"
              to="/bookings-table-calendar"
              rounded="lg"
              nav
              class="sidebar-item"
            />
            <v-list-item
              prepend-icon="mdi-car-cog"
              title="Управление авто"
              to="/vehicles-admin"
              rounded="lg"
              nav
              class="sidebar-item"
            />
            <v-list-item
              prepend-icon="mdi-tune-variant"
              title="Характеристики"
              to="/vehicle-attrs"
              rounded="lg"
              nav
              class="sidebar-item"
            />
            <v-list-item
              prepend-icon="mdi-cog-outline"
              title="Доп. услуги"
              to="/services-admin"
              rounded="lg"
              nav
              class="sidebar-item"
            />
            <v-list-item
              prepend-icon="mdi-cash-register"
              title="Платежи"
              to="/payments-admin"
              rounded="lg"
              nav
              class="sidebar-item"
            />
            <v-list-item
              prepend-icon="mdi-chart-bar"
              title="Отчётность"
              to="/reports"
              rounded="lg"
              nav
              class="sidebar-item"
            />
          </v-list>

          <v-divider class="mx-3 my-1" />

          <!-- Admin section -->
          <div v-if="!rail" class="sidebar-section-label">Администрирование</div>
          <v-list density="compact" nav class="px-2">
            <template
              v-for="link in links"
              :key="link?.value"
            >
              <v-list-item
                v-if="!link?.children"
                :prepend-icon="link?.icon"
                :title="link?.title"
                :to="link?.path"
                rounded="lg"
                nav
                class="sidebar-item"
              />
              <v-list-group
                v-else
                :value="link?.value"
              >
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :prepend-icon="link?.icon"
                    :title="link?.title"
                    rounded="lg"
                    class="sidebar-item"
                  />
                </template>
                <v-list-item
                  v-for="child in link?.children"
                  :key="child.title"
                  :prepend-icon="child.icon"
                  :title="child.title"
                  :to="child.path"
                  rounded="lg"
                  nav
                  class="sidebar-item sidebar-item--nested"
                />
              </v-list-group>
            </template>
          </v-list>

          <!-- Bottom section -->
          <template #append>
            <v-divider class="mx-3" />
            <v-list density="compact" nav class="px-2 py-2">
              <v-list-item
                prepend-icon="mdi-account-circle-outline"
                title="Профиль"
                to="/profile"
                rounded="lg"
                nav
                class="sidebar-item"
              />
            </v-list>
          </template>
        </v-navigation-drawer>

        <v-app-bar class="app-header" flat border="b">
          <v-app-bar-nav-icon
            variant="text"
            @click.stop="rail = !rail"
          />
          <v-toolbar-title class="text-body-1 font-weight-medium text-medium-emphasis">
            LuxeDrive
          </v-toolbar-title>
          <v-spacer />
          <toggle-theme />
          <template #append>
            <v-btn
              icon
              variant="text"
              @click="goToProfile"
            >
              <v-avatar size="32" color="primary" variant="tonal">
                <v-icon size="18">mdi-account</v-icon>
              </v-avatar>
            </v-btn>
            <v-btn
              icon="mdi-logout"
              variant="text"
              @click="logout"
            />
          </template>
        </v-app-bar>

        <v-main>
          <router-view />
        </v-main>
      </template>
    </template>

    <Notification />
  </v-app>
  <list-snack-bar />
</template>

<style lang="scss">
.app-header {
  max-height: 56px;
  background: #f8f7fc !important;
}

/* Sidebar */
.sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.06) !important;
  background: #ffffff !important;
}

.sidebar-brand {
  min-height: 56px;
}

.sidebar-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(0, 0, 0, 0.35);
  padding: 12px 20px 4px;
  user-select: none;
}

.sidebar-item {
  margin-bottom: 2px !important;
  font-size: 0.875rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &.v-list-item--active {
    background: linear-gradient(135deg, rgba(49, 27, 146, 0.08), rgba(69, 39, 160, 0.12));
    color: #4527a0;

    .v-icon {
      color: #4527a0;
    }
  }

  .v-list-item__prepend .v-icon {
    opacity: 0.6;
  }

  &:hover {
    background: rgba(103, 58, 183, 0.05);
  }

  &:hover .v-list-item__prepend .v-icon {
    opacity: 1;
  }
}

.sidebar-item--nested {
  padding-left: 12px !important;
  font-size: 0.825rem;
}
</style>

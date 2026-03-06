<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ref, onMounted, computed } from 'vue';
import { useUsersStore } from '@/stores/permissions';
import { useNotificationStore } from '@/stores/notifications';
import type { Role, Permission, EditablePermission } from '@/stores/types';

const store = useUsersStore();
const appStore = useAppStore();
const { addNotification } = useNotificationStore();

const loading = ref(false);
const dialog = ref(false);
const saveLoading = ref(false);
const selectedRole = ref<Role | null>(null);

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Название', key: 'name' },
  { title: 'Описание', key: 'description' },
  { title: 'Действия', key: 'actions', sortable: false },
];

const permissionHeaders = [
  { title: 'Название', key: 'name.description' },
  { title: 'Чтение', key: 'read' },
  { title: 'Создание', key: 'create' },
  { title: 'Редактирование', key: 'update' },
  { title: 'Удаление', key: 'delete' },
];

const canUpdate = computed(() => appStore.checkAccess('roles', 'update'));
const canDelete = computed(() => appStore.checkAccess('roles', 'delete'));
const canCreate = computed(() => appStore.checkAccess('roles', 'create'));
const fetchRoles = async() => {
  loading.value = true;
  try {
    await store.fetchUserRoles();
  } catch (error) {
    addNotification('error', error instanceof Error ? error.message : 'Ошибка при загрузке ролей');
  } finally {
    loading.value = false;
  }
};

const openDialog = async(role?: Role) => {
  if (!store.permissions.length) {
    await store.fetchPermissions();
  }

  const existingPermissionsMap = new Map(
    (role?.permissions ?? []).map(p => [p.id, p])
  );
  selectedRole.value = role
    ? ({
      ...role,
      permissions: store.permissions.map((p: Permission) => {
        const existingPermission = existingPermissionsMap.get(p.id);
        const access = existingPermission?.access ?? 0;
        return {
          id: p.id,
          name: p.name,
          access: p.access === 0 ? 0 : p.access,
          read: Boolean(access & 0b0100),
          create: Boolean(access & 0b1000),
          update: Boolean(access & 0b0010),
          delete: Boolean(access & 0b0001),
        } as EditablePermission;
      }),
    } as Role & { permissions: EditablePermission[] })
    : ({
      name: '',
      description: '',
      permissions: store.permissions.map((p: Permission) => ({
        id: p.id,
        name: p.name,
        access: 0,
        read: false,
        create: false,
        update: false,
        delete: false,
      })) as EditablePermission[],
    } as Role & { permissions: EditablePermission[] });

  dialog.value = true;
};

const saveRole = async() => {
  if (!selectedRole.value) return;
  saveLoading.value = true;
  try {
    const filteredPermissions = (selectedRole.value.permissions ?? [])
      .filter(p => p.read || p.create || p.update || p.delete)
      .map(p => ({
        id: p.id,
        name: p.name,
        access:
          (p.create ? 0b1000 : 0) |
          (p.read ? 0b0100 : 0) |
          (p.update ? 0b0010 : 0) |
          (p.delete ? 0b0001 : 0),
      }));

    const roleDataToSend = {
      ...selectedRole.value,
      permissions: filteredPermissions,
    };
    await store.createRole(roleDataToSend);
    addNotification('success', 'Роль успешно сохранена');
    dialog.value = false;
    await fetchRoles();
  } catch (error) {
    addNotification('error', error instanceof Error ? error.message : 'Ошибка при сохранении роли');
  } finally {
    saveLoading.value = false;
  }
};

const deleteRole = async(id: number) => {
  try {
    await store.deleteRole(id);
    addNotification('success', 'Роль удалена');
    await fetchRoles();
  } catch (error) {
    addNotification('error', error instanceof Error ? error.message : 'Ошибка при удалении роли');
  }
};

onMounted(() => {
  fetchRoles();
  store.fetchPermissions();
});
</script>

<template>
  <v-container fluid class="admin-page pa-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center ga-3">
        <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
          <v-icon size="22">mdi-shield-account-outline</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h5 font-weight-bold">Роли</h1>
          <p class="text-caption text-medium-emphasis">Управление ролями и правами доступа</p>
        </div>
      </div>
      <v-btn
        v-if="canCreate"
        color="primary"
        variant="flat"
        rounded="lg"
        @click="openDialog()"
      >
        <v-icon start>mdi-plus</v-icon>
        Создать роль
      </v-btn>
    </div>

    <v-card elevation="0" rounded="xl" class="admin-card">
      <v-data-table
        :headers="headers"
        :items="store.roles"
        :loading="loading"
        item-value="id"
        hover
        class="admin-table"
      >
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-tooltip v-if="canUpdate" text="Редактировать" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="primary" @click="openDialog(item)">
                  <v-icon size="20">mdi-pencil-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip v-if="canDelete" text="Удалить" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="error" @click="deleteRole(item.id)">
                  <v-icon size="20">mdi-delete-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog
      v-model="dialog"
      max-width="800px"
    >
      <v-card rounded="xl">
        <div class="dialog-header pa-6 pb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
              <v-icon size="22">mdi-shield-edit-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ selectedRole?.id ? 'Редактирование роли' : 'Создание роли' }}</div>
              <div class="text-caption text-medium-emphasis">Настройте название и права доступа</div>
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="pa-6">
          <v-text-field
            v-model="selectedRole!.name"
            variant="outlined"
            rounded="lg"
            density="comfortable"
            class="mb-4"
            label="Название"
            required
          />
          <v-text-field
            v-model="selectedRole!.description"
            variant="outlined"
            rounded="lg"
            density="comfortable"
            label="Описание"
            class="mb-4"
          />

          <v-data-table
            :headers="permissionHeaders"
            :items="selectedRole!.permissions"
            class="admin-table"
          >
            <template #item.read="{ item }">
              <v-checkbox v-model="item.read" color="primary" hide-details density="compact" />
            </template>
            <template #item.create="{ item }">
              <v-checkbox v-model="item.create" color="primary" hide-details density="compact" />
            </template>
            <template #item.update="{ item }">
              <v-checkbox v-model="item.update" color="primary" hide-details density="compact" />
            </template>
            <template #item.delete="{ item }">
              <v-checkbox v-model="item.delete" color="primary" hide-details density="compact" />
            </template>
          </v-data-table>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="dialog = false">
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="saveLoading"
            @click="saveRole"
          >
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.admin-page {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}
.admin-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.admin-table :deep(th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5) !important;
}
.dialog-header {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.03), rgba(40, 53, 147, 0.05));
}
</style>

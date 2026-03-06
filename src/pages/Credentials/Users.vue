<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUsersStore } from '@/stores/permissions';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import ModalDialog from '@/components/UserModal.vue';
import Rules from '@/utils/rules';

const usersStore = useUsersStore();
const appStore = useAppStore();
const { users, roles } = storeToRefs(usersStore);

const userDialog = ref(false);
const loading = ref(false);
const isEditing = ref(false);
const showPassword = ref(false);

const reassignDialog = ref(false);
const toReassignUser = ref<number | null>(null);
const fromReassignUser = ref<number | null>(null);
const usersList = ref([]);

interface UserForm {
  id?: number
  name: string,
  password: string,
  roles: number[],
}
const newUser = ref<UserForm>({
  name: '',
  password: '',
  roles: [],
});

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Имя пользователя', key: 'username' },
  { title: 'Роли', key: 'roles' },
  { title: 'Активен', key: 'active' },
  { title: 'Действия', key: 'actions' },
];

const getUsers = async(): Promise<void> => {
  loading.value = true;
  try {
    await usersStore.fetchUserList();
    await usersStore.fetchUserRoles();
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
  } finally {
    loading.value = false;
  }
};

const deleteUser = async(id: number): Promise<void> => {
  try {
    await usersStore.deleteUser(id);
    await getUsers();
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
  }
};

const createUser = async(): Promise<void> => {

  try {
    await usersStore.createUser({
      id: newUser.value.id,
      username: newUser.value.name,
      password: newUser.value.password,
      roles: newUser.value.roles.map((u: number) => ({ id: u })),
    });

    closeUserModal();
    await getUsers();
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
  }
};

const editUser = (id: number): void => {
  const user = users.value.find(u => u.id === id);

  if (user) {
    newUser.value = {
      id: Number(user.id),
      name: user.username || '',
      password: '',
      roles: user.roles.map(role => role.id),
    };
    isEditing.value = true;
    userDialog.value = true;
  }
};

const closeUserModal = (): void => {
  newUser.value = { name: '', password: '', roles: [] };
  userDialog.value = false;
  isEditing.value = false;
};

const openCreateUserModal = (): void => {
  newUser.value = { name: '', password: '', roles: [] };
  isEditing.value = false;
  userDialog.value = true;
};

const confirmDeleteUser = async(id: number): Promise<void> => {
  const user = users.value.find(u => u.id === id);
  if (user) {
    try {
      const confirmDelete = confirm(`Вы уверены, что хотите удалить пользователя ${user.username}?`);
      if (confirmDelete) {
        const hasCargos = await cargoStore.checkUserCargos(id);
        if (hasCargos) {
          await openReassignDialog(id);
          return;
        }
        await deleteUser(id);

      }
    } catch (error) {
      console.error('Ошибка при проверке или удалении пользователя:', error);
    }
  }
};

const openReassignDialog = async(id: number): Promise<void> => {
  try {
    fromReassignUser.value = id;
    const allUsers = await usersStore.fetchUserList();
    usersList.value = allUsers.filter(user => user.id !== fromReassignUser.value);
    reassignDialog.value = true;
  } catch (error) {
    console.error('Ошибка при загрузке данных для переназначения:', error);
  }
};

const confirmReassign = async(): Promise<void> => {
  if (toReassignUser.value) {
    try {
      await cargoStore.reassignCargos(fromReassignUser.value!, toReassignUser.value);
      await deleteUser(fromReassignUser.value!);
      reassignDialog.value = false;
      fromReassignUser.value = null;
      fromReassignUser.value = null;
      toReassignUser.value = null;
    } catch (error) {
      console.error('Ошибка при переназначении грузов:', error);
    }
  }
};

const canUpdate = computed(() => appStore.checkAccess('auth', 'update'));
const canDelete = computed(() => appStore.checkAccess('auth', 'delete'));
const canCreate = computed(() => appStore.checkAccess('auth', 'create'));

const toggleBlockUser = async(id: number, block: boolean): Promise<void> => {
  try {
    await usersStore.blockUser(id, block);
    await getUsers();
  } catch (error) {
    console.error('Ошибка блокировки пользователя:', error);
  }
};

onMounted(getUsers);
</script>

<template>
  <v-container fluid class="admin-page pa-6">
    <ModalDialog
      v-model:dialog="userDialog"
      :title="isEditing ? 'Редактировать пользователя' : 'Создать пользователя'"
      :confirm-text="isEditing ? 'Сохранить' : 'Создать'"
      @confirm="createUser"
      @close="closeUserModal"
    >
      <form>
        <v-text-field
          v-model="newUser.name"
          :rules="Rules.login"
          label="Имя пользователя"
          variant="outlined"
          rounded="lg"
          density="comfortable"
          class="mb-4"
        />
        <v-text-field
          v-model="newUser.password"
          :rules="Rules.password"
          :type="showPassword ? 'text' : 'password'"
          label="Пароль"
          autocomplete="on"
          variant="outlined"
          rounded="lg"
          density="comfortable"
          class="mb-4"
        >
          <template #append-inner>
            <v-icon @click="showPassword = !showPassword">
              {{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}
            </v-icon>
          </template>
        </v-text-field>
        <v-select
          v-model="newUser.roles"
          label="Роли"
          :items="roles"
          item-title="name"
          item-value="id"
          multiple
          variant="outlined"
          rounded="lg"
          density="comfortable"
        />
      </form>
    </ModalDialog>

    <ModalDialog
      v-model:dialog="reassignDialog"
      :title='"Необходимо переназначить грузы!"'
      :confirm-text='"Подтвердить"'
      @confirm="confirmReassign"
      @close="reassignDialog"
    >
      <form>
        <v-select
          v-model="toReassignUser"
          :items="usersList"
          item-title="username"
          item-value="id"
          label="Пользователь"
          variant="outlined"
          rounded="lg"
          density="comfortable"
        />
      </form>
    </ModalDialog>

    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center ga-3">
        <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
          <v-icon size="22">mdi-account-group-outline</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h5 font-weight-bold">Пользователи</h1>
          <p class="text-caption text-medium-emphasis">Управление учётными записями</p>
        </div>
      </div>
      <v-btn
        v-if="canCreate"
        color="primary"
        variant="flat"
        rounded="lg"
        @click="openCreateUserModal"
      >
        <v-icon start>mdi-plus</v-icon>
        Создать пользователя
      </v-btn>
    </div>

    <v-card elevation="0" rounded="xl" class="admin-card">
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        item-value="id"
        hover
        class="admin-table"
      >
        <template #item.roles="{ item }">
          <div class="d-flex ga-1 flex-wrap">
            <v-chip
              v-for="role in (item?.roles || [])"
              :key="role.id"
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ role.name }}
            </v-chip>
          </div>
        </template>

        <template #item.active="{ item }">
          <v-chip
            :color="item.blocked ? 'error' : 'success'"
            size="small"
            variant="tonal"
            :prepend-icon="item.blocked ? 'mdi-lock-outline' : 'mdi-check-circle-outline'"
          >
            {{ item.blocked ? 'Заблокирован' : 'Активен' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-tooltip v-if="canUpdate" text="Редактировать" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="primary" @click="editUser(item.id)">
                  <v-icon size="20">mdi-pencil-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip v-if="canUpdate" :text="item.blocked ? 'Разблокировать' : 'Заблокировать'" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" :color="item.blocked ? 'success' : 'warning'" @click="toggleBlockUser(item.id, !item.blocked)">
                  <v-icon size="20">{{ item.blocked ? 'mdi-lock-open-outline' : 'mdi-lock-outline' }}</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip v-if="canDelete" text="Удалить" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="error" @click="confirmDeleteUser(item.id)">
                  <v-icon size="20">mdi-delete-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>
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
</style>


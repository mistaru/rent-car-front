<script setup lang="ts">
import { ref } from 'vue';
import ModalDialog from '@/components/UserModal.vue';
import { useUsersStore } from '@/stores/permissions';
import type { Role } from '@/stores/types';
import Rules from '@/utils/rules';
import { storeToRefs } from 'pinia';

const usersStore = useUsersStore();
const store = useAppStore();
const { user } = storeToRefs(store);
const isModal = ref(false);
const passwordInfo = ref({
  currentPassword: '',
  newPassword: '',
  repeatNewPassword: '',
});

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showRepeatPassword = ref(false);
const role = ref<Role | string>('');

const activateRole = () => {
  const id = typeof role.value === 'object' ? `${role.value?.id}` : role.value;
  store.activateRole(id);
};

const openModal = () => {
  isModal.value = true;
};

const closeUserModal = () => {
  passwordInfo.value = { currentPassword: '', newPassword: '', repeatNewPassword: '' };
  isModal.value = false;
};

const passwordRules = Rules.password;

const updatePassword = () => {
  if (passwordInfo.value.newPassword !== passwordInfo.value.repeatNewPassword) {
    alert('Новый пароль и его повтор не совпадают');
    return;
  }

  const { repeatNewPassword, ...dataToSend } = passwordInfo.value;

  usersStore.updatePassword(dataToSend);
  closeUserModal();
};

onMounted(() => {
  user.value?.roles?.some(i => {
    if (i.active) {
      role.value = i;
      return true;
    }
  });
});
</script>

<template>
  <v-container fluid class="admin-page pa-6">
    <!-- Page header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
        <v-icon size="22">mdi-account-outline</v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h5 font-weight-bold">Профиль</h1>
        <p class="text-caption text-medium-emphasis">Информация о пользователе</p>
      </div>
    </div>

    <v-card elevation="0" rounded="xl" class="admin-card pa-6">
      <div class="d-flex ga-4 align-center flex-wrap">
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          @click="openModal"
        >
          <v-icon start>mdi-lock-reset</v-icon>
          Обновить пароль
        </v-btn>

        <v-select
          v-model="role"
          :items="user.roles"
          item-title="description"
          item-value="id"
          variant="outlined"
          rounded="lg"
          density="comfortable"
          class="profile-roles"
          label="Текущая роль"
          hide-details
          @update:model-value="activateRole"
        />
      </div>
    </v-card>
  </v-container>
  <ModalDialog
    v-model:dialog="isModal"
    title="Обновление пароля"
    confirm-text="Обновить"
    @confirm="updatePassword"
    @close="closeUserModal"
  >
    <v-form>
      <v-text-field
        v-model="passwordInfo.currentPassword"
        label="Текущий пароль"
        :type="showCurrentPassword ? 'text' : 'password'"
        variant="outlined"
        rounded="lg"
        density="comfortable"
        append-inner-icon="mdi-eye"
        @click:append-inner="showCurrentPassword = !showCurrentPassword"
      />
      <v-text-field
        v-model="passwordInfo.newPassword"
        label="Новый пароль"
        :type="showNewPassword ? 'text' : 'password'"
        :rules="passwordRules"
        variant="outlined"
        rounded="lg"
        density="comfortable"
        append-inner-icon="mdi-eye"
        @click:append-inner="showNewPassword = !showNewPassword"
      />
      <v-text-field
        v-model="passwordInfo.repeatNewPassword"
        label="Повторите новый пароль"
        :type="showRepeatPassword ? 'text' : 'password'"
        :rules="passwordRules"
        variant="outlined"
        rounded="lg"
        density="comfortable"
        append-inner-icon="mdi-eye"
        @click:append-inner="showRepeatPassword = !showRepeatPassword"
      />
    </v-form>
  </ModalDialog>
</template>
<style scoped>
.admin-page {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}
.admin-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.profile-roles {
  max-width: 300px;
}
</style>

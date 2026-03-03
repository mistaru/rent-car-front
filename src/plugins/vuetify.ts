import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { ru } from 'vuetify/locale';

// Composables
import { createVuetify } from 'vuetify';

export default createVuetify({
  components: {
    VDateInput,
  },
  locale: {
    locale: 'ru',
    messages: { ru },
  },
  theme: {
    defaultTheme: 'luxedrive',
    themes: {
      luxedrive: {
        dark: false,
        colors: {
          primary: '#5C3BBF',
          'primary-darken-1': '#4527A0',
          secondary: '#283593',
          accent: '#B388FF',
          surface: '#FFFFFF',
          background: '#F8F7FC',
          error: '#E53935',
          info: '#1E88E5',
          success: '#43A047',
          warning: '#FB8C00',
        },
      },
    },
  },
});

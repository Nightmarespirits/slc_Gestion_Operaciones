<template>
  <v-container class="mt-0 pt-0">
       <!-- Barra de Acciones -->
       <v-row app class="d-flex justify-center pa-4">
          <v-btn
              @click="toggleEdit"
              color="primary"
              variant="outlined"
              class="mx-2"
          >
              {{ isEditing ? 'Cancelar Edición' : 'Editar Configuración' }}
          </v-btn>

          <v-btn
              v-if="isEditing"
              @click="saveChanges"
              color="success"
              :loading="saving"
              :disabled="!isFormValid"
          >
              Guardar Cambios
          </v-btn>
      </v-row>
      
      <!-- Snackbar para notificaciones -->
      <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          :timeout="3000"
      >
          {{ snackbar.text }}
          <template v-slot:actions>
              <v-btn
                  color="white"
                  text
                  @click="snackbar.show = false"
              >
                  Cerrar
              </v-btn>
          </template>
      </v-snackbar>
      
      <v-row>
          <!-- Sección Principal con Tabs -->
          <v-col cols="12">
              <v-card>
                  <v-tabs
                      v-model="activeTab"
                      background-color="primary"
                  >
                      <v-tab value="perfil">
                          <v-icon start>mdi-account-circle</v-icon>
                          Perfil Empresarial
                      </v-tab>
                      <v-tab value="seguridad">
                          <v-icon start>mdi-shield-lock</v-icon>
                          Seguridad
                      </v-tab>
                      <v-tab value="configuracion">
                          <v-icon start>mdi-cog</v-icon>
                          Configuración General
                      </v-tab>
                  </v-tabs>

                  <v-card-text>
                      <v-window v-model="activeTab">
                          <!-- Tab de Perfil Empresarial -->
                          <v-window-item value="perfil">
                              <v-row>
                                  <v-col cols="12" md="4" class="text-center">
                                      <v-card flat>
                                          <v-card-text>
                                              <v-avatar size="150" class="mb-4">
                                                  <v-img
                                                      :src="company.logoUrl || '/default-logo.png'"
                                                      alt="Logo Empresarial"
                                                      class="company-logo"
                                                  />
                                              </v-avatar>
                                              <v-file-input
                                                  v-if="isEditing"
                                                  v-model="newLogo"
                                                  accept="image/*"
                                                  label="Cambiar Logo"
                                                  prepend-icon="mdi-camera"
                                                  @change="handleLogoChange"
                                                  hide-details
                                                  class="mt-2"
                                              ></v-file-input>
                                          </v-card-text>
                                      </v-card>
                                  </v-col>

                                  <v-col cols="12" md="8">
                                      <v-form ref="profileForm" v-model="valid">
                                          <v-text-field
                                              v-model="company.name"
                                              label="Nombre de la Empresa"
                                              :readonly="!isEditing"
                                              :rules="[rules.required]"
                                              variant="outlined"
                                              density="comfortable"
                                              class="mb-2"
                                          ></v-text-field>

                                          <v-text-field
                                              v-model="company.ruc"
                                              label="RUC"
                                              :readonly="!isEditing"
                                              :rules="[rules.required, rules.ruc]"
                                              variant="outlined"
                                              density="comfortable"
                                              class="mb-2"
                                          ></v-text-field>

                                          <v-textarea
                                              v-model="company.description"
                                              label="Descripción de la Empresa"
                                              :readonly="!isEditing"
                                              variant="outlined"
                                              rows="3"
                                              class="mb-2"
                                          ></v-textarea>

                                          <v-row>
                                              <v-col cols="12" md="6">
                                                  <v-text-field
                                                      v-model="company.phone"
                                                      label="Teléfono"
                                                      :readonly="!isEditing"
                                                      :rules="[rules.phone]"
                                                      variant="outlined"
                                                      density="comfortable"
                                                      prepend-icon="mdi-phone"
                                                  ></v-text-field>
                                              </v-col>
                                              <v-col cols="12" md="6">
                                                  <v-text-field
                                                      v-model="company.email"
                                                      label="Email Corporativo"
                                                      :readonly="!isEditing"
                                                      :rules="[rules.required, rules.email]"
                                                      variant="outlined"
                                                      density="comfortable"
                                                      prepend-icon="mdi-email"
                                                  ></v-text-field>
                                              </v-col>
                                          </v-row>

                                          <v-text-field
                                              v-model="company.address"
                                              label="Dirección"
                                              :readonly="!isEditing"
                                              variant="outlined"
                                              density="comfortable"
                                              prepend-icon="mdi-map-marker"
                                              class="mb-2"
                                          ></v-text-field>
                                      </v-form>
                                  </v-col>
                              </v-row>
                          </v-window-item>

                          <!-- Tab de Seguridad -->
                          <v-window-item value="seguridad">
                              <v-form ref="securityForm" v-model="validSecurity">
                                  <v-row>
                                      <v-col cols="12" md="6">
                                          <v-text-field
                                              v-model="security.currentPassword"
                                              label="Contraseña Actual"
                                              :type="showPassword ? 'text' : 'password'"
                                              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                                              @click:append="showPassword = !showPassword"
                                              variant="outlined"
                                              :readonly="!isEditing"
                                              :rules="[rules.required]"
                                          ></v-text-field>
                                      </v-col>
                                      <v-col cols="12" md="6">
                                          <v-text-field
                                              v-model="security.newPassword"
                                              label="Nueva Contraseña"
                                              :type="showPassword ? 'text' : 'password'"
                                              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                                              @click:append="showPassword = !showPassword"
                                              variant="outlined"
                                              :readonly="!isEditing"
                                              :rules="[rules.required, rules.password]"
                                          ></v-text-field>
                                      </v-col>
                                  </v-row>

                                  <v-card flat class="mt-4">
                                      <v-card-title>Configuración de Seguridad Adicional</v-card-title>
                                      <v-card-text>
                                          <v-switch
                                              v-model="security.twoFactorAuth"
                                              label="Autenticación de dos factores"
                                              :disabled="!isEditing"
                                              color="primary"
                                          ></v-switch>
                                          <v-switch
                                              v-model="security.emailNotifications"
                                              label="Notificaciones por correo de inicio de sesión"
                                              :disabled="!isEditing"
                                              color="primary"
                                          ></v-switch>
                                      </v-card-text>
                                  </v-card>
                              </v-form>
                          </v-window-item>

                          <!-- Tab de Configuración General -->
                          <v-window-item value="configuracion">
                              <v-form ref="configForm" v-model="validConfig">
                                  <v-card flat>
                                      <v-card-title>Preferencias del Sistema</v-card-title>
                                      <v-card-text>
                                          <v-select
                                              v-model="config.timezone"
                                              :items="timezoneOptions"
                                              label="Zona Horaria"
                                              :readonly="!isEditing"
                                              variant="outlined"
                                          ></v-select>

                                          <v-select
                                              v-model="config.dateFormat"
                                              :items="dateFormatOptions"
                                              label="Formato de Fecha"
                                              :readonly="!isEditing"
                                              variant="outlined"
                                          ></v-select>

                                          <v-select
                                              v-model="config.language"
                                              :items="languageOptions"
                                              label="Idioma del Sistema"
                                              :readonly="!isEditing"
                                              variant="outlined"
                                          ></v-select>

                                          <v-switch
                                              v-model="config.darkMode"
                                              label="Modo Oscuro"
                                              :disabled="!isEditing"
                                              color="primary"
                                          ></v-switch>
                                      </v-card-text>
                                  </v-card>
                              </v-form>
                          </v-window-item>
                      </v-window>
                  </v-card-text>
              </v-card>
          </v-col>
      </v-row>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

// Estados
const activeTab = ref('perfil');
const valid = ref(false);
const validSecurity = ref(false);
const validConfig = ref(false);
const isEditing = ref(false);
const showPassword = ref(false);
const saving = ref(false);
const newLogo = ref(null);

// Datos de la empresa
const company = ref({
  name: '',
  ruc: '',
  description: '',
  logoUrl: '',
  phone: '',
  email: '',
  address: ''
});

// Datos de seguridad
const security = ref({
  currentPassword: '',
  newPassword: '',
  twoFactorAuth: false,
  emailNotifications: true
});

// Configuración general
const config = ref({
  timezone: 'America/Lima',
  dateFormat: 'DD/MM/YYYY',
  language: 'es',
  darkMode: false
});

// Opciones para selects
const timezoneOptions = [
  { title: 'Lima (GMT-5)', value: 'America/Lima' },
  { title: 'New York (GMT-4)', value: 'America/New_York' }
];

const dateFormatOptions = [
  { title: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { title: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { title: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
];

const languageOptions = [
  { title: 'Español', value: 'es' },
  { title: 'English', value: 'en' }
];

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Reglas de validación
const rules = {
  required: v => !!v || 'Este campo es requerido',
  email: v => /.+@.+\..+/.test(v) || 'Email debe ser válido',
  phone: v => /^\+?[\d\s-]{8,}$/.test(v) || 'Teléfono debe ser válido',
  ruc: v => /^\d{11}$/.test(v) || 'RUC debe tener 11 dígitos',
  password: v => (v && v.length >= 8) || 'La contraseña debe tener al menos 8 caracteres'
};

// Computed properties
const isFormValid = computed(() => {
  switch (activeTab.value) {
      case 'perfil':
          return valid.value;
      case 'seguridad':
          return validSecurity.value;
      case 'configuracion':
          return validConfig.value;
      default:
          return false;
  }
});

// Métodos
const showNotification = (text, color = 'success') => {
  snackbar.value = {
      show: true,
      text,
      color
  };
};

const toggleEdit = () => {
  if (isEditing.value) {
      resetForm();
  }
  isEditing.value = !isEditing.value;
};

const handleLogoChange = async (file) => {
  if (!file) return;
  
  try {
      const formData = new FormData();
      formData.append('logo', file);
      
      // Simular carga de archivo
      await new Promise(resolve => setTimeout(resolve, 1000));
      company.value.logoUrl = URL.createObjectURL(file);
      
      showNotification('Logo actualizado correctamente');
  } catch (error) {
      showNotification('Error al actualizar el logo', 'error');
  }
};

const loadCompanyData = async () => {
  try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      company.value = {
          name: 'Mi Empresa S.A.C.',
          ruc: '20123456789',
          description: 'Empresa líder en soluciones empresariales',
          logoUrl: '/company-logo.png',
          phone: '+51 123 456 789',
          email: 'contacto@miempresa.com',
          address: 'Av. Principal 123, Lima'
      };
  } catch (error) {
      showNotification('Error al cargar datos de la empresa', 'error');
  }
};

const saveChanges = async () => {
  saving.value = true;
  try {
      // Simular guardado en API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification('Cambios guardados correctamente');
      isEditing.value = false;
  } catch (error) {
      showNotification('Error al guardar los cambios', 'error');
  } finally {
      saving.    value = false;
    }
};

// Cargar datos iniciales al montar el componente
onMounted(() => {
    loadCompanyData();
});

// Resetear los formularios a sus valores iniciales
const resetForm = () => {
    loadCompanyData();
    showNotification('Formulario reiniciado', 'info');
};

// Manejar guardado de configuración de seguridad
const saveSecuritySettings = async () => {
    saving.value = true;
    try {
        // Simulación de API ficticia para seguridad
        await new Promise(resolve => setTimeout(resolve, 1500));
        showNotification('Configuración de seguridad guardada', 'success');
    } catch (error) {
        showNotification('Error al guardar configuración de seguridad', 'error');
    } finally {
        saving.value = false;
    }
};

// Cargar configuración general simulada desde API ficticia
const loadGeneralConfig = async () => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        config.value = {
            timezone: 'America/Lima',
            dateFormat: 'DD/MM/YYYY',
            language: 'es',
            darkMode: true
        };
    } catch (error) {
        showNotification('Error al cargar configuración general', 'error');
    }
};

// Montar configuración general al cargar
onMounted(() => {
    loadGeneralConfig();
});

// Guardar configuración general
const saveGeneralConfig = async () => {
    saving.value = true;
    try {
        // Simulación de guardado de configuración
        await new Promise(resolve => setTimeout(resolve, 1500));
        showNotification('Configuración general guardada', 'success');
        isEditing.value = false;
    } catch (error) {
        showNotification('Error al guardar configuración general', 'error');
    } finally {
        saving.value = false;
    }
};
</script>

<style scoped>
.company-logo {
    border-radius: 10px;
    object-fit: cover;
}
</style>

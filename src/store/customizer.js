import { defineStore } from "pinia";
import config from "../config";

export const useCustomizerStore = defineStore({
  id: 'customizer',
  state: () => ({
    Sidebar_drawer: config.Sidebar_drawer
  }),

  getters: {},
  actions: {
    SET_SIDEBAR_DRAWER() {
      this.Sidebar_drawer = !this.Sidebar_drawer;
    }
  }
})
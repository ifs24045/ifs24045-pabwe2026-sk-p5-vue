import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";

const EmptyPage = { render: () => null };

export const createMockPinia = () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
};

// Render komponen lengkap dengan Pinia + Memory Router.
// Ubah state store di test lewat: useXStore(pinia).$patch({ ... })
export const renderWithProviders = async (
  component,
  {
    props = {},
    slots = {},
    route = "/",
    routes = [{ path: "/:pathMatch(.*)*", component: EmptyPage }],
    pinia = createMockPinia(),
    global = {},
    attachTo,
  } = {}
) => {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.push(route);
  await router.isReady();

  const wrapper = mount(component, {
    props,
    slots,
    attachTo,
    global: {
      ...global,
      plugins: [pinia, router, ...(global.plugins || [])],
    },
  });

  return { wrapper, router, pinia };
};
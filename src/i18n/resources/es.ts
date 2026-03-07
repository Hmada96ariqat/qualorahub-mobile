import animalFormEs from '../locales/es/animalForm.json';
import animalHousingEs from '../locales/es/animalHousing.json';
import animalProfileEs from '../locales/es/animalProfile.json';
import categoriesEs from '../locales/es/categories.json';
import commonEs from '../locales/es/common.json';
import contactsEs from '../locales/es/contacts.json';
import cropsEs from '../locales/es/crops.json';
import dashboardEs from '../locales/es/dashboard.json';
import equipmentEs from '../locales/es/equipment.json';
import farmConfigurationEs from '../locales/es/farmConfiguration.json';
import feedWaterEs from '../locales/es/feedWater.json';
import fieldsEs from '../locales/es/fields.json';
import financeEs from '../locales/es/finance.json';
import logbookEs from '../locales/es/logbook.json';
import marketingEs from '../locales/es/marketing.json';
import orderListEs from '../locales/es/orderList.json';
import productsEs from '../locales/es/products.json';
import productionCyclesEs from '../locales/es/productionCycles.json';
import settingsEs from '../locales/es/settings.json';
import sidebarEs from '../locales/es/sidebar.json';
import stockAdjustmentEs from '../locales/es/stockAdjustment.json';
import stockCountEs from '../locales/es/stockCount.json';
import storeDashboardEs from '../locales/es/storeDashboard.json';
import tasksEs from '../locales/es/tasks.json';
import taxesEs from '../locales/es/taxes.json';
import usersEs from '../locales/es/users.json';
import warehousesEs from '../locales/es/warehouses.json';
import weatherEs from '../locales/es/weather.json';
import type { LanguageResourceBundle } from './types';

const esResources: LanguageResourceBundle = {
  translation: {
    ...animalFormEs,
    ...animalHousingEs,
    ...animalProfileEs,
    ...categoriesEs,
    ...commonEs,
    ...contactsEs,
    ...cropsEs,
    ...dashboardEs,
    ...equipmentEs,
    ...farmConfigurationEs,
    ...feedWaterEs,
    ...financeEs,
    ...logbookEs,
    ...marketingEs,
    orderList: orderListEs.orderList,
    products: productsEs.products,
    productCard: productsEs.productCard,
    productionCycles: productionCyclesEs,
    ...settingsEs,
    ...sidebarEs,
    ...stockAdjustmentEs,
    ...stockCountEs,
    ...storeDashboardEs,
    ...tasksEs,
    ...taxesEs,
    ...warehousesEs,
    ...weatherEs,
  },
  common: commonEs.common,
  contacts: contactsEs.contacts,
  dashboard: dashboardEs.dashboard,
  fields: fieldsEs.fields,
  irrigation: fieldsEs.fields.irrigation,
  lots: fieldsEs.fields.lots,
  map: fieldsEs.fields.map,
  settings: settingsEs.settings,
  sidebar: sidebarEs.sidebar,
  soil: fieldsEs.fields.soil,
  units: fieldsEs.fields.units,
  users: usersEs.users,
  validation: fieldsEs.fields.validation,
};

export default esResources;

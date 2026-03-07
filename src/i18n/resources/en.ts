import animalFormEn from '../locales/en/animalForm.json';
import animalHousingEn from '../locales/en/animalHousing.json';
import animalProfileEn from '../locales/en/animalProfile.json';
import categoriesEn from '../locales/en/categories.json';
import commonEn from '../locales/en/common.json';
import contactsEn from '../locales/en/contacts.json';
import cropsEn from '../locales/en/crops.json';
import dashboardEn from '../locales/en/dashboard.json';
import equipmentEn from '../locales/en/equipment.json';
import farmConfigurationEn from '../locales/en/farmConfiguration.json';
import feedWaterEn from '../locales/en/feedWater.json';
import fieldsEn from '../locales/en/fields.json';
import financeEn from '../locales/en/finance.json';
import logbookEn from '../locales/en/logbook.json';
import marketingEn from '../locales/en/marketing.json';
import orderListEn from '../locales/en/orderList.json';
import productsEn from '../locales/en/products.json';
import productionCyclesEn from '../locales/en/productionCycles.json';
import settingsEn from '../locales/en/settings.json';
import sidebarEn from '../locales/en/sidebar.json';
import stockAdjustmentEn from '../locales/en/stockAdjustment.json';
import stockCountEn from '../locales/en/stockCount.json';
import storeDashboardEn from '../locales/en/storeDashboard.json';
import tasksEn from '../locales/en/tasks.json';
import taxesEn from '../locales/en/taxes.json';
import usersEn from '../locales/en/users.json';
import warehousesEn from '../locales/en/warehouses.json';
import weatherEn from '../locales/en/weather.json';
import type { LanguageResourceBundle } from './types';

const enResources: LanguageResourceBundle = {
  translation: {
    ...animalFormEn,
    ...animalHousingEn,
    ...animalProfileEn,
    ...categoriesEn,
    ...commonEn,
    ...contactsEn,
    ...cropsEn,
    ...dashboardEn,
    ...equipmentEn,
    ...farmConfigurationEn,
    ...feedWaterEn,
    ...financeEn,
    ...logbookEn,
    ...marketingEn,
    orderList: orderListEn.orderList,
    products: productsEn.products,
    productCard: productsEn.productCard,
    productionCycles: productionCyclesEn,
    ...settingsEn,
    ...sidebarEn,
    ...stockAdjustmentEn,
    ...stockCountEn,
    ...storeDashboardEn,
    ...tasksEn,
    ...taxesEn,
    ...warehousesEn,
    ...weatherEn,
  },
  common: commonEn.common,
  contacts: contactsEn.contacts,
  dashboard: dashboardEn.dashboard,
  fields: fieldsEn.fields,
  irrigation: fieldsEn.fields.irrigation,
  lots: fieldsEn.fields.lots,
  map: fieldsEn.fields.map,
  settings: settingsEn.settings,
  sidebar: sidebarEn.sidebar,
  soil: fieldsEn.fields.soil,
  units: fieldsEn.fields.units,
  users: usersEn.users,
  validation: fieldsEn.fields.validation,
};

export default enResources;

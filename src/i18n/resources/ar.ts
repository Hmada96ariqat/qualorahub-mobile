import animalFormAr from '../locales/ar/animalForm.json';
import animalHousingAr from '../locales/ar/animalHousing.json';
import animalProfileAr from '../locales/ar/animalProfile.json';
import categoriesAr from '../locales/ar/categories.json';
import commonAr from '../locales/ar/common.json';
import contactsAr from '../locales/ar/contacts.json';
import cropsAr from '../locales/ar/crops.json';
import dashboardAr from '../locales/ar/dashboard.json';
import equipmentAr from '../locales/ar/equipment.json';
import farmConfigurationAr from '../locales/ar/farmConfiguration.json';
import feedWaterAr from '../locales/ar/feedWater.json';
import fieldsAr from '../locales/ar/fields.json';
import financeAr from '../locales/ar/finance.json';
import logbookAr from '../locales/ar/logbook.json';
import marketingAr from '../locales/ar/marketing.json';
import orderListAr from '../locales/ar/orderList.json';
import productsAr from '../locales/ar/products.json';
import productionCyclesAr from '../locales/ar/productionCycles.json';
import settingsAr from '../locales/ar/settings.json';
import sidebarAr from '../locales/ar/sidebar.json';
import stockAdjustmentAr from '../locales/ar/stockAdjustment.json';
import taxesAr from '../locales/ar/taxes.json';
import usersAr from '../locales/ar/users.json';
import warehousesAr from '../locales/ar/warehouses.json';
import weatherAr from '../locales/ar/weather.json';
import type { LanguageResourceBundle } from './types';

const arResources: LanguageResourceBundle = {
  translation: {
    ...animalFormAr,
    ...animalHousingAr,
    ...animalProfileAr,
    ...categoriesAr,
    ...commonAr,
    ...contactsAr,
    ...cropsAr,
    ...dashboardAr,
    ...equipmentAr,
    ...farmConfigurationAr,
    ...feedWaterAr,
    ...financeAr,
    ...logbookAr,
    ...marketingAr,
    orderList: orderListAr.orderList,
    products: productsAr.products,
    productCard: productsAr.productCard,
    productionCycles: productionCyclesAr,
    ...settingsAr,
    ...sidebarAr,
    ...stockAdjustmentAr,
    ...taxesAr,
    ...warehousesAr,
    ...weatherAr,
  },
  common: commonAr.common,
  contacts: contactsAr.contacts,
  dashboard: dashboardAr.dashboard,
  fields: fieldsAr.fields,
  irrigation: fieldsAr.fields.irrigation,
  lots: fieldsAr.fields.lots,
  map: fieldsAr.fields.map,
  settings: settingsAr.settings,
  sidebar: sidebarAr.sidebar,
  soil: fieldsAr.fields.soil,
  units: fieldsAr.fields.units,
  users: usersAr.users,
  validation: fieldsAr.fields.validation,
};

export default arResources;

import type {
  LanguageOption,
  LanguageResourceBundle,
  SupportedLanguage,
} from './resources/types';

export const LANGUAGE_OPTIONS: ReadonlyArray<LanguageOption> = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇸🇻', label: 'Español' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
] as const;

export const SYSTEM_RESOURCES: Record<SupportedLanguage, LanguageResourceBundle> = {
  en: {
    system: {
      drawer: {
        title: 'Navigate',
        signOut: 'Sign Out',
      },
      headers: {
        account: {
          title: 'Account',
          subtitle: 'Profile context, subscription, and access state.',
        },
        contacts: {
          title: 'Contacts',
          subtitle: 'Farm directory for suppliers, customers, and operational partners.',
        },
        crops: {
          title: 'Crops, Cycles, and Logbook',
          subtitle:
            'Crop planning, production cycles, and validated logbook activity in the dense shell.',
        },
        dashboard: {
          signedInAs: 'Signed in as {{email}}',
        },
        inventory: {
          title: 'Inventory',
        },
        inventoryLegacy: {
          title: 'Inventory Core',
          subtitle:
            'Manage products, categories, taxes, and warehouses with reusable module patterns.',
        },
        livestock: {
          title: 'Livestock, Housing, and Weather',
          subtitle: 'Dense module shell for animals, housing lifecycle, and weather alert rules.',
        },
        management: {
          title: 'Management',
          subtitle: 'Users, roles, invites, and access administration.',
        },
        notifications: {
          title: 'Notifications',
          subtitle: 'In-app notification center.',
        },
        orders: {
          title: 'Orders & Sales',
        },
      },
      language: {
        changeFailed:
          'Language preference could not be updated. Please try again.',
        directionChangeHint:
          'The app reloads automatically when the layout direction changes.',
        reloadFailed:
          'Language updated, but the app could not reload. Restart the app to finish applying the new direction.',
        title: 'Display language',
      },
      navigation: {
        groups: {
          administration: 'Administration',
          commerce: 'Commerce',
          operations: 'Operations',
          overview: 'Overview',
        },
        items: {
          account: 'Account',
          crops: 'Crops',
          inventory: 'Inventory',
          management: 'Management',
        },
      },
    },
  },
  es: {
    system: {
      drawer: {
        title: 'Navegar',
        signOut: 'Cerrar sesi\u00f3n',
      },
      headers: {
        account: {
          title: 'Cuenta',
          subtitle: 'Contexto del perfil, suscripci\u00f3n y estado de acceso.',
        },
        contacts: {
          title: 'Contactos',
          subtitle: 'Directorio de proveedores, clientes y socios operativos de la finca.',
        },
        crops: {
          title: 'Cultivos, ciclos y bit\u00e1cora',
          subtitle:
            'Planificaci\u00f3n de cultivos, ciclos de producci\u00f3n y actividad validada de bit\u00e1cora en la interfaz densa.',
        },
        dashboard: {
          signedInAs: 'Sesión iniciada como {{email}}',
        },
        inventory: {
          title: 'Inventario',
        },
        inventoryLegacy: {
          title: 'Núcleo de inventario',
          subtitle:
            'Gestiona productos, categorías, impuestos y almacenes con patrones reutilizables del módulo.',
        },
        livestock: {
          title: 'Ganado, establos y clima',
          subtitle:
            'Interfaz densa del módulo para animales, ciclo de vida de establos y reglas de alertas meteorológicas.',
        },
        management: {
          title: 'Administración',
          subtitle: 'Usuarios, roles, invitaciones y administración de accesos.',
        },
        notifications: {
          title: 'Notificaciones',
          subtitle: 'Centro de notificaciones dentro de la app.',
        },
        orders: {
          title: 'Pedidos y ventas',
        },
      },
      language: {
        changeFailed:
          'No se pudo actualizar la preferencia de idioma. Inténtalo de nuevo.',
        directionChangeHint:
          'La aplicación se recarga automáticamente cuando cambia la dirección del diseño.',
        reloadFailed:
          'El idioma se actualizó, pero la aplicación no pudo recargarse. Reiníciala para terminar de aplicar la nueva dirección.',
        title: 'Idioma de visualización',
      },
      navigation: {
        groups: {
          administration: 'Administración',
          commerce: 'Comercio',
          operations: 'Operaciones',
          overview: 'Resumen',
        },
        items: {
          account: 'Cuenta',
          crops: 'Cultivos',
          inventory: 'Inventario',
          management: 'Administración',
        },
      },
    },
  },
  ar: {
    system: {
      drawer: {
        title: 'التنقل',
        signOut: 'تسجيل الخروج',
      },
      headers: {
        account: {
          title: 'الحساب',
          subtitle: 'سياق الملف الشخصي والاشتراك وحالة الوصول.',
        },
        contacts: {
          title: 'جهات الاتصال',
          subtitle: 'دليل المزرعة للموردين والعملاء والشركاء التشغيليين.',
        },
        crops: {
          title: 'المحاصيل والدورات والسجل',
          subtitle: 'تخطيط المحاصيل ودورات الإنتاج ونشاط السجل المعتمد ضمن الواجهة الكثيفة.',
        },
        dashboard: {
          signedInAs: 'تم تسجيل الدخول باسم {{email}}',
        },
        inventory: {
          title: 'المخزون',
        },
        inventoryLegacy: {
          title: 'نواة المخزون',
          subtitle: 'إدارة المنتجات والفئات والضرائب والمستودعات بأنماط وحدة قابلة لإعادة الاستخدام.',
        },
        livestock: {
          title: 'الثروة الحيوانية والإيواء والطقس',
          subtitle: 'واجهة كثيفة للوحدة لإدارة الحيوانات ودورة حياة الإيواء وقواعد تنبيهات الطقس.',
        },
        management: {
          title: 'الإدارة',
          subtitle: 'المستخدمون والأدوار والدعوات وإدارة الوصول.',
        },
        notifications: {
          title: 'الإشعارات',
          subtitle: 'مركز الإشعارات داخل التطبيق.',
        },
        orders: {
          title: 'الطلبات والمبيعات',
        },
      },
      language: {
        changeFailed: 'تعذر تحديث تفضيل اللغة. حاول مرة أخرى.',
        directionChangeHint:
          'يعاد تحميل التطبيق تلقائيًا عند تغيّر اتجاه التخطيط.',
        reloadFailed:
          'تم تحديث اللغة، لكن تعذر إعادة تحميل التطبيق. أعد تشغيله لإكمال تطبيق الاتجاه الجديد.',
        title: 'لغة العرض',
      },
      navigation: {
        groups: {
          administration: 'الإدارة',
          commerce: 'التجارة',
          operations: 'العمليات',
          overview: 'نظرة عامة',
        },
        items: {
          account: 'الحساب',
          crops: 'المحاصيل',
          inventory: 'المخزون',
          management: 'الإدارة',
        },
      },
    },
  },
};

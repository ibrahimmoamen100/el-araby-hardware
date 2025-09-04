// Store Constants - جميع ثوابت المشروع
export const STORE_CONFIG = {
  // معلومات المتجر الأساسية
  name: "Zaky",
  displayName: "متجر ستوري",
  description: "متجر إلكتروني متخصص في بيع الأجهزة الإلكترونية وملحقاتها",
  tagline: "أفضل الأسعار وأعلى جودة",
  
  // الشعارات
  logo: {
    primary: "/logo1.png",
    secondary: "/logo2.png",
    favicon: "/logo1.png",
    text: "Storee", // نص اللوجو الذي يظهر في Navbar
  },
  
  // معلومات الاتصال
  contact: {
    phone: "01024911062",
    formattedPhone: "201024911062",
    whatsapp: "201024911062",
    email: "ibrahim.moamen100@gmail.com",
    address: " مؤسسه الزكاه امام مستشفي اليوم الواحد ",
    city: "القاهرة",
    country: "مصر",
  },
  
  // ساعات العمل
  workingHours: {
    weekdays: "9:00 صباحاً - 10:00 مساءً",
    weekends: "10:00 صباحاً - 11:00 مساءً",
    friday: "2:00 مساءً - 11:00 مساءً",
    holidays: "مغلق",
  },
  
  // روابط التواصل الاجتماعي
  socialMedia: {
    facebook: "https://facebook.com/storee",
    instagram: "https://instagram.com/storee",
    twitter: "https://twitter.com/storee",
    youtube: "https://youtube.com/storee",
    tiktok: "https://tiktok.com/@storee",
  },
  
  // معلومات صاحب المتجر
  owner: {
    name: "محمود ذكي ",
    image: "/zaky.png",
    phone: "01024911062",
    whatsapp: "201024911062",
    email: "ibrahim.moamen100@gmail.com",
    title: "صاحب المتجر",
    bio: "  مهندس معماري و تاجر في مجال الأجهزة الإلكترونية",
    experience: "خبرة أكثر من 10 سنوات في مجال التكنولوجيا",
  },
  
  // معلومات الموظفين
  team: {
    salesManager: {
      name: "Ibrahim",
      image: "/ibrahim.png",
      phone: "01024911062",
      title: "مدير المبيعات",
      bio: "مسؤول عن إدارة المبيعات وتطوير استراتيجيات التسويق",
    },
    deliveryManager: {
      name: "Ahmed",
      image: "/def.png",
      phone: "01024911062",
      title: "مسؤول التوصيل",
      bio: "مسؤول عن توصيل الطلبات وضمان وصولها في الوقت المحدد",
    },
  },
  
  // مواقع الفروع
  locations: [
    {
      id: "main",
        name: "  محمود ذكي",
        address: "شارع مؤسسه الزكاه خلف مستشفي اليوم الواحد ",
      phone: "01024911062",
      hours: "9:00 صباحاً - 10:00 مساءً",
      coordinates: { lat: 30.0444, lng: 31.2357 },
      googleMapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d673.3348366421665!2d31.238969331941714!3d30.045635496740715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145840c775c807a7%3A0x4e6b07f8bc12ffe6!2z2YXYsdmD2LIg2KfZhNio2LPYqtin2YYg2YTZhNij2KzZh9iy2Kkg2KfZhNil2YTZg9iq2LHZiNmG2YrYqQ!5e1!3m2!1sar!2seg!4v1748959826497!5m2!1sar!2seg",
      isMain: true,
    },

  ],
  
  // ألوان المشروع
  colors: {
    primary: "#3B82F6", // blue-500
    secondary: "#10B981", // emerald-500
    accent: "#F59E0B", // amber-500
    success: "#10B981", // emerald-500
    warning: "#F59E0B", // amber-500
    error: "#EF4444", // red-500
    info: "#3B82F6", // blue-500
  },
  
  // معلومات Carousel الصفحة الرئيسية
  heroCarousel: [
    {
      id: "slide1",
      image: "/bg1.png",
      title: "أفضل الأجهزة الإلكترونية",
      description: "اكتشف تشكيلة واسعة من الأجهزة الإلكترونية بأفضل الأسعار",
      buttonText: "تسوق الآن",
      buttonLink: "/products",
      overlay: "from-black/70 to-transparent",
    },
    {
      id: "slide2", 
      image: "/bg2.png",
      title: "عروض خاصة محدودة",
      description: "احصل على خصومات تصل إلى 50% على منتجات مختارة",
      buttonText: "تسوق الآن",
      buttonLink: "/products",
      overlay: "from-black/70 to-transparent",
    },
    {
      id: "slide3",
      image: "/bg1.png", 
      title: "توصيل سريع ومجاني",
      description: "نوصل طلبك خلال 24 ساعة مع ضمان الجودة",
      buttonText: "تسوق الآن",
      buttonLink: "/products",
      overlay: "from-black/70 to-transparent",
    },
  ],
  
  // معلومات العلامات التجارية
  brands: [
    {
      id: "brand1",
      name: "Apple",
      logo: "/brands/apple.png",
      description: "أجهزة Apple الأصلية",
    },
    {
      id: "brand2", 
      name: "Samsung",
      logo: "/brands/samsung.png",
      description: "أجهزة Samsung عالية الجودة",
    },
    {
      id: "brand3",
      name: "Huawei", 
      logo: "/brands/huawei.png",
      description: "أجهزة Huawei المميزة",
    },
    {
      id: "brand4",
      name: "Xiaomi",
      logo: "/brands/xiaomi.png", 
      description: "أجهزة Xiaomi بأسعار منافسة",
    },
  ],
  
  // معلومات الموردين
  suppliers: [

  ],
  
  // معلومات التوصيل
  delivery: {
    freeShippingThreshold: 1000, // EGP
    deliveryTime: "24-48 ساعة",
    deliveryAreas: ["القاهرة", "الجيزة", "الإسكندرية"],
    deliveryFee: "تحدد حسب المنطقة",
    returnPolicy: "إمكانية الإرجاع خلال 14 يوم",
  },
  
  // معلومات الدفع
  payment: {
    methods: ["الدفع عند الاستلام", "بطاقات الائتمان", "التحويل البنكي"],
    securePayment: true,
    installmentAvailable: true,
    maxInstallments: 12,
  },
  
  // معلومات الضمان
  warranty: {
    defaultWarranty: "ضمان سنة واحدة",
    extendedWarranty: "إمكانية تمديد الضمان",
    warrantyCoverage: "جميع الأجزاء والعمالة",
  },
  
  // معلومات SEO
  seo: {
    title: "Storee - متجر الأجهزة الإلكترونية",
    description: "متجر إلكتروني متخصص في بيع الأجهزة الإلكترونية وملحقاتها بأفضل الأسعار وأعلى جودة",
    keywords: "أجهزة إلكترونية, موبايلات, لابتوب, تابلت, ملحقات, مصر",
    author: "Storee Team",
    ogImage: "/og-image.png",
  },
  
  // معلومات التطبيق
  app: {
    version: "1.0.0",
    buildNumber: "1",
    minSupportedVersion: "1.0.0",
    updateUrl: "https://storee.com/update",
  },
  
  // معلومات API
  api: {
    baseUrl: "https://api.storee.com",
    version: "v1",
    timeout: 30000, // 30 seconds
  },
  
  // معلومات Firebase
  firebase: {
    projectId: "storee-app",
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: "storee-app.firebaseapp.com",
    storageBucket: "storee-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
  },
  
  // معلومات التطوير
  development: {
    environment: import.meta.env.MODE || "development",
    debug: import.meta.env.MODE === "development",
    logLevel: import.meta.env.MODE === "development" ? "debug" : "error",
  },
} as const;

// تصدير الثوابت الفردية للاستخدام المباشر
export const STORE_NAME = STORE_CONFIG.name;
export const STORE_DISPLAY_NAME = STORE_CONFIG.displayName;
export const STORE_LOGO = STORE_CONFIG.logo.primary;
export const STORE_LOGO_TEXT = STORE_CONFIG.logo.text;
export const STORE_PHONE = STORE_CONFIG.contact.phone;
export const STORE_WHATSAPP = STORE_CONFIG.contact.whatsapp;
export const STORE_EMAIL = STORE_CONFIG.contact.email;
export const STORE_ADDRESS = STORE_CONFIG.contact.address;
export const STORE_WORKING_HOURS = STORE_CONFIG.workingHours.weekdays;
export const STORE_OWNER = STORE_CONFIG.owner;
export const STORE_LOCATIONS = STORE_CONFIG.locations;
export const STORE_COLORS = STORE_CONFIG.colors;
export const STORE_HERO_CAROUSEL = STORE_CONFIG.heroCarousel;
export const STORE_BRANDS = STORE_CONFIG.brands;
export const STORE_SUPPLIERS = STORE_CONFIG.suppliers;
export const STORE_SOCIAL_MEDIA = STORE_CONFIG.socialMedia;
export const STORE_TEAM = STORE_CONFIG.team; 
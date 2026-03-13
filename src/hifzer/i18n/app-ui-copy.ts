import type { UiLanguage } from "@/hifzer/i18n/ui-language";

export type AppUiCopy = {
  skipToMain: string;
  language: string;
  brandTagline: string;
  sectionInsights: string;
  sectionProduct: string;
  nav: {
    home: string;
    today: string;
    hifz: string;
    quran: string;
    dua: string;
    progress: string;
    streak: string;
    glossary: string;
    roadmap: string;
    support: string;
    settings: string;
  };
  marketing: {
    compare: string;
    openApp: string;
    signIn: string;
    getStarted: string;
    motivation: string;
    toggleMenu: string;
  };
  betaBanner: {
    warning: string;
    soft: string;
    ariaLabel: string;
  };
  settingsPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  languageSettings: {
    eyebrow: string;
    title: string;
    subtitle: string;
    interfaceLanguageTitle: string;
    interfaceLanguageSubtitle: string;
    interfaceLanguageLabel: string;
    applyInterfaceLanguage: string;
    interfaceLanguageUpdated: string;
    defaultTranslationTitle: string;
    defaultTranslationSubtitle: string;
    defaultTranslationLabel: string;
    rtlScript: string;
    ltrScript: string;
    unknownLanguage: string;
    saveLanguage: string;
    savedTitle: string;
    saveFailedTitle: string;
    languagePreferenceUpdated: string;
    failedToSaveLanguage: string;
    signInToPersist: string;
    persistenceUnavailable: string;
    saveIssue: string;
  };
};

const APP_UI_COPY: Record<UiLanguage, AppUiCopy> = {
  "en.sahih": {
    skipToMain: "Skip to main content",
    language: "Language",
    brandTagline: "Your daily Qur'an companion",
    sectionInsights: "Insights",
    sectionProduct: "Product",
    nav: {
      home: "Home",
      today: "Today",
      hifz: "Hifz",
      quran: "Qur'an",
      dua: "Dua",
      progress: "Progress",
      streak: "Streak",
      glossary: "Glossary",
      roadmap: "Roadmap",
      support: "Support",
      settings: "Settings",
    },
    marketing: {
      compare: "Compare",
      openApp: "Continue in app",
      signIn: "Sign in",
      getStarted: "Get started",
      motivation: "Motivation",
      toggleMenu: "Toggle menu",
    },
    betaBanner: {
      warning: "PUBLIC BETA LIVE NOW - Expect bugs, slowdowns, or occasional crashes - Thanks for your patience",
      soft: "Public beta active - core flows are stable and improving weekly.",
      ariaLabel: "Public beta notice",
    },
    settingsPage: {
      eyebrow: "Preferences",
      title: "Settings",
      subtitle: "Personalize Hifzer and tune your practice plan.",
    },
    languageSettings: {
      eyebrow: "Settings",
      title: "Language",
      subtitle: "Choose your interface and Qur'an translation language.",
      interfaceLanguageTitle: "App interface language",
      interfaceLanguageSubtitle: "Applies across navigation and app shell labels for this browser.",
      interfaceLanguageLabel: "Interface language",
      applyInterfaceLanguage: "Apply interface language",
      interfaceLanguageUpdated: "Interface language updated.",
      defaultTranslationTitle: "Default translation",
      defaultTranslationSubtitle: "This preference is saved to your account and follows you across devices.",
      defaultTranslationLabel: "Qur'an translation language",
      rtlScript: "RTL script",
      ltrScript: "LTR script",
      unknownLanguage: "Unknown language",
      saveLanguage: "Save translation language",
      savedTitle: "Saved",
      saveFailedTitle: "Save failed",
      languagePreferenceUpdated: "Language preference updated.",
      failedToSaveLanguage: "Failed to save language settings.",
      signInToPersist: "Sign in with Clerk to persist this setting per user.",
      persistenceUnavailable: "Persistence unavailable",
      saveIssue: "Save issue",
    },
  },
  "ur.junagarhi": {
    skipToMain: "مرکزی مواد پر جائیں",
    language: "زبان",
    brandTagline: "حفظ آپریٹنگ سسٹم",
    sectionInsights: "بصیرتیں",
    sectionProduct: "پروڈکٹ",
    nav: {
      home: "ہوم",
      today: "آج",
      hifz: "حفظ",
      quran: "قرآن",
      dua: "دعا",
      progress: "پیش رفت",
      streak: "تسلسل",
      glossary: "لغت",
      roadmap: "روڈ میپ",
      support: "مدد",
      settings: "ترتیبات",
    },
    marketing: {
      compare: "موازنہ",
      openApp: "ایپ کھولیں",
      signIn: "سائن اِن",
      getStarted: "شروع کریں",
      motivation: "ترغیب",
      toggleMenu: "مینو ٹوگل کریں",
    },
    betaBanner: {
      warning: "پبلک بیٹا جاری ہے - بگز، سست روی یا کبھی کبھار کریش ممکن ہیں - صبر کا شکریہ",
      soft: "پبلک بیٹا فعال ہے - بنیادی فلو مستحکم ہیں اور ہر ہفتے بہتر ہو رہے ہیں۔",
      ariaLabel: "پبلک بیٹا اطلاع",
    },
    settingsPage: {
      eyebrow: "ترجیحات",
      title: "ترتیبات",
      subtitle: "Hifzer کو ذاتی بنائیں اور اپنی مشق کا منصوبہ بہتر کریں۔",
    },
    languageSettings: {
      eyebrow: "ترتیبات",
      title: "زبان",
      subtitle: "اپنی انٹرفیس اور قرآن ترجمہ زبان منتخب کریں۔",
      interfaceLanguageTitle: "ایپ انٹرفیس زبان",
      interfaceLanguageSubtitle: "یہ اس براؤزر میں نیویگیشن اور ایپ شیل لیبلز پر لاگو ہوتی ہے۔",
      interfaceLanguageLabel: "انٹرفیس زبان",
      applyInterfaceLanguage: "انٹرفیس زبان لاگو کریں",
      interfaceLanguageUpdated: "انٹرفیس زبان اپڈیٹ ہو گئی۔",
      defaultTranslationTitle: "ڈیفالٹ ترجمہ",
      defaultTranslationSubtitle: "یہ ترجیح آپ کے اکاؤنٹ میں محفوظ ہوتی ہے اور ہر ڈیوائس پر لاگو ہوتی ہے۔",
      defaultTranslationLabel: "قرآن ترجمہ زبان",
      rtlScript: "RTL رسم الخط",
      ltrScript: "LTR رسم الخط",
      unknownLanguage: "نامعلوم زبان",
      saveLanguage: "ترجمہ زبان محفوظ کریں",
      savedTitle: "محفوظ",
      saveFailedTitle: "محفوظ نہیں ہوا",
      languagePreferenceUpdated: "زبان کی ترجیح اپڈیٹ ہو گئی۔",
      failedToSaveLanguage: "زبان کی ترتیبات محفوظ نہ ہو سکیں۔",
      signInToPersist: "اس سیٹنگ کو محفوظ کرنے کے لیے Clerk سے سائن اِن کریں۔",
      persistenceUnavailable: "پرسسٹنس دستیاب نہیں",
      saveIssue: "محفوظ کرنے کا مسئلہ",
    },
  },
  "id.indonesian": {
    skipToMain: "Lewati ke konten utama",
    language: "Bahasa",
    brandTagline: "Sistem operasi hifz",
    sectionInsights: "Wawasan",
    sectionProduct: "Produk",
    nav: {
      home: "Beranda",
      today: "Hari ini",
      hifz: "Hifz",
      quran: "Qur'an",
      dua: "Doa",
      progress: "Progres",
      streak: "Streak",
      glossary: "Glosarium",
      roadmap: "Roadmap",
      support: "Dukungan",
      settings: "Pengaturan",
    },
    marketing: {
      compare: "Bandingkan",
      openApp: "Buka aplikasi",
      signIn: "Masuk",
      getStarted: "Mulai",
      motivation: "Motivasi",
      toggleMenu: "Ubah menu",
    },
    betaBanner: {
      warning: "BETA PUBLIK AKTIF - Mungkin ada bug, lambat, atau crash sesekali - Terima kasih atas kesabaran Anda",
      soft: "Beta publik aktif - alur inti stabil dan terus membaik setiap minggu.",
      ariaLabel: "Pemberitahuan beta publik",
    },
    settingsPage: {
      eyebrow: "Preferensi",
      title: "Pengaturan",
      subtitle: "Personalisasi Hifzer dan sesuaikan rencana latihan Anda.",
    },
    languageSettings: {
      eyebrow: "Pengaturan",
      title: "Bahasa",
      subtitle: "Pilih bahasa antarmuka dan terjemahan Qur'an.",
      interfaceLanguageTitle: "Bahasa antarmuka aplikasi",
      interfaceLanguageSubtitle: "Berlaku untuk navigasi dan label app shell di browser ini.",
      interfaceLanguageLabel: "Bahasa antarmuka",
      applyInterfaceLanguage: "Terapkan bahasa antarmuka",
      interfaceLanguageUpdated: "Bahasa antarmuka diperbarui.",
      defaultTranslationTitle: "Terjemahan bawaan",
      defaultTranslationSubtitle: "Preferensi ini disimpan ke akun Anda dan berlaku di semua perangkat.",
      defaultTranslationLabel: "Bahasa terjemahan Qur'an",
      rtlScript: "Skrip RTL",
      ltrScript: "Skrip LTR",
      unknownLanguage: "Bahasa tidak dikenal",
      saveLanguage: "Simpan bahasa terjemahan",
      savedTitle: "Tersimpan",
      saveFailedTitle: "Gagal menyimpan",
      languagePreferenceUpdated: "Preferensi bahasa diperbarui.",
      failedToSaveLanguage: "Gagal menyimpan pengaturan bahasa.",
      signInToPersist: "Masuk dengan Clerk untuk menyimpan pengaturan ini per pengguna.",
      persistenceUnavailable: "Persistensi tidak tersedia",
      saveIssue: "Masalah penyimpanan",
    },
  },
  "tr.yildirim": {
    skipToMain: "Ana içeriğe geç",
    language: "Dil",
    brandTagline: "Hıfz işletim sistemi",
    sectionInsights: "İçgörüler",
    sectionProduct: "Ürün",
    nav: {
      home: "Ana sayfa",
      today: "Bugün",
      hifz: "Hıfz",
      quran: "Kur'an",
      dua: "Dua",
      progress: "İlerleme",
      streak: "Seri",
      glossary: "Sözlük",
      roadmap: "Yol haritası",
      support: "Destek",
      settings: "Ayarlar",
    },
    marketing: {
      compare: "Karşılaştır",
      openApp: "Uygulamayı aç",
      signIn: "Giriş yap",
      getStarted: "Başla",
      motivation: "Motivasyon",
      toggleMenu: "Menüyü aç/kapat",
    },
    betaBanner: {
      warning: "GENEL BETA CANLI - Hata, yavaşlık veya ara sıra çökme olabilir - Sabır için teşekkürler",
      soft: "Genel beta aktif - temel akışlar stabil ve her hafta gelişiyor.",
      ariaLabel: "Genel beta bildirimi",
    },
    settingsPage: {
      eyebrow: "Tercihler",
      title: "Ayarlar",
      subtitle: "Hifzer'i kişiselleştirin ve çalışma planınızı ayarlayın.",
    },
    languageSettings: {
      eyebrow: "Ayarlar",
      title: "Dil",
      subtitle: "Arayüz ve Kur'an çeviri dilinizi seçin.",
      interfaceLanguageTitle: "Uygulama arayüz dili",
      interfaceLanguageSubtitle: "Bu tarayıcıdaki gezinme ve app shell etiketlerine uygulanır.",
      interfaceLanguageLabel: "Arayüz dili",
      applyInterfaceLanguage: "Arayüz dilini uygula",
      interfaceLanguageUpdated: "Arayüz dili güncellendi.",
      defaultTranslationTitle: "Varsayılan çeviri",
      defaultTranslationSubtitle: "Bu tercih hesabınıza kaydedilir ve tüm cihazlarda geçerlidir.",
      defaultTranslationLabel: "Kur'an çeviri dili",
      rtlScript: "RTL yazı",
      ltrScript: "LTR yazı",
      unknownLanguage: "Bilinmeyen dil",
      saveLanguage: "Çeviri dilini kaydet",
      savedTitle: "Kaydedildi",
      saveFailedTitle: "Kaydetme başarısız",
      languagePreferenceUpdated: "Dil tercihi güncellendi.",
      failedToSaveLanguage: "Dil ayarları kaydedilemedi.",
      signInToPersist: "Bu ayarı kullanıcı bazında saklamak için Clerk ile giriş yapın.",
      persistenceUnavailable: "Kalıcılık kullanılamıyor",
      saveIssue: "Kaydetme sorunu",
    },
  },
  "fa.fooladvand": {
    skipToMain: "رفتن به محتوای اصلی",
    language: "زبان",
    brandTagline: "سیستم‌عامل حفظ",
    sectionInsights: "بینش‌ها",
    sectionProduct: "محصول",
    nav: {
      home: "خانه",
      today: "امروز",
      hifz: "حفظ",
      quran: "قرآن",
      dua: "دعا",
      progress: "پیشرفت",
      streak: "تداوم",
      glossary: "واژه‌نامه",
      roadmap: "نقشه راه",
      support: "پشتیبانی",
      settings: "تنظیمات",
    },
    marketing: {
      compare: "مقایسه",
      openApp: "باز کردن برنامه",
      signIn: "ورود",
      getStarted: "شروع کنید",
      motivation: "انگیزه",
      toggleMenu: "تغییر وضعیت منو",
    },
    betaBanner: {
      warning: "بتای عمومی فعال است - احتمال خطا، کندی یا کرش وجود دارد - از شکیبایی شما سپاسگزاریم",
      soft: "بتای عمومی فعال است - جریان‌های اصلی پایدارند و هر هفته بهتر می‌شوند.",
      ariaLabel: "اعلان بتای عمومی",
    },
    settingsPage: {
      eyebrow: "ترجیحات",
      title: "تنظیمات",
      subtitle: "Hifzer را شخصی‌سازی کنید و برنامه تمرین خود را تنظیم کنید.",
    },
    languageSettings: {
      eyebrow: "تنظیمات",
      title: "زبان",
      subtitle: "زبان رابط و ترجمه قرآن را انتخاب کنید.",
      interfaceLanguageTitle: "زبان رابط برنامه",
      interfaceLanguageSubtitle: "برای ناوبری و برچسب‌های پوسته برنامه در این مرورگر اعمال می‌شود.",
      interfaceLanguageLabel: "زبان رابط",
      applyInterfaceLanguage: "اعمال زبان رابط",
      interfaceLanguageUpdated: "زبان رابط به‌روزرسانی شد.",
      defaultTranslationTitle: "ترجمه پیش‌فرض",
      defaultTranslationSubtitle: "این ترجیح در حساب شما ذخیره می‌شود و در همه دستگاه‌ها اعمال می‌گردد.",
      defaultTranslationLabel: "زبان ترجمه قرآن",
      rtlScript: "خط راست‌به‌چپ",
      ltrScript: "خط چپ‌به‌راست",
      unknownLanguage: "زبان ناشناخته",
      saveLanguage: "ذخیره زبان ترجمه",
      savedTitle: "ذخیره شد",
      saveFailedTitle: "ذخیره ناموفق",
      languagePreferenceUpdated: "ترجیح زبان به‌روزرسانی شد.",
      failedToSaveLanguage: "ذخیره تنظیمات زبان انجام نشد.",
      signInToPersist: "برای ذخیره این تنظیم به ازای هر کاربر با Clerk وارد شوید.",
      persistenceUnavailable: "ذخیره‌سازی در دسترس نیست",
      saveIssue: "مشکل ذخیره",
    },
  },
  "bn.bengali": {
    skipToMain: "মূল কনটেন্টে যান",
    language: "ভাষা",
    brandTagline: "হিফজ অপারেটিং সিস্টেম",
    sectionInsights: "ইনসাইটস",
    sectionProduct: "প্রোডাক্ট",
    nav: {
      home: "হোম",
      today: "আজ",
      hifz: "হিফজ",
      quran: "কুরআন",
      dua: "দু'আ",
      progress: "অগ্রগতি",
      streak: "স্ট্রিক",
      glossary: "গ্লসারি",
      roadmap: "রোডম্যাপ",
      support: "সাপোর্ট",
      settings: "সেটিংস",
    },
    marketing: {
      compare: "তুলনা",
      openApp: "অ্যাপ খুলুন",
      signIn: "সাইন ইন",
      getStarted: "শুরু করুন",
      motivation: "প্রেরণা",
      toggleMenu: "মেনু টগল করুন",
    },
    betaBanner: {
      warning: "পাবলিক বেটা চালু - বাগ, ধীরগতি বা মাঝে মাঝে ক্র্যাশ হতে পারে - ধৈর্যের জন্য ধন্যবাদ",
      soft: "পাবলিক বেটা সক্রিয় - মূল ফ্লো স্থিতিশীল এবং প্রতি সপ্তাহে উন্নত হচ্ছে।",
      ariaLabel: "পাবলিক বেটা নোটিশ",
    },
    settingsPage: {
      eyebrow: "পছন্দসমূহ",
      title: "সেটিংস",
      subtitle: "Hifzer ব্যক্তিগতকরণ করুন এবং আপনার অনুশীলন পরিকল্পনা ঠিক করুন।",
    },
    languageSettings: {
      eyebrow: "সেটিংস",
      title: "ভাষা",
      subtitle: "ইন্টারফেস ও কুরআন অনুবাদের ভাষা বেছে নিন।",
      interfaceLanguageTitle: "অ্যাপ ইন্টারফেস ভাষা",
      interfaceLanguageSubtitle: "এই ব্রাউজারে নেভিগেশন ও অ্যাপ শেল লেবেলে প্রযোজ্য।",
      interfaceLanguageLabel: "ইন্টারফেস ভাষা",
      applyInterfaceLanguage: "ইন্টারফেস ভাষা প্রয়োগ করুন",
      interfaceLanguageUpdated: "ইন্টারফেস ভাষা আপডেট হয়েছে।",
      defaultTranslationTitle: "ডিফল্ট অনুবাদ",
      defaultTranslationSubtitle: "এই পছন্দ আপনার অ্যাকাউন্টে সেভ হয় এবং সব ডিভাইসে প্রযোজ্য।",
      defaultTranslationLabel: "কুরআন অনুবাদের ভাষা",
      rtlScript: "RTL স্ক্রিপ্ট",
      ltrScript: "LTR স্ক্রিপ্ট",
      unknownLanguage: "অজানা ভাষা",
      saveLanguage: "অনুবাদের ভাষা সেভ করুন",
      savedTitle: "সেভ হয়েছে",
      saveFailedTitle: "সেভ ব্যর্থ",
      languagePreferenceUpdated: "ভাষা পছন্দ আপডেট হয়েছে।",
      failedToSaveLanguage: "ভাষা সেটিংস সেভ করা যায়নি।",
      signInToPersist: "প্রতি ব্যবহারকারী হিসেবে এই সেটিং সেভ করতে Clerk দিয়ে সাইন ইন করুন।",
      persistenceUnavailable: "পারসিস্টেন্স উপলব্ধ নয়",
      saveIssue: "সেভ সমস্যা",
    },
  },
  "ml.abdulhameed": {
    skipToMain: "പ്രധാന ഉള്ളടക്കത്തിലേക്ക് പോകുക",
    language: "ഭാഷ",
    brandTagline: "ഹിഫ്‌സ് ഓപ്പറേറ്റിംഗ് സിസ്റ്റം",
    sectionInsights: "ഇൻസൈറ്റ്സ്",
    sectionProduct: "ഉൽപ്പന്നം",
    nav: {
      home: "ഹോം",
      today: "ഇന്ന്",
      hifz: "ഹിഫ്‌സ്",
      quran: "ഖുർആൻ",
      dua: "ദുആ",
      progress: "പുരോഗതി",
      streak: "സ്റ്റ്രീക്ക്",
      glossary: "ഗ്ലോസറി",
      roadmap: "റോഡ്‌മാപ്",
      support: "സഹായം",
      settings: "സെറ്റിംഗ്സ്",
    },
    marketing: {
      compare: "താരതമ്യം",
      openApp: "ആപ്പ് തുറക്കുക",
      signIn: "സൈൻ ഇൻ",
      getStarted: "തുടങ്ങുക",
      motivation: "പ്രചോദനം",
      toggleMenu: "മെനു ടോഗിൾ ചെയ്യുക",
    },
    betaBanner: {
      warning: "പബ്ലിക് ബീറ്റ ലൈവാണ് - ബഗ്, മന്ദഗതി, ഇടയ്ക്കിടെ ക്രാഷ് എന്നിവ ഉണ്ടായേക്കാം - നിങ്ങളുടെ സഹനത്തിന് നന്ദി",
      soft: "പബ്ലിക് ബീറ്റ സജീവമാണ് - പ്രധാന പ്രവാഹങ്ങൾ സ്ഥിരതയുള്ളതും ആഴ്ചതോറും മെച്ചപ്പെടുന്നതുമാണ്.",
      ariaLabel: "പബ്ലിക് ബീറ്റ അറിയിപ്പ്",
    },
    settingsPage: {
      eyebrow: "പ്രാഥമികതകൾ",
      title: "സെറ്റിംഗ്സ്",
      subtitle: "Hifzer വ്യക്തിഗതമാക്കി നിങ്ങളുടെ പരിശീലന പദ്ധതി ക്രമീകരിക്കുക.",
    },
    languageSettings: {
      eyebrow: "സെറ്റിംഗ്സ്",
      title: "ഭാഷ",
      subtitle: "ഇന്റർഫേസ് ഭാഷയും ഖുർആൻ വിവർത്തന ഭാഷയും തിരഞ്ഞെടുക്കുക.",
      interfaceLanguageTitle: "ആപ്പ് ഇന്റർഫേസ് ഭാഷ",
      interfaceLanguageSubtitle: "ഈ ബ്രൗസറിൽ നാവിഗേഷൻ, ആപ്പ് ഷെൽ ലേബലുകൾ എന്നിവയ്ക്ക് ബാധകം.",
      interfaceLanguageLabel: "ഇന്റർഫേസ് ഭാഷ",
      applyInterfaceLanguage: "ഇന്റർഫേസ് ഭാഷ പ്രയോഗിക്കുക",
      interfaceLanguageUpdated: "ഇന്റർഫേസ് ഭാഷ അപ്‌ഡേറ്റ് ചെയ്തു.",
      defaultTranslationTitle: "ഡിഫോൾട്ട് വിവർത്തനം",
      defaultTranslationSubtitle: "ഈ മുൻഗണന നിങ്ങളുടെ അക്കൗണ്ടിൽ സൂക്ഷിക്കപ്പെടുകയും എല്ലാ ഉപകരണങ്ങളിലും ബാധകമാകുകയും ചെയ്യും.",
      defaultTranslationLabel: "ഖുർആൻ വിവർത്തന ഭാഷ",
      rtlScript: "RTL ലിപി",
      ltrScript: "LTR ലിപി",
      unknownLanguage: "അറിയാത്ത ഭാഷ",
      saveLanguage: "വിവർത്തന ഭാഷ സംരക്ഷിക്കുക",
      savedTitle: "സംരക്ഷിച്ചു",
      saveFailedTitle: "സംരക്ഷിക്കൽ പരാജയപ്പെട്ടു",
      languagePreferenceUpdated: "ഭാഷാ മുൻഗണന അപ്‌ഡേറ്റ് ചെയ്തു.",
      failedToSaveLanguage: "ഭാഷാ ക്രമീകരണങ്ങൾ സംരക്ഷിക്കാനായില്ല.",
      signInToPersist: "പ്രതി ഉപയോക്താവിനും ഈ ക്രമീകരണം സംരക്ഷിക്കാൻ Clerk ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക.",
      persistenceUnavailable: "സ്ഥിരസംഭരണം ലഭ്യമല്ല",
      saveIssue: "സംരക്ഷിക്കൽ പ്രശ്നം",
    },
  },
};

export function getAppUiCopy(language: UiLanguage): AppUiCopy {
  return APP_UI_COPY[language];
}

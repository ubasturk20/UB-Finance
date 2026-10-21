// Dashboard ve hoş geldiniz sayfası.
export const dashboard = {
  // Hoş geldiniz sayfası
  'welcome.titleAfterBrand': "'a hoş geldiniz!",
  'welcome.intro':
    'Paranızın nereye gittiğini gösteren ve her liraya bir görev veren bir bütçe. ' +
    'Takip etmek istediğiniz hesapları ekleyerek başlayın.',
  'welcome.setupTime': 'Kurulum süresi:',
  'welcome.free': 'Ücretsiz',
  'welcome.plaid.title': 'Plaid ile bağlan',
  'welcome.plaid.time': '~10 dk + onay',
  'welcome.plaid.description':
    'Bir kez kurun, yeni işlemler kendiliğinden gelsin. Ücretsiz bir Plaid geliştirici hesabı ' +
    'açın; ardından Plaid gerçek bankalarınıza erişimi onaylar.',
  'welcome.plaid.action': "Plaid'i bağla",
  'welcome.simplefin.title': 'SimpleFIN ile bağlan',
  'welcome.simplefin.tag': 'Ayda 1,50 $',
  'welcome.simplefin.time': '~5 dk',
  'welcome.simplefin.description':
    'Bir kez kurun, yeni işlemler SimpleFIN Bridge üzerinden (binlerce banka) kendiliğinden ' +
    "gelsin. Ücret doğrudan SimpleFIN'e ödenir.",
  'welcome.simplefin.action': "SimpleFIN'i bağla",
  'welcome.europe.title': "Avrupa'daki bir bankayı bağla",
  'welcome.europe.time': '~15 dk',
  'welcome.europe.description':
    "Bir kez kurun, yeni işlemler Avrupa'daki bankalardan (PSD2) kendi ücretsiz Enable Banking " +
    'uygulamanız üzerinden kendiliğinden gelsin. Birkaç ayda bir bankanıza yeniden giriş yapın.',
  'welcome.europe.action': 'Enable Banking ile bağla',
  'welcome.manual.title': 'Hesapları elle ekle',
  'welcome.manual.tag': 'Banka bağlantısı yok',
  'welcome.manual.time': 'Hesap başına ~1 dk',
  'welcome.manual.description':
    'Her hesabı ve bakiyesini kendiniz eklersiniz. İşlemler de elle girilir: bankanızdan CSV ' +
    'dosyalarını indirip kendiniz içe aktarın ya da her birini tek tek girin. Hiçbir şey ' +
    'kendiliğinden güncellenmez.',
  'welcome.manual.action': 'Elle ekle',
  // Banka senkronu kapalıyken (VITE_BANK_SYNC) banka seçeneklerinin yerine
  'welcome.csv.title': 'Banka ekstresini içe aktar',
  'welcome.csv.tag': 'CSV veya CAMT',
  'welcome.csv.time': '~3 dk',
  'welcome.csv.description':
    'Hesabınızı ekleyin, ardından bankanızın internet şubesinden indirdiğiniz CSV ya da ' +
    'CAMT.053 ekstresini içe aktarın. Yeni işlemler için dosyayı arada bir yeniden yükleyin.',
  'welcome.csv.action': 'Hesap ekle ve içe aktar',
  'welcome.privacy.server':
    'Bütçeniz kendi sunucunuzda saklanır. UB-Finance hesabı yok, izleme yok.',
  'welcome.privacy.local': 'Bütçeniz bu bilgisayarda kalır. UB-Finance hesabı yok, izleme yok.',
  'welcome.compareBanks': 'Banka seçeneklerini karşılaştır',
  'welcome.skip': 'Şimdilik geç ve etrafa göz at',

  // Başlarken listesi
  'dash.start.title': "UB-Finance'ı kullanmaya başlayın",
  'dash.start.progress':
    '{done}/{total} adım tamamlandı. Her adım genel bakışınızı biraz daha canlandırır.',
  'dash.start.hide': 'Başlarken listesini gizle',
  'dash.start.progressLabel': 'Başlarken ilerlemesi',
  'dash.start.done': 'Tamamlandı',
  'dash.start.notSure': 'Nereden başlayacağınızdan emin değil misiniz?',
  'dash.start.guide': 'Başlangıç kılavuzunu okuyun',
  'dash.start.account.title': 'İlk hesabınızı ekleyin',
  'dash.start.account.description':
    'Vadesiz hesap, kredi kartı ya da nakit: para tutan her şey olabilir.',
  'dash.start.account.action': 'Hesap ekle',
  'dash.start.transactions.title': 'İşlemlerinizi getirin',
  'dash.start.transactions.description':
    'Bankanızdan bir CSV dosyası içe aktarın, bir banka bağlayın ya da işlemleri elle ekleyin.',
  'dash.start.transactions.import': 'İçe aktar veya ekle',
  'dash.start.transactions.connect': 'Banka bağla',
  'dash.start.transactions.descriptionNoBank':
    'Bankanızdan bir CSV ya da CAMT dosyası içe aktarın veya işlemleri elle ekleyin.',
  'dash.start.transactions.addManual': 'İşlem ekle',
  'dash.start.recurring.title': 'Faturalarınızı ve maaşlarınızı ekleyin',
  'dash.start.recurring.description': 'Sırada ne olduğunu görün, hiçbir ödemeyi kaçırmayın.',
  'dash.start.recurring.action': 'Düzenli işlem ekle',
  'dash.start.budget.title': 'Bu ayın bütçesini planlayın',
  'dash.start.budget.description':
    'Maaşlarınız ve faturalarınız girildikten sonra paranızın geri kalanına bir görev verin.',
  'dash.start.budget.action': 'Bütçeyi aç',
  'dash.start.rules.title': 'Otomatik kategorilendirin',
  'dash.start.rules.description':
    'Kurallar yeni işlemleri alıcıya, tutara ve daha fazlasına göre sizin için sıralar.',
  'dash.start.rules.action': 'Kural oluştur',

  // Net değer
  'dash.netWorth.title': 'Net Değer',
  'dash.netWorth.empty': 'Tüm hesaplarınızda sahip olduklarınız eksi borçlarınız.',
  'dash.netWorth.addAccount': 'Hesap ekle',
  'dash.netWorth.range': 'Tarih aralığı',
  'dash.range.1m': '1 ay',
  'dash.range.3m': '3 ay',
  'dash.range.6m': '6 ay',
  'dash.range.ytd': 'Yılbaşından bugüne',
  'dash.range.1y': '1 yıl',
  'dash.range.all': 'Tüm zamanlar',

  // Özet kartları
  'dash.stats.leftToSpend': 'Kalan',
  'dash.stats.noBudget': 'Bu ay bütçe belirlenmedi',
  'dash.stats.avgIncome': 'Ort. aylık gelir',
  'dash.stats.avgExpenses': 'Ort. aylık gider',
  'dash.stats.savingsRate': 'Birikim oranı',
  'dash.stats.savingsGoal': 'Birikim oranı hedefi',
  'dash.stats.goalOption': '{percent} hedef',
  'dash.stats.noIncome': 'Gelir olunca gösterilir',

  // Kartlarda ortak
  'dash.viewAll': 'Tümünü gör',
  'dash.addTransaction': 'İşlem ekle',

  // Nakit akışı
  'dash.cashFlow.title': 'Nakit Akışı',
  'dash.cashFlow.netThisMonth': 'Bu ay net:',
  'dash.cashFlow.income': 'Gelir',
  'dash.cashFlow.expenses': 'Gider',
  'dash.cashFlow.emptyTitle': 'Henüz para girişi ya da çıkışı yok',
  'dash.cashFlow.emptyDescription': 'Gelenle gideni ay ay karşılaştırmak için işlem ekleyin.',

  // Harcama karşılaştırması
  'dash.spending.title': 'Harcama',
  'dash.spending.compare': 'Karşılaştırma',
  'dash.spending.weekVsLastWeek': 'Bu hafta - geçen hafta',
  'dash.spending.monthVsLastMonth': 'Bu ay - geçen ay',
  'dash.spending.monthVsLastYear': 'Bu ay - geçen yılın aynı ayı',
  'dash.spending.monthVsAverage': 'Bu ay - ortalama ay',
  'dash.spending.yearVsLastYear': 'Bu yıl - geçen yıl',
  'dash.spending.day': '{day}. gün',
  'dash.spending.thisWeek': 'Bu hafta',
  'dash.spending.lastWeek': 'Geçen hafta',
  'dash.spending.thisMonth': 'Bu ay',
  'dash.spending.lastMonth': 'Geçen ay',
  'dash.spending.averageMonth': 'Ortalama ay (son 12 ay)',
  'dash.spending.thisYear': 'Bu yıl',
  'dash.spending.lastYear': 'Geçen yıl',
  'dash.spending.emptyTitle': 'Henüz karşılaştıracak bir şey yok',
  'dash.spending.emptyDescription':
    'Harcama yapmaya başladığınızda, bu dönemin bir öncekiyle karşılaştırması burada görünür.',

  // Bütçe ilerlemesi
  'dash.budget.title': 'Bütçe',
  'dash.budget.emptyTitle': '{month} için henüz bütçe yok',
  'dash.budget.emptyDescription':
    'Her kategoride ne kadar harcamayı planladığınızı belirleyin, ilerlemenizi burada izleyin.',
  'dash.budget.plan': 'Bütçenizi planlayın',
  'dash.budget.planned': 'Planlanan: {amount}',
  'dash.budget.spent': 'Harcanan: {amount}',
  'dash.budget.remaining': '{amount} kalan',

  // Yaklaşan faturalar
  'dash.bills.title': 'Yaklaşan Faturalar',
  'dash.bills.emptyTitle': 'Faturalarınızı ve maaşlarınızı takip edin',
  'dash.bills.emptyDescription':
    'Kira, abonelik ve düzenli gelirlerinizi ekleyin ya da UB-Finance bunları işlemlerinizde ' +
    'bulsun.',
  'dash.bills.add': 'Düzenli işlem ekle',
  'dash.bills.nothingDue': 'Önümüzdeki 30 günde ödenecek bir şey yok.',
  'dash.bills.overdue': '{days} gün gecikti',
  'dash.bills.tomorrow': 'Yarın',
  'dash.bills.inDays': '{days} gün içinde',

  // Kategoriye göre harcama
  'dash.breakdown.title': 'Kategoriye Göre Harcama',
  'dash.breakdown.emptyTitle': 'Bu ay harcama yok',
  'dash.breakdown.emptyDescription': 'Harcadıkça en büyük kategorileriniz burada görünür.',
  'dash.breakdown.uncategorized': 'Kategorisiz',

  // Son işlemler
  'dash.recent.title': 'Son İşlemler',
  'dash.recent.emptyTitle': 'Henüz işlem yok',
  'dash.recent.emptyDescription':
    'Bankanızdan bir CSV dosyası içe aktarın, bir banka bağlayın ya da işlemleri elle ekleyin.',
  'dash.recent.import': 'CSV dosyası içe aktar',
} as const;

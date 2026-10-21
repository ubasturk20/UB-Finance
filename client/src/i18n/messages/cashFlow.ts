// Nakit akışı sayfası ve demo parçaları.
export const cashFlow = {
  // Nakit akışı: tarih aralığı
  'cf.preset.1m': '1 ay',
  'cf.preset.3m': '3 ay',
  'cf.preset.6m': '6 ay',
  'cf.preset.ytd': 'Bu yıl',
  'cf.preset.lastYear': 'Geçen yıl',
  'cf.preset.custom': 'Özel',
  'cf.exportCsv': 'CSV dışa aktar',

  // Nakit akışı: diyagram düğümleri
  'cf.node.income': 'Gelir',
  'cf.node.totalIncome': 'Toplam gelir',
  'cf.node.uncategorized': 'Kategorisiz',
  'cf.node.savings': 'Birikim',
  'cf.showTransactions': 'İşlemleri göster: {name}',
  'cf.negativeFlows':
    'Bazı akışlar gösterilmiyor: bu diyagram eksi tutarları (ör. iadeleri) çizemez. ' +
    'Özet toplamlar biraz farklı olabilir.',

  // Nakit akışı: ipuçları
  'cf.tooltip.ofTotalIncome': 'Toplam gelirdeki payı: {pct}',
  'cf.tooltip.savingsRate': 'Birikim oranı: {pct}',
  'cf.tooltip.ofTotalSpending': 'Toplam harcamadaki payı: {pct}',
  'cf.tooltip.ofGroup': '{group} içindeki payı: {pct}',

  // Nakit akışı: özet kartları
  'cf.stat.totalIncome': 'Toplam gelir',
  'cf.stat.totalExpenses': 'Toplam gider',
  'cf.stat.net': 'Toplam net gelir',
  'cf.stat.savingsRate': 'Birikim oranı',

  // Nakit akışı: telefon listesi
  'cf.list.moneyIn': 'Gelen para',
  'cf.list.whereItWent': 'Paranın gittiği yer',
  'cf.list.saved': 'Biriken',
  'cf.list.ofIncome': '(gelirdeki payı)',
  'cf.list.hideTransactions': 'İşlemleri gizle',
  'cf.list.allTransactions': 'Tüm {name} işlemleri',
  'cf.view.showAs': 'Görünüm',
  'cf.view.list': 'Liste',
  'cf.view.diagram': 'Diyagram',
  'cf.view.swipe': 'Tamamını görmek için kaydırın',

  // Nakit akışı: seçilen düğümün işlemleri
  'cf.transactions.heading': 'İşlemler: {name}',
  'cf.transactions.clear': 'Temizle',

  // Demo
  'demo.region': 'Demo',
  'demo.banner.title': 'Bu bir demo bütçe.',
  'demo.banner.short': 'Hiçbir şey kaydedilmez.',
  'demo.banner.long':
    'İstediğinizi değiştirin. Hiçbir şey kaydedilmez; sekmeyi kapatınca demo ' + 'baştan başlar.',
  'demo.home': 'Ana sayfaya dön',
  'demo.homeTitle': 'UB-Finance ana sayfasına dön',
  'demo.startOver': 'Baştan başla',
  'demo.startOverTitle': 'Özgün demo bütçeyle baştan başla',
  'demo.download': 'İndir',
  'demo.downloadApp': "UB-Finance'i indir",
  'demo.notAvailable': 'Demoda kullanılamaz',
  'demo.connectBank': 'Banka bağla',
  'demo.bankText':
    'Banka bağlantıları için UB-Finance uygulaması gerekir; bu yüzden demo bir banka ' +
    'bağlayamaz ve banka giriş bilgisi alamaz. Uygulamada Plaid, SimpleFIN ya da Enable ' +
    'Banking (Avrupa bankaları) işlemlerinizi otomatik getirir; bankanızdan aldığınız CSV ' +
    'dosyalarını da içe aktarabilirsiniz.',
} as const;

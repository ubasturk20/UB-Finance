// Hesaplar, hesap sayfası, mutabakat, para birimi bileşenleri.
export const accounts = {
  // Hesap türleri (type kodları sunucuda aynı kalır; yalnızca etiketler)
  'acc.type.checking': 'Vadesiz hesap',
  'acc.type.checking.hint': 'Günlük kullanılan banka hesabı',
  'acc.type.savings': 'Birikim hesabı',
  'acc.type.savings.hint': 'Birikim, vadeli mevduat, para piyasası',
  'acc.type.cash': 'Nakit',
  'acc.type.cash.hint': 'Cüzdan ya da kasa',
  'acc.type.credit': 'Kredi kartı',
  'acc.type.credit.hint': 'Kredi kartı ya da harcama kartı',
  'acc.type.line_of_credit': 'Kredili mevduat',
  'acc.type.line_of_credit.hint': 'Kredili mevduat hesabı (KMH) ya da kredi limiti',
  'acc.type.investment': 'Yatırım',
  'acc.type.investment.hint': 'Yatırım hesabı (hisse, fon, tahvil)',
  'acc.type.retirement': 'Bireysel emeklilik',
  'acc.type.retirement.hint': 'BES, emeklilik fonu',
  'acc.type.crypto': 'Kripto',
  'acc.type.crypto.hint': 'Borsa hesabı ya da cüzdan',
  'acc.type.real_estate': 'Gayrimenkul',
  'acc.type.real_estate.hint': 'Ev, kiradaki konut ya da arsa',
  'acc.type.vehicle': 'Araç',
  'acc.type.vehicle.hint': 'Otomobil, motosiklet, tekne, karavan',
  'acc.type.valuables': 'Değerli eşya',
  'acc.type.valuables.hint': 'Mücevher, sanat eseri, koleksiyon, altın ve değerli madenler',
  'acc.type.mortgage': 'Konut kredisi',
  'acc.type.mortgage.hint': 'Ev kredisi',
  'acc.type.auto_loan': 'Taşıt kredisi',
  'acc.type.auto_loan.hint': 'Otomobil ya da araç kredisi',
  'acc.type.student_loan': 'Eğitim kredisi',
  'acc.type.student_loan.hint': 'KYK ya da özel eğitim kredisi',
  'acc.type.loan': 'Kredi',
  'acc.type.loan.hint': 'İhtiyaç, sağlık ya da aileden alınan kredi',
  'acc.type.other_asset': 'Diğer varlık',
  'acc.type.other_asset.hint': 'Sahip olduğunuz başka her şey',
  'acc.type.other_liability': 'Diğer borç',
  'acc.type.other_liability.hint': 'Borçlu olduğunuz başka her şey',

  // Hesap grupları
  'acc.group.cash': 'Nakit',
  'acc.group.credit': 'Kredi',
  'acc.group.investments': 'Yatırımlar',
  'acc.group.property': 'Mülkler',
  'acc.group.loans': 'Krediler',
  'acc.group.other': 'Diğer',

  // Hesaplar sayfası
  'acc.page.title': 'Hesaplar',
  'acc.add': 'Hesap Ekle',
  'acc.adding': 'Ekleniyor…',
  'acc.addLink': 'Hesap ekle',
  'acc.pastMonth': 'son bir ay',
  'acc.empty.title': 'Takip etmek istediğiniz hesapları ekleyin',
  'acc.empty.description':
    'Vadesiz ve birikim hesapları, kredi kartları, krediler, yatırımlar ya da eviniz: her ' +
    'hesabın kendi bakiyesi ve işlemleri vardır, hepsi birlikte net değerinizi oluşturur.',
  'acc.empty.addFirst': 'İlk hesabınızı ekleyin',
  'acc.empty.connectBank': 'Banka bağla',

  // Varlık / borç özeti
  'acc.summary.assets': 'Varlıklar',
  'acc.summary.liabilities': 'Borçlar',
  'acc.summary.noAssets': 'Henüz banka hesabı, yatırım ya da mülk yok.',
  'acc.summary.noLiabilities': 'Henüz kredi kartı ya da kredi yok.',

  // Hesap ekle / düzenle
  'acc.form.name': 'Hesap Adı',
  'acc.form.nameAria': 'Hesap adı',
  'acc.form.namePlaceholderProperty': 'ör. 2021 Renault Clio',
  'acc.form.namePlaceholder': 'ör. Ziraat Vadesiz',
  'acc.form.type': 'Hesap Türü',
  'acc.form.typeAria': 'Hesap türü',
  'acc.form.currency': 'Para birimi',
  'acc.form.chooseCurrency': 'Para birimi seç',
  'acc.form.currencyBecomesBudget': 'Bu, bütçenizin para birimi de olur.',
  'acc.form.currencyForeign':
    'Tutarları {currency} olarak kalır; bütçeniz onları her günün kuruyla {budget} olarak ' +
    'sayar.',
  'acc.form.currencyLocked': 'Hesapta işlem olduktan sonra değiştirilemez.',
  'acc.form.currencyHasTransactions':
    'İşlemleri bu para biriminde olduğu için değişmez. Başka bir para birimi için ' +
    'yeni bir hesap ekleyin ve parayı transferle taşıyın.',
  'acc.form.amountOwed': 'Borç Tutarı',
  'acc.form.currentValue': 'Güncel Değer',
  'acc.form.currentBalance': 'Güncel Bakiye',
  'acc.form.amountOwedHint': 'Bugün itibarıyla borcunuz.',
  'acc.form.currentValueHint':
    'Bugünkü değeri. Hesap sayfasından istediğiniz zaman güncelleyebilirsiniz.',
  'acc.form.currentBalanceHint': 'Bugün itibarıyla bakiyenizi girin.',
  'acc.form.offBudget': 'Bütçe dışı',
  'acc.form.offBudgetHint':
    'Net değere sayılır ama bütçenize sayılmaz. Yatırımlar, mülkler ve krediler için ' +
    'önerilir.',
  'acc.form.offBudgetExcluded': 'Bütçe dışı (bütçelemeye katılmaz)',
  'acc.form.startingBalance': 'Açılış Bakiyesi',
  'acc.form.startingBalanceAria': 'Açılış bakiyesi',

  'acc.edit.title': 'Hesabı Düzenle',
  'acc.edit.logo': 'Logo',
  'acc.edit.changeImage': 'Görseli değiştir',
  'acc.edit.uploadImage': 'Görsel yükle',
  'acc.edit.useInitials': 'Baş harfleri kullan',
  'acc.edit.cropped': 'Kare olarak kırpıldı.',
  'acc.edit.showingInitials':
    'Baş harfler gösteriliyor. Bir banka logosu ya da başka bir görsel yükleyin.',
  'acc.edit.iconsOff': 'Hesap simgeleri Ayarlar → Tercihler’de kapalı.',
  'acc.edit.imageError': 'Bu görsel kullanılamadı.',
  'acc.edit.close': 'Hesabı Kapat',
  'acc.edit.closeConfirm':
    '"{name}" hesabını kapatmak istediğinizden emin misiniz? Hesaplar listenizde gizlenecek.',

  // Değer / bakiye güncelle
  'acc.updateValue': 'Değeri güncelle',
  'acc.updateBalance': 'Bakiyeyi güncelle',
  'acc.updateValue.title': 'Değeri Güncelle',
  'acc.updateBalance.title': 'Bakiyeyi Güncelle',
  'acc.updateValue.valueToday': 'Bugünkü değer',
  'acc.updateValue.owedToday': 'Bugünkü borç tutarı',
  'acc.updateValue.currently': 'Şu anki: {amount}.',
  'acc.updateValue.addsBefore': 'Bugün tarihli',
  'acc.updateValue.addsAfter': 'düzeltme ekler.',
  'acc.updateValue.noteValue': 'Değer güncellemesi',
  'acc.updateValue.noteBalance': 'Bakiye güncellemesi',

  // Hesap sayfası
  'acc.notFound.title': 'Hesap bulunamadı',
  'acc.notFound.description': 'Kapatılmış ya da silinmiş olabilir, veya bağlantı eskimiş.',
  'acc.notFound.goToAccounts': 'Hesaplara git',
  'acc.reconcile': 'Mutabakat',

  // Mutabakat
  'acc.reconcile.heading': 'Mutabakat: {name}',
  'acc.reconcile.enterBalance': 'Bankanızdaki kapanış bakiyesini girin',
  'acc.reconcile.enterBalanceHint':
    'Güncel bakiye için banka ekstrenize ya da internet bankacılığına bakın.',
  'acc.reconcile.statementBalance': 'Ekstre Bakiyesi',
  'acc.reconcile.statementBalanceAria': 'Ekstre bakiyesi',
  'acc.reconcile.currentSelected': 'Uygulamada seçili güncel bakiye',
  'acc.reconcile.start': 'Mutabakatı Başlat',
  'acc.reconcile.col.date': 'Tarih',
  'acc.reconcile.col.payee': 'Alıcı',
  'acc.reconcile.col.amount': 'Tutar',
  'acc.reconcile.col.cleared': 'M',
  'acc.reconcile.none': 'Mutabık olmayan işlem yok.',
  'acc.reconcile.selectedBalance': 'Seçili Bakiye',
  'acc.reconcile.difference': 'Fark',
  'acc.reconcile.ready': 'Bitirmeye hazır!',
  'acc.reconcile.finish': 'Bitir',
  'acc.reconcile.createAdjustment': 'Düzeltme Oluştur',
  'acc.reconcile.adjustmentNote': 'Mutabakat düzeltmesi',

  // Para birimi bileşenleri
  'currency.select.aria': 'Para birimi',
  'currency.select.common': 'Sık kullanılanlar',
  'currency.select.all': 'Tüm para birimleri',
  'currency.noRate': 'Kur yok',
  'currency.noRate.title':
    'Bu gün için henüz döviz kuru yok: kur girilene kadar bütçe bunu sıfır sayar',
  'currency.addRate': 'Kur ekle',
  'currency.unconverted': '{currencies} hariç: henüz döviz kuru yok.',
  'currency.missingBanner':
    '{count} {currencies} işleminin henüz {budget} değeri yok: gününe ait döviz kuru yok.',
  'currency.mainAmount.label': '{currency} cinsinden değer',
  'currency.mainAmount.noRateYet': 'Henüz kur yok',
  'currency.mainAmount.rate': 'Günün döviz kuruyla.',
  'currency.mainAmount.manual': 'Yazdığınız gibi.',
  'currency.mainAmount.transfer': 'Transferin diğer tarafının değeri.',
  'currency.mainAmount.missing':
    'Bu gün için henüz döviz kuru yok, bu yüzden bütçe bunu sıfır sayar. Tutarını ' +
    'yazın ya da Ayarlar → Para Birimleri’nden bir kur ekleyin.',
  'currency.mainAmount.useRate': 'Günün kurunu kullan',
  'currency.difference.fromRate': '{amount} kur farkı',
  'currency.difference.buttonTitle': 'Döviz kurundaki değişimin bu hesabın değerine etkisi',
  'currency.difference.title': 'Kur farkı',
  'currency.difference.more':
    'Bugünkü kurla {name}, para girdiğinde bütçenizin saydığından {amount} daha fazla ' +
    'değerli. Bütçenizi buna göre güncellemek için kaydedin: bu tutarda bir ' +
    'düzeltmeyi gelir olarak ekler.',
  'currency.difference.less':
    'Bugünkü kurla {name}, para girdiğinde bütçenizin saydığından {amount} daha az ' +
    'değerli. Bütçenizi buna göre güncellemek için kaydedin: bu tutarda bir düzeltmeyi ' +
    'harcama olarak ekler.',
  'currency.difference.category': 'Kategori',
  'currency.difference.noCategory': 'Kategori yok (yalnızca net değer)',
  'currency.difference.noCategoryHint':
    'Kategori olmadan, diğer bakiye düzeltmeleri gibi gelir ve harcamaya katılmaz.',
  'currency.difference.error': 'Bir şeyler ters gitti.',
  'currency.difference.record': 'Farkı kaydet',
  'currency.unreadableAmount': 'Bu bir tutar değil. 12,50 ya da 12.50 gibi yazın.',
} as const;

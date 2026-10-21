// İşlem listesi, satırlar, ekleme formu.
export const transactions = {
  // Page and register
  'tx.page.title': 'Tüm İşlemler',
  'tx.count': '{count} işlem',
  'tx.importCsv': 'CSV içe aktar',
  'tx.addTransaction': 'İşlem ekle',
  'tx.newTransaction': 'Yeni işlem',
  'tx.editTransaction': 'İşlemi düzenle',
  'tx.savedOnDeviceTitle': 'Bu cihaza kaydedilir ve UB-Finance yeniden bağlanınca gönderilir',
  'tx.dayTotalHint': '{currency} cinsinden, her günün kuruyla',
  'tx.showing': '{shown} / {total} işlem gösteriliyor',
  'tx.showMore': '{count} işlem daha göster',

  // Empty states
  'tx.empty.title': 'Henüz işlem yok',
  'tx.empty.accountDescription':
    'Bankanızdan indirdiğiniz bir CSV dosyasını içe aktarın ya da harcadıkça ' +
    'işlemleri elle ekleyin.',
  'tx.empty.allDescription':
    'İşlemleri elle ekleyin, bir hesap sayfasından CSV dosyası içe aktarın ya da ' +
    'işlemlerin otomatik gelmesi için bir banka bağlayın.',
  'tx.empty.allDescriptionNoBank':
    'İşlemleri elle ekleyin ya da bir hesap sayfasından bankanızın CSV veya CAMT dosyasını ' +
    'içe aktarın.',
  'tx.empty.importCsvFile': 'CSV dosyası içe aktar',
  'tx.empty.addFirst': 'İlk işlemi ekle',
  'tx.empty.connectBank': 'Banka bağla',
  'tx.notFound.title': 'İşlem bulunamadı',
  'tx.notFound.filtered': 'Aramanıza ve filtrelerinize uyan bir şey yok.',
  'tx.notFound.none': 'Burada işlem yok.',
  'tx.notFound.range': 'Bu tarih aralığında işlem yok.',
  'tx.notFound.clearFilters': 'Filtreleri temizle',
  'tx.notFound.showAllDates': 'Tüm tarihleri göster',

  // Rows and cards
  'tx.transfer': 'Transfer',
  'tx.transferTo': 'Transfer: {account}',
  'tx.split': 'Bölünmüş ({count})',
  'tx.uncategorized': 'Kategorisiz',
  'tx.reconciled': 'Mutabık',
  'tx.showAllFor': '"{name}" işlemlerinin tümünü göster',
  'tx.goToAccount': '{name} hesabına git',

  // Entry form (register row / phone sheet)
  'tx.form.date': 'Tarih',
  'tx.form.payee': 'Alıcı',
  'tx.form.category': 'Kategori',
  'tx.form.notes': 'Notlar',
  'tx.form.outflow': 'Çıkış',
  'tx.form.inflow': 'Giriş',
  'tx.form.savePaused': 'Kaydet (UB-Finance yeniden bağlanana kadar duraklatıldı)',
  'tx.form.saveOnDeviceTitle': 'Bu cihaza kaydet (UB-Finance yeniden bağlanınca gönderilir)',
  'tx.form.saveOnDevice': 'Cihaza kaydet',
  'tx.form.splitTransaction': 'İşlemi böl',
  'tx.form.split': 'Böl',
  'tx.form.splitMode': 'Bölünmüş',
  'tx.form.splitCategory': 'Parça {n} kategorisi',
  'tx.form.splitNotes': 'Parça {n} notları',
  'tx.form.splitAmount': 'Parça {n} tutarı',
  'tx.form.removeSplit': 'Parça {n} kaldır',
  'tx.form.addSplit': 'Parça ekle',
  'tx.form.balanced': 'Dengede',
  'tx.form.remaining': '{amount} kalan',

  // Add transaction dialog
  'tx.add.outflow': 'Çıkış',
  'tx.add.inflow': 'Giriş',
  'tx.add.amount': 'Tutar',
  'tx.add.amountIn': '{currency} cinsinden tutar',
  'tx.add.amountReceived': 'Alınan tutar: {account} ({currency})',
  'tx.add.amountSent': 'Gönderilen tutar: {account} ({currency})',
  'tx.add.otherAccount': 'diğer hesap',
  'tx.add.asBankShows': 'Bankanızın gösterdiği gibi.',
  'tx.add.atRate': '{date} tarihli kurla ({rate}). Bankanızın gösterdiğiyle değiştirin.',
  'tx.add.noRateArrived': 'Bu gün için kur yok: hesaba geçen tutarı yazın.',
  'tx.add.noRateSent': 'Bu gün için kur yok: gönderilen tutarı yazın.',
  'tx.add.merchant': 'Alıcı',
  'tx.add.date': 'Tarih',
  'tx.add.account': 'Hesap',
  'tx.add.fromAccount': 'Gönderen hesap',
  'tx.add.toAccount': 'Alan hesap',
  'tx.add.selectAccount': 'Hesap seçin…',
  'tx.add.onBudget': 'Bütçedeki',
  'tx.add.offBudget': 'Bütçe dışı',
  'tx.add.category': 'Kategori',
  'tx.add.notes': 'Notlar',
  'tx.add.notePlaceholder': 'Not ekleyin…',
  'tx.add.adding': 'Ekleniyor…',

  // Filters
  'tx.filter.search': 'Alıcı veya notlarda ara…',
  'tx.filter.clearSearch': 'Aramayı temizle',
  'tx.filter.category': 'Kategori',
  'tx.filter.clearCategory': 'Kategori filtresini temizle',
  'tx.filter.thisMonth': 'Bu ay',
  'tx.filter.last3': 'Son 3 ay',
  'tx.filter.thisYear': 'Bu yıl',
  'tx.filter.all': 'Tüm zamanlar',

  // Waiting (saved on this device)
  'tx.waiting.title': 'Bu cihaza kaydedildi',
  'tx.waiting.sending': 'Gönderiliyor…',
  'tx.waiting.offline':
    'UB-Finance yeniden bağlanınca gönderilir. Henüz bakiyelerde ve bütçede yok.',
  'tx.waiting.anotherAccount': 'başka bir hesap',
  'tx.waiting.noPayee': 'Alıcı yok',
  'tx.waiting.notSaved': 'Kaydedilmedi: {error}',
  'tx.waiting.retryLabel': 'Tekrar dene: {payee}',
  'tx.waiting.discard': 'Sil',
  'tx.waiting.discardLabel': 'Sil: {payee}',
  'tx.waiting.discardTitle': 'Bu işlem silinsin mi?',
  'tx.waiting.discardMessage':
    "Yalnızca bu cihaza kaydedilmişti ve UB-Finance'a gönderilmedi; silinince geri gelmez.",
} as const;

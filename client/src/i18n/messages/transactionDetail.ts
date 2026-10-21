// İşlem ayrıntı paneli, transfer önerileri, kategori/alıcı seçiciler.
export const transactionDetail = {
  // Ayrıntı paneli
  'txd.panel.label': 'İşlem ayrıntıları',
  'txd.panel.title': 'İşlem Ayrıntıları',
  'txd.panel.close': 'Ayrıntıları kapat',
  'txd.panel.reconciled': 'Bu işlem mutabık ve düzenlenemez.',
  'txd.panel.date': 'Tarih',
  'txd.panel.category': 'Kategori',
  'txd.panel.split': 'Bölünmüş ({count})',
  'txd.panel.payee': 'Alıcı',
  'txd.panel.notes': 'Notlar',
  'txd.panel.notesPlaceholder': 'Bu işleme not ekleyin…',
  'txd.panel.recurring': 'Düzenli işlem',
  'txd.panel.unlinkRecurring': 'Düzenli işlemden ayır',
  'txd.panel.notTransfer': 'Transfer değil',
  'txd.panel.notTransferHint': 'İki tarafı da yeniden sıradan işlem yap',
  'txd.panel.createRule': 'Kural oluştur',
  'txd.panel.deleteTransaction': 'İşlemi Sil',
  'txd.panel.ruleTitle': 'İşlemden yeni kural',
  'txd.panel.deleteMessage':
    'Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',

  // Ortak
  'txd.uncategorized': 'Kategorisiz',
  'txd.transfer': 'Transfer',
  'txd.transferTo': 'Transfer: {name}',
  'txd.categoryLabel': 'Kategori',
  'txd.categoryButton': 'Kategori: {name}',

  // Transfer önerileri
  'txd.suggest.region': 'Olası transferler',
  'txd.suggest.count': 'Hesaplarınız arasında {count} olası transfer.',
  'txd.suggest.explain': 'Aynı tutar birkaç gün içinde bir hesaptan çıkıp başka bir hesaba girdi.',
  'txd.suggest.review': 'İncele',
  'txd.suggest.linked': '{count} transfer bağlandı.',
  'txd.suggest.skipped': ' {count} tanesi değiştiği için atlandı.',
  'txd.suggest.interrupted':
    ' Kalanlardan önce bağlantı koptu; onları daha sonra yeniden inceleyin.',
  'txd.suggest.intro':
    'Bağlı transferler parayı hesaplarınız arasında taşır, bu yüzden harcama ya da ' +
    'gelir sayılmaz. Transfer olmayanların işaretini kaldırın ya da tekrar ' +
    'önerilmemeleri için',
  'txd.suggest.introAfter': 'seçin.',
  'txd.suggest.linkError': 'Transferler bağlanamadı. Lütfen tekrar deneyin.',
  'txd.suggest.dismissError': '“Transfer değil” kaydedilemedi. Lütfen tekrar deneyin.',
  'txd.suggest.linking': 'Bağlanıyor…',
  'txd.suggest.linkCount': '{count} transferi bağla',
  'txd.suggest.anotherAccount': 'Başka bir hesap',
  'txd.suggest.noPayee': 'Alıcı yok',
  'txd.suggest.linkPair': '{amount} tutarını {from} hesabından {to} hesabına bağla',
  'txd.suggest.notTransferPair': 'Transfer değil: {amount}, {from} hesabından {to} hesabına',

  // Döviz hesabındaki işlemin bütçe para birimindeki değeri (MainAmountField)
  'txd.mainAmount.label': '{currency} cinsinden değer',

  // Kategori seçici
  'txd.picker.searchPlaceholder': 'Kategori ara…',
  'txd.picker.searchLabel': 'Kategori ara',
  'txd.picker.noCategories': 'Kategori bulunamadı',
  'txd.picker.newNamePlaceholder': 'Kategori adı',
  'txd.picker.newNameLabel': 'Yeni kategori adı',
  'txd.picker.creating': 'Oluşturuluyor…',
  'txd.picker.create': 'Oluştur',
  'txd.picker.createNew': 'Yeni kategori oluştur',
  'txd.picker.cancelCreate': 'Yeni kategoriden vazgeç',

  // Alıcı seçiciler
  'txd.payee.label': 'Alıcı',
  'txd.payee.new': 'Yeni alıcı: "{name}"',
  'txd.payee.search': 'Alıcı ara…',
  'txd.payee.yours': 'Alıcılarınız',
  'txd.payee.none': 'Alıcı bulunamadı',
  'txd.payee.createNamed': 'Yeni "{name}" alıcısını oluştur',
  'txd.payee.createNew': 'Yeni alıcı oluştur: “{name}”',
  'txd.payee.offline': 'Yeni alıcılar UB-Finance yeniden bağlanınca eklenebilir.',
} as const;

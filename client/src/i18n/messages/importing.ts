// Dosya içe aktarma (CSV, CAMT).
export const importing = {
  'import.title': 'İşlemleri İçe Aktar',
  'import.dismissError': 'Hata iletisini gizle',

  // Errors
  'import.error.parseFailed': 'CSV dosyası okunamadı',
  'import.error.tooManyRows':
    'Bu dosyada {count} işlem var. UB-Finance tek seferde en fazla {max} işlem içe aktarabilir: ' +
    'dosyayı daha küçük dosyalara bölün.',
  'import.error.previewFailed': 'Önizleme yapılamadı',
  'import.error.noBooked': 'Bu ekstrede kayda geçmiş işlem yok',
  'import.error.unreadable': 'Bu dosya okunamadı',
  'import.error.notCamt':
    "Bu dosya UB-Finance'ın okuyabileceği bir banka ekstresi değil (CAMT.053)",
  'import.error.chooseDates': 'Bu dosyanın tarihleri nasıl yazdığını seçin',
  'import.error.chooseAmounts': 'Bu dosyanın tutarları nasıl yazdığını seçin',
  'import.error.needOutWord': 'Bankanızın para çıkışı için kullandığı kelimeyi yazın',
  'import.error.noRowsImportable': 'Hiçbir satır içe aktarılamadı. {details}',
  'import.error.noValidRows': 'Geçerli satır bulunamadı',
  'import.error.noRowsSelected': 'Hiç satır seçilmedi',
  'import.error.failed': 'İçe aktarma yapılamadı',

  // Separators, encodings and formats
  'import.delimiter.comma': 'Virgül',
  'import.delimiter.semicolon': 'Noktalı virgül',
  'import.delimiter.tab': 'Sekme',
  'import.encoding.detect': 'Otomatik algıla',
  'import.encoding.westernEuropean': 'Batı Avrupa (Windows-1252)',
  'import.encoding.centralEuropean': 'Orta Avrupa (Windows-1250)',
  'import.encoding.centralEuropeanIso': 'Orta Avrupa (ISO-8859-2)',
  'import.dateFormat.mdy': 'AA/GG/YYYY',
  'import.dateFormat.dmy': 'GG/AA/YYYY',
  'import.dateFormat.ymd': 'YY/AA/GG',

  // Column roles
  'import.role.date': 'Tarih',
  'import.role.payee': 'Alıcı',
  'import.role.amount': 'Tutar',
  'import.role.inflow': 'Giriş',
  'import.role.outflow': 'Çıkış',
  'import.role.direction': 'Yön (giriş/çıkış)',
  'import.role.notes': 'Notlar',
  'import.role.skip': 'Atla',

  // Upload
  'import.upload.prompt':
    'Bankanızdan aldığınız bir dosyayı sürükleyip bırakın ya da seçmek için tıklayın',
  'import.upload.formats': 'CSV ya da CAMT.053 banka ekstresi (XML)',
  'import.upload.demo': 'Demo: dosyanız bu tarayıcı sekmesinde kalır ve kaydedilmez.',
  'import.upload.fileLabel': 'Banka dosyası',
  'import.checking': 'Denetleniyor…',
  'import.previewButton': 'Önizle',

  // Choosing a statement
  'import.statement.intro': 'Bu dosyada {count} hesabın ekstresi var. Hangisi bu hesaba ait?',
  'import.statement.label': 'Ekstre',
  'import.statement.option': '{account} ({count} işlem)',
  'import.statement.noNumber': 'Numarası olmayan hesap',
  'import.statement.importedBefore': ', daha önce buraya içe aktarıldı',

  // Mapping columns
  'import.map.intro': 'Her sütunu bir alanla eşleştirin. {count} satır bulundu.',
  'import.map.usingSaved': ' Bu hesaba son içe aktarmanızdaki ayarlar kullanılıyor.',
  'import.map.separator': 'Ayırıcı',
  'import.map.encoding': 'Karakter kodlaması',
  'import.map.skipRows': 'Başlığın üstündeki satırlar',
  'import.map.dates': 'Tarihler',
  'import.map.amounts': 'Tutarlar',
  'import.map.choose': 'Seçin…',
  'import.map.outWord': 'Para çıkışını belirten kelime',
  'import.map.outWordPlaceholder': 'İsteğe bağlı, ör. Af',
  'import.map.column': 'Sütun {name}',
  'import.map.dateSample': '{sample} değerinin hangi sırayla yazıldığı bu dosyadan anlaşılmıyor. ',
  'import.map.datesMixed': 'Bu dosyadaki satırlar tarihleri farklı sıralarla yazıyor. ',
  'import.map.amountSample':
    '{sample} değerinde ondalık ayırıcının nokta mı virgül mü olduğu bu dosyadan anlaşılmıyor. ',
  'import.map.amountsMixed': 'Bu dosyadaki satırlar tutarları farklı biçimlerde yazıyor. ',
  'import.map.chooseFormat': 'Bankanızın kullandığı biçimi seçin. ',
  'import.map.unknownDirections':
    'UB-Finance yön sütunundaki şu değerlerin anlamını bilmiyor: {words}. Bankanızın para ' +
    'çıkışı için kullandığı kelimeyi yazın; bilinmeyen diğer kelimeler para girişi sayılır.',
  'import.map.fromLastTime':
    'Bu dosya {what} nasıl yazdığını göstermiyor: bu hesaba son içe aktarmanızdaki gibi ' +
    '{formats} kullanılıyor.',
  'import.map.fromLastTime.dates': 'tarihleri',
  'import.map.fromLastTime.amounts': 'tutarları',
  'import.map.or': ' ya da ',
  'import.map.and': ' ve ',

  // Preview
  'import.preview.found': '{count} işlem bulundu.',
  'import.preview.duplicates': '{count} yinelenen işlem algılandı.',
  'import.preview.willImport': '{count} işlem içe aktarılacak.',
  'import.preview.entriesLeftOut': '{count} kayıt beklemede ya da okunamadı; dışarıda bırakıldı.',
  'import.preview.otherCurrency':
    'Bu ekstre {statement} cinsinden, ancak bu hesap {account} cinsinden. Ekstreyi {statement} ' +
    'cinsinden bir hesaba aktarın (bu para birimiyle bir hesap ekleyebilirsiniz).',
  'import.preview.otherAccount':
    'Bu ekstre {account} hesabına ait, ancak bu hesaba en son içe aktarılan ekstre {known} ' +
    'hesabına aitti. Doğru hesaba aktardığınızdan emin olun.',
  'import.preview.skippedFix':
    '{details} Bunları da eklemek için dosyayı düzeltip yeniden içe aktarın.',
  'import.preview.rowLabel': 'İçe aktar: {payee}, {date}',
  'import.preview.row': 'satır',
  'import.preview.duplicate': 'yinelenen',
  'import.preview.importing': 'İçe aktarılıyor…',
  'import.preview.importButton': '{count} işlemi içe aktar',

  // Done
  'import.done.title': 'İçe aktarma tamamlandı',
  'import.done.summary': '{imported} içe aktarıldı, {skipped} atlandı',

  // Rows left out (utils/csv.ts)
  'import.rows.dateRequired': 'Tarih sütunu gerekli',
  'import.rows.amountRequired': 'En az bir tutar sütunu gerekli',
  'import.rows.skippedCount': '{count} satır atlandı',
  'import.rows.skippedItem': '{row}. satır, {field} {value}',
  'import.rows.empty': '(boş)',
  'import.rows.more': 've {count} satır daha',
  'import.rows.field.date': 'tarih',
  'import.rows.field.amount': 'tutar',
  'import.rows.field.direction': 'yön',

  // CAMT (utils/camt.ts): the notes of a batch booked as one transaction
  'import.camt.payments': '{count} ödeme',
} as const;

// Özel rapor oluşturucu ve işlem takvimi.
export const reportBuilder = {
  // Sayfa
  'rb.title': 'Özel Rapor',
  'rb.backToReports': 'Raporlara dön',
  'rb.export': 'Dışa aktar',
  'rb.update': 'Güncelle',
  'rb.csv.filename': 'ozel-rapor-{from}-{to}.csv',
  'rb.csv.name': 'Ad',
  'rb.csv.amountMinor': 'Tutar (kuruş)',
  'rb.csv.month': 'Ay',

  // Kenar çubuğu
  'rb.section.chartType': 'Grafik türü',
  'rb.section.mode': 'Mod',
  'rb.section.groupBy': 'Gruplama',
  'rb.section.balanceType': 'Bakiye türü',
  'rb.section.dateRange': 'Tarih aralığı',
  'rb.section.accounts': 'Hesaplar',
  'rb.section.categories': 'Kategoriler',
  'rb.groupBy.label': 'Gruplama',
  'rb.range.frozen': 'Sabit: bu tarihler değişmez.',
  'rb.range.live': 'Canlı: içinde bulunulan ayla birlikte ilerler.',

  // Seçenekler
  'rb.mode.total': 'Toplam',
  'rb.mode.time': 'Zaman',
  'rb.chart.bar': 'Çubuk',
  'rb.chart.stackedBar': 'Yığılmış çubuk',
  'rb.chart.line': 'Çizgi',
  'rb.chart.area': 'Alan',
  'rb.chart.donut': 'Halka',
  'rb.chart.table': 'Tablo',
  'rb.chart.onlyIn': '{chart} yalnızca “{mode}” modunda kullanılabilir',
  'rb.groupBy.category': 'Kategori',
  'rb.groupBy.categoryGroup': 'Kategori grubu',
  'rb.groupBy.payee': 'Alıcı',
  'rb.groupBy.account': 'Hesap',
  'rb.groupBy.month': 'Ay',
  'rb.balance.expense': 'Gider',
  'rb.balance.income': 'Gelir',
  'rb.balance.net': 'Net',

  // Hesap ve kategori seçicileri
  'rb.picker.selectAll': 'Tümünü seç',
  'rb.picker.allSelected': 'Tümü seçili',
  'rb.picker.expand': '{name} grubunu aç',
  'rb.picker.collapse': '{name} grubunu kapat',

  // Kaydetme
  'rb.save.title': 'Raporu kaydet',
  'rb.update.title': 'Raporu güncelle',
  'rb.save.name': 'Rapor adı',
  'rb.save.placeholder': 'ör. Alıcıya göre aylık harcama',
  'rb.saved.title': 'Kayıtlı raporlar',
  'rb.saved.delete': '“{name}” raporunu sil',

  // Grafik ve tablo
  'rb.amount': 'Tutar',
  'rb.table.name': 'Ad',
  'rb.table.amount': 'Tutar',
  'rb.table.total': 'Toplam',
  'rb.table.month': 'Ay',

  // İşlem takvimi
  'rb.cal.dayLabel': '{day}: {income} giren, {expenses} çıkan',
  'rb.cal.moneyIn': 'Giren para',
  'rb.cal.moneyOut': 'Çıkan para',
  'rb.cal.in': 'Giren: {amount}',
  'rb.cal.out': 'Çıkan: {amount}',
  'rb.cal.net': 'Net: {amount}',
  'rb.cal.count': '{count} işlem',
  'rb.cal.none': 'İşlem yok',
  'rb.cal.moreOut': 'Daha çok çıkan',
  'rb.cal.moreIn': 'Daha çok giren',
} as const;

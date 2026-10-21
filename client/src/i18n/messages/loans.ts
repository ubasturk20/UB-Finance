// Kredi takibi (ihtiyaç, konut, taşıt, eğitim kredisi): kredi bilgileri, özet, ödeme planı.
export const loans = {
  // Hesap düzenleme penceresindeki bölüm
  'loan.details.title': 'Kredi bilgileri',
  'loan.details.hint':
    'Eşit taksitli ödeme planı için. Boş bıraktığınız alanlar kullanılmaz; BSMV ve KKDF boşken önerilen oran uygulanır.',
  'loan.details.principal': 'Çekilen tutar',
  'loan.details.rate': 'Aylık faiz oranı (%)',
  'loan.details.ratePlaceholder': 'ör. 3,49',
  'loan.details.term': 'Vade (ay)',
  'loan.details.termPlaceholder': 'ör. 36',
  'loan.details.firstPayment': 'İlk taksit tarihi',
  'loan.details.firstPaymentHint': 'Sonraki taksitler her ay aynı gün; kısa aylarda ayın son günü',
  'loan.details.bsmv': 'BSMV (%)',
  'loan.details.kkdf': 'KKDF (%)',
  'loan.details.taxPlaceholder': 'Önerilen: {rate}',
  'loan.details.taxHint': 'Konut kredisinde BSMV ve KKDF alınmaz; diğer kredilerde %15.',
  'loan.details.badTerm': '1 ile 360 arasında bir ay sayısı yazın.',
  'loan.details.badPercent': '0 ile 100 arasında bir oran yazın (ör. 3,49).',
  'loan.details.saveError': 'Kredi bilgileri kaydedilemedi.',

  // Hesap sayfasındaki özet
  'loan.summary.title': 'Kredi özeti',
  'loan.summary.loading': 'Kredi özeti yükleniyor…',
  'loan.summary.remainingPrincipal': 'Kalan anapara',
  'loan.summary.installments': 'Ödenen / Kalan taksit',
  'loan.summary.installmentsValue': '{paid}/{total}',
  'loan.summary.installmentsNote': '{count} taksit kaldı',
  'loan.summary.nextPayment': 'Sonraki taksit',
  'loan.summary.nextPaymentNote': '{date} · {days} gün kaldı',
  'loan.summary.nextPaymentToday': '{date} · Bugün',
  'loan.summary.paidOff': 'Kredi kapandı',
  'loan.summary.monthlyPayment': 'Aylık taksit',
  'loan.summary.rateNote': 'Aylık faiz: {rate}',
  'loan.summary.totalRemaining': 'Toplam kalan ödeme',
  'loan.summary.interestAndTaxes': 'Toplam faiz + vergi',
  'loan.summary.interestAndTaxesNote': 'Kredinin tamamında: {amount}',
  'loan.summary.noValue': '—',

  // Bakiyeyi eşitleme
  'loan.sync.action': 'Bakiyeyi kalan anaparaya eşitle',
  'loan.sync.title': 'Bakiyeyi eşitle',
  'loan.sync.message':
    'Hesap bakiyesi {current}; ödeme planına göre kalan anapara {target}. Aradaki {change} fark bugün tarihli bir düzeltme işlemi olarak eklensin mi?',
  'loan.sync.confirm': 'Eşitle',
  'loan.sync.inSync': 'Bakiye kalan anaparayla aynı',
  'loan.sync.note': 'Ödeme planına göre bakiye',

  // Bilgi yokken
  'loan.empty.title': 'Kredi bilgileri girilmedi',
  'loan.empty.description':
    'Çekilen tutarı, aylık faizi, vadeyi ve ilk taksit tarihini girin; kalan anapara, sonraki taksit ve ödeme planı burada görünsün.',
  'loan.empty.action': 'Kredi bilgilerini gir',

  // Ödeme planı
  'loan.schedule.title': 'Ödeme planı',
  'loan.schedule.show': 'Ödeme planını göster',
  'loan.schedule.hide': 'Ödeme planını gizle',
  'loan.schedule.n': 'Taksit no',
  'loan.schedule.date': 'Tarih',
  'loan.schedule.payment': 'Taksit',
  'loan.schedule.principal': 'Anapara',
  'loan.schedule.interest': 'Faiz',
  'loan.schedule.kkdf': 'KKDF',
  'loan.schedule.bsmv': 'BSMV',
  'loan.schedule.balance': 'Kalan anapara',
  'loan.schedule.paid': 'Ödendi',
} as const;

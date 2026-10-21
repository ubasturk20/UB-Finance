// Kredi kartı takibi: kart bilgileri, ekstre özeti, taksitli alışverişler.
export const creditCards = {
  // Hesap düzenleme penceresindeki bölüm
  'card.details.title': 'Kart bilgileri',
  'card.details.hint':
    'Limit, ekstre ve asgari ödeme hesapları için. Boş bıraktığınız alanlar kullanılmaz.',
  'card.details.limit': 'Limit',
  'card.details.statementDay': 'Hesap kesim günü',
  'card.details.dueDay': 'Son ödeme günü',
  'card.details.dayHint': "Ayın 1-31'i; kısa aylarda ayın son günü",
  'card.details.minRate': 'Asgari ödeme oranı (%)',
  'card.details.interestRate': 'Aylık faiz oranı (%)',
  'card.details.ratePlaceholder': 'ör. 20',
  'card.details.interestPlaceholder': 'ör. 4,25',
  'card.details.badDay': '1 ile 31 arasında bir gün yazın.',
  'card.details.badPercent': '0 ile 100 arasında bir oran yazın (ör. 20 ya da 4,25).',
  'card.details.saveError': 'Kart bilgileri kaydedilemedi.',

  // Hesap sayfasındaki özet
  'card.summary.title': 'Kart özeti',
  'card.summary.limit': 'Limit',
  'card.summary.used': 'Kullanılan',
  'card.summary.available': 'Kullanılabilir limit',
  'card.summary.statementDebt': 'Son ekstre borcu',
  'card.summary.minimumPayment': 'Asgari ödeme',
  'card.summary.dueDate': 'Son ödeme tarihi',
  'card.summary.installmentDebt': 'Kalan taksit borcu',
  'card.summary.noValue': '—',
  'card.summary.daysLeft': '{days} gün kaldı',
  'card.summary.dueToday': 'Bugün',
  'card.summary.overdue': 'Gecikti',
  'card.summary.paid': 'Ödendi',
  'card.summary.remaining': 'Ödemelerden sonra kalan: {amount}',
  'card.summary.statementOn': 'Kesim: {date}',
  'card.summary.overLimit': 'Limit aşıldı',
  'card.summary.interest': 'Aylık faiz: {rate}',
  'card.summary.noStatementDay': 'Kesim günü girilmedi',
  'card.summary.loading': 'Kart özeti yükleniyor…',
  'card.empty.title': 'Kart bilgileri girilmedi',
  'card.empty.description':
    'Limit, hesap kesim ve son ödeme günlerini girin; kullanılabilir limit, ekstre borcu ve asgari ödeme burada görünsün.',
  'card.empty.action': 'Kart bilgilerini gir',

  // Taksitler
  'card.installments.title': 'Taksitler',
  'card.installments.add': 'Taksitli alışveriş ekle',
  'card.installments.empty': 'Taksitli alışveriş yok.',
  'card.installments.progress': '{current}/{count} taksit',
  'card.installments.notStarted': 'İlk taksit {month}',
  'card.installments.perMonth': 'Aylık {amount}',
  'card.installments.remaining': 'Kalan {amount}',
  'card.installments.finished': 'Tamamlandı',
  'card.installments.delete': 'Taksiti sil',
  'card.installments.deleteAria': '{name} taksitini sil',
  'card.installments.deleteConfirm':
    '"{name}" taksit planı silinsin mi? Karta işlenmiş harcama silinmez.',

  // Taksitli alışveriş penceresi
  'card.installmentForm.title': 'Taksitli alışveriş ekle',
  'card.installmentForm.description': 'Açıklama',
  'card.installmentForm.descriptionPlaceholder': 'ör. Buzdolabı',
  'card.installmentForm.total': 'Toplam tutar',
  'card.installmentForm.count': 'Taksit sayısı',
  'card.installmentForm.countOption': '{count} taksit',
  'card.installmentForm.firstMonth': 'İlk taksit ayı',
  'card.installmentForm.firstMonthHint': 'İlk taksidin geleceği ekstrenin ayı',
  'card.installmentForm.date': 'Alışveriş tarihi',
  'card.installmentForm.record': 'Harcamayı da karta işle',
  'card.installmentForm.recordHint':
    'Toplam tutar karta tek bir işlem olarak eklenir; ekstreye ise yalnızca taksitler yansır.',
  'card.installmentForm.preview': '{count} × {amount}',
  'card.installmentForm.error': 'Taksit eklenemedi.',
} as const;

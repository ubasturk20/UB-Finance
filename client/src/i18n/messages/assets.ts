// Miktarla izlenen varlıklar (altın, döviz, fon, hisse, kripto) ve net değerin karşılıkları.
export const assets = {
  // Hesap düzenleme penceresindeki bölüm
  'asset.details.title': 'Miktar bilgileri',
  'asset.details.hint':
    'Altın, döviz, fon, hisse veya kripto gibi adetle tutulan varlıklar için. Birim fiyatını hesap sayfasından güncelleyince bakiye miktar × fiyat olur.',
  'asset.details.quantity': 'Miktar',
  'asset.details.quantityPlaceholder': 'ör. 12,5',
  'asset.details.badQuantity':
    'En çok 8 ondalıklı, sıfır veya daha büyük bir sayı yazın (ör. 12,5).',
  'asset.details.unit': 'Birim',
  'asset.details.unitPlaceholder': 'ör. gram altın',
  'asset.details.badUnit': 'Birim en çok 20 karakter olabilir.',
  'asset.details.saveError': 'Miktar bilgileri kaydedilemedi.',

  // Hesap sayfasındaki özet
  'asset.summary.title': 'Varlık özeti',
  'asset.summary.loading': 'Varlık özeti yükleniyor…',
  'asset.summary.equation': '{quantity} {unit} × {price} = {value}',
  'asset.summary.noPrice': '{quantity} {unit} · birim fiyatı girilmedi',
  'asset.summary.priceDate': 'Fiyat tarihi: {date}',
  'asset.summary.differs': 'Bakiye bu değerden farklı: {balance}',
  'asset.summary.updatePrice': 'Birim fiyatını güncelle',
  'asset.summary.editQuantity': 'Miktarı düzenle',

  // Bilgi yokken
  'asset.empty.title': 'Miktar girilmedi',
  'asset.empty.description':
    'Elinizdeki miktarı ve birimini (ör. 10 gram altın, 250 pay) girin; birim fiyatını güncelledikçe hesabın değeri kendiliğinden hesaplansın.',
  'asset.empty.action': 'Miktarı gir',

  // Birim fiyatı penceresi
  'asset.price.title': 'Birim fiyatını güncelle',
  'asset.price.unitPrice': 'Birim fiyatı ({unit})',
  'asset.price.date': 'Fiyat tarihi',
  'asset.price.newValue': 'Yeni değer',
  'asset.price.change': 'Fark',
  'asset.price.noChange': 'Bakiye zaten bu değerde; düzeltme eklenmez.',
  'asset.price.addsCorrection': 'Fark, bu tarihli bir düzeltme işlemi olarak eklenir.',
  'asset.price.save': 'Güncelle',
  'asset.price.error': 'Birim fiyatı kaydedilemedi.',

  // Net değerin karşılıkları
  'asset.equiv.label': 'Net değerin karşılıkları',
  'asset.equiv.currency': '≈ {amount}',
  'asset.equiv.gold': '≈ {grams} gram altın',
  'asset.equiv.rateTitle': '{date} tarihli kurla',
  'asset.equiv.goldTitle': '{account} hesabındaki {date} tarihli gram fiyatıyla',
} as const;

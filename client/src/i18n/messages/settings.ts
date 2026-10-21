// The Settings page and its tabs.
export const settings = {
  // Page and tabs (the ?tab= values in the URL stay English)
  'settings.title': 'Ayarlar',
  'settings.tab.categories': 'Kategoriler',
  'settings.tab.accounts': 'Hesaplar',
  'settings.tab.connections': 'Bağlı Bankalar',
  'settings.tab.currencies': 'Para Birimleri',
  'settings.tab.data': 'Veriler',
  'settings.tab.preferences': 'Tercihler',
  'settings.tab.server': 'Sunucu',
  'settings.footer.licenseBefore': 'UB-Finance,',
  'settings.footer.licenseAfter': 'lisansıyla dağıtılan özgür bir yazılımdır.',
  'settings.footer.sourceCode': 'Kaynak kodu',

  // Preferences
  'settings.prefs.savedDemo': 'Demoyu denerken ayarlar bu sekmede tutulur.',
  'settings.prefs.savedBrowser': 'Ayarlar tarayıcınıza otomatik olarak kaydedilir.',
  'settings.prefs.reset': 'Varsayılanlara dön',
  'settings.prefs.resetTitle': 'Tercihleri sıfırla',
  'settings.prefs.resetMessage':
    'Tüm tercihleri varsayılan değerlerine döndürmek istediğinizden emin misiniz?',
  'settings.prefs.resetConfirm': 'Sıfırla',
  'settings.prefs.theme': 'Tema',
  'settings.prefs.theme.light': 'Açık',
  'settings.prefs.theme.dark': 'Koyu',
  'settings.prefs.theme.system': 'Sistem',
  'settings.prefs.sidebar': 'Kenar çubuğu',
  'settings.prefs.sidebar.pinned': 'Sabit',
  'settings.prefs.sidebar.pinnedHint': 'Her zaman açık',
  'settings.prefs.sidebar.autoHide': 'Otomatik gizle',
  'settings.prefs.sidebar.autoHideHint': 'Daraltılmış, üzerine gelince açılır',
  'settings.prefs.icons': 'Simgeler',
  'settings.prefs.icons.payee': 'Alıcı',
  'settings.prefs.icons.payeeHint': 'Alıcı adlarının yanında logoları (ya da renkli baş harfleri)',
  'settings.prefs.icons.category': 'Kategori',
  'settings.prefs.icons.categoryHint': 'Kategori adlarının yanında emoji simgeleri',
  'settings.prefs.icons.account': 'Hesap',
  'settings.prefs.icons.accountHint':
    'Hesap adlarının yanında logoları (ya da renkli baş harfleri)',
  'settings.prefs.show': 'Göster',
  'settings.prefs.hide': 'Gizle',
  'settings.prefs.amounts': 'Tutarlar',
  'settings.prefs.amountsHint':
    'Tutarların bu cihazda nasıl gösterildiği ve yazıldığı. Otomatik, Türkçe yazımı izler. ' +
    'Her zaman 12,50 ya da 12.50 yazabilirsiniz.',
  'settings.prefs.numberFormat': 'Sayı biçimi',
  'settings.prefs.currencySymbol': 'Para birimi simgesi',
  'settings.prefs.currencySymbolPosition': 'Para birimi simgesinin yeri',
  'settings.prefs.position.before': 'Önde',
  'settings.prefs.position.after': 'Sonda',
  'settings.prefs.symbolHintBudgetBefore':
    'Otomatik, {currency} para birimini kendi ülkesinde yazıldığı gibi yazar. Diğer para ' +
    'birimlerinin simgeleri',
  'settings.prefs.symbolHintBudgetAfter': 'sekmesindedir.',
  'settings.prefs.symbolHintLegacyBefore':
    'En çok 3 karakter (ör. ₺, $, €, TL). Ya da bütçenizin para birimini',
  'settings.prefs.symbolHintLegacyAfter': 'sekmesinden seçin.',
  'settings.prefs.example': 'Örnek:',
  'settings.prefs.dateFormat': 'Tarih biçimi',

  // Data (export, backup, restore)
  'settings.data.title': 'Verileri dışa aktar',
  'settings.data.intro': 'Verilerinizi yedek ya da analiz için indirin.',
  'settings.data.exportTitle': 'İşlemleri dışa aktar',
  'settings.data.exportHint':
    'Tüm işlemleri CSV dosyası olarak indirin. İsterseniz tarih aralığıyla süzün.',
  'settings.data.formatBefore': 'Tutarlar,',
  'settings.data.formatAfterComma':
    'bölümündeki sayı biçiminize göre -12,50 gibi ve sütunlar arasında noktalı virgülle ' +
    'yazılır. Rapor dışa aktarmaları da aynı ayırıcıyı kullanır.',
  'settings.data.formatAfterDot':
    'bölümündeki sayı biçiminize göre -12.50 gibi ve sütunlar arasında virgülle yazılır. ' +
    'Rapor dışa aktarmaları da aynı ayırıcıyı kullanır.',
  'settings.data.from': 'Başlangıç',
  'settings.data.to': 'Bitiş',
  'settings.data.downloadCsv': 'CSV indir',
  'settings.data.backupTitle': 'Tam yedek',
  'settings.data.backupHint':
    'Tüm verilerinizin eksiksiz bir JSON yedeğini indirin: hesaplar, işlemler, bütçeler, ' +
    'kategoriler, alıcılar, kurallar, düzenli işlemler, hedefler, raporlar ve panolar. Banka ' +
    'bağlantılarının kimlik bilgileri dahil edilmez.',
  'settings.data.downloadBackup': 'Yedeği indir',
  'settings.data.restoreTitle': 'Yedekten geri yükle',
  'settings.data.restoreHint':
    'Tüm verilerinizi bir yedek dosyasıyla değiştirin. Önce mevcut verilerinizin bir kopyası ' +
    'kaydedilir.',
  'settings.data.backupFile': 'Yedek dosyası',
  'settings.data.restoring': 'Geri yükleniyor…',
  'settings.data.restoreButton': 'Yedeği geri yükle…',
  'settings.data.notBackup': '{name} bir UB-Finance yedek dosyası değil.',
  'settings.data.restored': '{name} geri yüklendi ({count} işlem).',
  'settings.data.safetyCopy': 'Önceki verileriniz veritabanının yanına {file} adıyla kaydedildi.',
  'settings.data.restoreFailed': 'Geri yükleme başarısız oldu',
  'settings.data.confirmTitle': 'Bu yedek geri yüklensin mi?',
  'settings.data.confirmMessage':
    'Tüm mevcut verileriniz {name} içeriğiyle değiştirilecek. Banka bağlantıları bağlı kalır.',
  'settings.data.theBackup': 'yedeğin',
  'settings.data.confirmLabel': 'Verilerimi değiştir',
  'settings.data.encryptedButton': 'Parolalı yedek indir…',
  'settings.data.encryptedTitle': 'Parolalı yedek',
  'settings.data.encryptedHint':
    'Yedek bu tarayıcıda parolanızla şifrelenir; dosyayı parola olmadan kimse okuyamaz. ' +
    'Bulut ya da USB bellek gibi başka bir yerde saklayacağınız yedekler için kullanın.',
  'settings.data.encryptedWarning': 'Parolayı unutursanız bu yedek açılamaz.',
  'settings.data.backupPassword': 'Yedek parolası',
  'settings.data.backupPasswordAgain': 'Yedek parolası (tekrar)',
  'settings.data.passwordTooShort': 'Parola en az {min} karakter olmalı.',
  'settings.data.passwordMismatch': 'Parolalar eşleşmiyor.',
  'settings.data.encrypting': 'Şifreleniyor…',
  'settings.data.encryptedDownload': 'Şifrele ve indir',
  'settings.data.encryptedSaved': 'Parolalı yedek {file} olarak indirildi.',
  'settings.data.encryptFailed': 'Parolalı yedek oluşturulamadı.',
  'settings.data.cryptoUnavailable':
    'Parolalı yedekler yalnızca HTTPS bağlantısında ya da bu bilgisayardan (localhost) açılan ' +
    'uygulamada kullanılabilir. Tarayıcılar şifreleme araçlarını düz HTTP üzerinde sunmaz.',
  'settings.data.unlockTitle': 'Parolalı yedeği aç',
  'settings.data.unlockMessage':
    '{name} parolayla şifrelenmiş. Açmak için yedeğin parolasını girin.',
  'settings.data.unlockButton': 'Yedeği aç',
  'settings.data.unlocking': 'Açılıyor…',
  'settings.data.wrongPassword': 'Parola yanlış ya da dosya bozulmuş.',

  // Account order
  'settings.accounts.empty': 'Henüz hesap yok. Hesaplar sayfasından ekleyin.',
  'settings.accounts.title': 'Hesap sırası',
  'settings.accounts.hint': 'Kenar çubuğundaki hesapları sürükleyerek sıralayın.',
  'settings.accounts.drag': 'Sıralamak için sürükleyin',
  'settings.accounts.onBudget': 'Bütçedeki',
  'settings.accounts.offBudget': 'Bütçe dışı',

  // Categories
  'settings.categories.income': 'Gelir',
  'settings.categories.expenses': 'Gider',
  'settings.categories.dragCategory': '{name}: sıralamak için sürükleyin',
  'settings.categories.editCategory': '{name} kategorisini düzenle',
  'settings.categories.dragGroup': 'Grubu sıralamak için sürükleyin',
  'settings.categories.noCategories': 'Henüz kategori yok.',
  'settings.categories.pickIcon': 'Simge seç',
  'settings.categories.namePlaceholder': 'Kategori adı…',
  'settings.categories.addCategory': 'Kategori ekle',
  'settings.categories.createCategory': 'Kategori oluştur',
  'settings.categories.createGroup': 'Grup oluştur',
  'settings.categories.groupPlaceholder': 'Grup adı…',
  'settings.categories.addGroup': 'Grup ekle',
  'settings.categories.noGroups': 'Henüz grup yok.',
  'settings.categories.deleteGroupTitle': 'Grubu sil',
  'settings.categories.deleteGroupMessage':
    '"{name}" grubu ve tüm kategorileri silinsin mi? Bu işlem geri alınamaz.',
  'settings.categories.deleteCategoryTitle': 'Kategoriyi sil',
  'settings.categories.deleteCategoryMessage': '"{name}" silinsin mi? Bu işlem geri alınamaz.',
  'settings.categories.hasTransactions': 'kategorisinde',
  'settings.categories.chooseTarget':
    'işlem var. Silmeden önce bu işlemlerin taşınacağı kategoriyi seçin.',
  'settings.categories.budgetRemoved': 'Bu kategorinin planlanan tutarları kaldırılacak.',
  'settings.categories.moveTo': 'İşlemlerin taşınacağı kategori',
  'settings.categories.selectCategory': 'Bir kategori seçin…',
  'settings.categories.reassign': 'Taşı ve sil',
  'settings.categories.editTitle': 'Kategoriyi düzenle',
  'settings.categories.iconAndName': 'Simge ve ad',
  'settings.categories.changeIcon': 'Simgeyi değiştir',
  'settings.categories.name': 'Kategori adı',
  'settings.categories.group': 'Grup',
  'settings.categories.budgetType': 'Bütçe türü',
  'settings.categories.type.fixed': 'Sabit',
  'settings.categories.type.fixedHint': 'Her ay tutarlı, öngörülebilir bir tutar',
  'settings.categories.type.flexible': 'Esnek',
  'settings.categories.type.flexibleHint': 'Aydan aya değişen harcamalar',
  'settings.categories.type.nonMonthly': 'Aylık olmayan',
  'settings.categories.type.nonMonthlyHint': 'Dönemsel ya da düzensiz giderler',
  'settings.categories.type.savings': 'Birikim/Yatırım',
  'settings.categories.type.savingsHint': 'Birikim hedefleri ve yatırım katkıları',

  // Currencies
  'settings.currency.error': 'Bir şeyler ters gitti. Tekrar deneyin.',
  'settings.currency.intro':
    'Bütçenizin tek bir para birimi vardır. Hesapların her biri kendi para biriminde ' +
    'olabilir: tutarları o para biriminde kalır, bütçe ve raporlar ise bunları her günün ' +
    'döviz kuruyla sizin para biriminizde sayar.',
  'settings.currency.howItWorks': 'Para birimleri nasıl çalışır',
  'settings.currency.budgetCurrency': 'Bütçe para birimi',
  'settings.currency.budgetCurrencyHint':
    'Bütçenizin, raporlarınızın ve net değerinizin sayıldığı para birimi. Başka para ' +
    'birimindeki hiçbir hesapta işlem yokken düzeltilebilir.',
  'settings.currency.chooseHint':
    'Tutarlarınızın para birimini seçin. Hiçbir şey dönüştürülmez: yalnızca para biriminin ' +
    'adı belirlenir, böylece başka para birimlerinde hesaplar eklenebilir.',
  'settings.currency.change': 'Değiştir',
  'settings.currency.use': 'Bu para birimini kullan',
  'settings.currency.valuesIn': '{currency} cinsinden değerler',
  'settings.currency.missing':
    '{currencies} cinsinden {count} işlemin günü için henüz döviz kuru yok; bu yüzden bütçe ' +
    'bunları sıfır sayıyor. Aşağıya bir kur ekleyin ya da kur indirmeyi açın.',
  'settings.currency.allValued':
    'Başka para birimindeki her işlemin {currency} cinsinden değeri var. Bir kur değişince ' +
    'değerler olduğu gibi kalır; bir kuru düzelttikten sonra yeniden hesaplayın.',
  'settings.currency.recalculate': 'Kurlardan yeniden hesapla',
  'settings.currency.updated': '{count} değer güncellendi.',
  'settings.currency.nothingToUpdate': 'Güncellenecek bir şey yok.',
  'settings.currency.typedStay': 'Elle girdiğiniz değerler korunur.',
  'settings.currency.exchangeRates': 'Döviz kurları',
  'settings.currency.ratesHint':
    'Kuru olmayan bir gün, en çok bir ay geriye kadar en yakın önceki kuru kullanır. Elle ' +
    'girdiğiniz kur, o gün için indirilen kurdan önce gelir.',
  'settings.currency.sourceManual': 'elle girildi',
  'settings.currency.sourceEcb': 'AMB',
  'settings.currency.noRecentRate': 'Son bir ayda kur yok',
  'settings.currency.currency': 'Para birimi',
  'settings.currency.day': 'Gün',
  'settings.currency.rateIn': '{budget} cinsinden 1 {currency}',
  'settings.currency.addRate': 'Kur ekle',
  'settings.currency.invalidRate': 'Kuru 1,0812 gibi pozitif bir sayı olarak yazın.',
  'settings.currency.typedRates': 'Elle girdiğiniz kurlar',
  'settings.currency.deleteRate': '{currency} için {date} tarihli kuru sil',
  'settings.currency.download': 'Kurları indir',
  'settings.currency.downloadHint':
    "Avrupa Merkez Bankası'nın (AMB) günlük referans kurları, {host} üzerinden (Frankfurter, " +
    'açık kaynak). Yalnızca para birimi kodları ve tarihler gönderilir, bütçenizle ilgili ' +
    'hiçbir şey gönderilmez. Siz açana kadar kapalıdır; açınca birkaç saatte bir denetler.',
  'settings.currency.ratesServer': 'kur sunucusu',
  'settings.currency.notInDemo': 'Demoda kullanılamaz: kurlar yukarıdan elle girilebilir.',
  'settings.currency.downloadEcb': 'AMB referans kurlarını indir',
  'settings.currency.downloading': 'İndiriliyor…',
  'settings.currency.downloadNow': 'Şimdi indir',
  'settings.currency.lastDownloaded': 'Son indirme: {date}',
  'settings.currency.notDownloaded': 'Henüz indirilmedi',
  'settings.currency.unsupported': ". AMB'nin {currencies} için kuru yok: bunları elle girin.",
  'settings.currency.serverLabel': 'Sunucu (isteğe bağlı, kendi Frankfurter sunucunuz için)',
  'settings.currency.saveServer': 'Sunucuyu kaydet',
  'settings.currency.display': 'Tutarların yazılışı',
  'settings.currency.displayHint':
    'Bu cihazda. Otomatik, her para birimini kendi ülkesindeki gibi yazar: 1 234,56 zł, ' +
    "$1,234.56, CHF 1'234.56 (sayı biçimi Tercihler'dedir). {budget} simgesinin yeri " +
    "Tercihler'deki ayardır.",
  'settings.currency.symbol': '{currency} simgesi',
  'settings.currency.symbolPosition': '{currency} simgesinin yeri',
  'settings.currency.automaticSide': 'Otomatik ({side})',
  'settings.currency.side.before': 'önde',
  'settings.currency.side.after': 'sonda',

  // Server
  'settings.server.whereData': 'Verileriniz nerede',
  'settings.server.demoTitle': 'Bu tarayıcıda (demo)',
  'settings.server.demoBody':
    'Bu demo tamamen tarayıcınızda çalışır: değiştirdiğiniz hiçbir şey bir yere gönderilmez ' +
    'ya da kaydedilmez. Uygulamada bütçeniz, bilgisayarınızda ya da kendi çalıştırdığınız ' +
    'bir sunucuda duran bir dosyadır.',
  'settings.server.onComputer': 'Bu bilgisayarda',
  'settings.server.onComputerBody':
    'Bütçeniz bu bilgisayardaki bir dosyadır ve UB-Finance ona yalnızca kendi yerel sunucusu ' +
    'üzerinden erişir. Hiçbir şey UB-Finance geliştiricilerine ya da başka birine gönderilmez; ' +
    'banka senkronu yalnızca bir banka bağladığınızda Plaid, SimpleFIN ya da Enable Banking ' +
    'ile iletişim kurar.',
  'settings.server.version': 'Sürüm {version}',
  'settings.server.otherDevices': 'Telefonunuzda ve diğer cihazlarınızda kullanın',
  'settings.server.otherDevicesBody':
    "UB-Finance'ı ev sunucusu ya da küçük bir bulut makinesi gibi denetiminizdeki bir " +
    'sunucuda çalıştırın ve herhangi bir tarayıcıdan giriş yapın. Verileriniz o sunucuya ' +
    'taşınır; başka kimse barındırmaz.',
  'settings.server.guide': 'Sunucu kurulum kılavuzunu oku',
  'settings.server.backupFirst': 'Önce yedek al',
  'settings.server.offlineCopy': 'Çevrimdışı kopya',
  'settings.server.keepCopy': 'Bütçemin bir kopyasını bu cihazda tut',
  'settings.server.keepCopyHint':
    'UB-Finance sunucusuna ulaşamadığında, bu tarayıcının en son yüklediği verilerle açılır. ' +
    'Her şeye göz atabilir ve yeni işlem ekleyebilirsiniz; bağlantı geri gelince gönderilir. ' +
    'Kopya, çıkış yaptığınızda silinir. Ortak kullanılan bir bilgisayarda bunu kapatın.',
  'settings.server.waiting': 'Bu cihaza kaydedilen {count} işlem gönderilmeyi bekliyor.',
  'settings.server.check.https': 'Bağlantı şifreli (HTTPS)',
  'settings.server.check.sameComputer': 'Sunucuyla aynı bilgisayardan bağlanıldı',
  'settings.server.check.noHttps':
    'HTTPS kullanılmıyor: parolalar ve veriler şifrelenmeden iletiliyor',
  'settings.server.check.noHttpsFixBefore':
    "UB-Finance'ı HTTPS kullanan bir ters vekil sunucunun (Caddy, Nginx, Traefik) ya da bir " +
    "VPN'in arkasına koyun ve",
  'settings.server.check.setVariable': 'değişkenini ayarlayın.',
  'settings.server.check.proxyOk': 'Ters vekil ayarları bağlanma şeklinize uyuyor',
  'settings.server.check.untrustedProxy':
    "UB-Finance'ın önünde bir ters vekil var ama güvenilir olarak ayarlanmamış",
  'settings.server.check.untrustedProxyFix':
    "(UB-Finance'ın önündeki vekil sayısı) değerini ayarlayın; böylece HTTPS ve istemci " +
    'adresleri algılanır.',
  'settings.server.check.unexpectedProxy':
    'FLYBUDGET_TRUST_PROXY ayarlı ama bu istek bir vekil olmadan geldi',
  'settings.server.check.unexpectedProxyBefore': 'Doğrudan bağlanıyorsanız',
  'settings.server.check.unexpectedProxyAfter':
    'değişkenini kaldırın: yoksa istemciler adreslerini taklit edip giriş denemesi sınırını ' +
    'aşabilir.',
  'settings.server.check.hostsOk': 'Yalnızca izin verdiğiniz adreslere yanıt veriyor',
  'settings.server.check.anyHost': 'Her ana bilgisayar adına yanıt veriyor',
  'settings.server.check.anyHostFix': 'değişkenini kullandığınız adrese ayarlayın, ör.',
  'settings.server.check.encrypted': 'Banka kimlik bilgileri depoda şifreli',
  'settings.server.check.notEncrypted': 'Banka kimlik bilgileri şifreli değil',
  'settings.server.check.notEncryptedFix':
    'değişkenini rastgele bir anahtar içeren bir dosyaya ayarlayın (sunucu kurulum ' +
    'kılavuzuna bakın).',
  'settings.server.check.password': 'Bu sunucu bir parolayla korunuyor',
  'settings.server.check.noPassword': 'Henüz parola belirlenmedi',
  'settings.server.securityCheck': 'Güvenlik denetimi',
  'settings.server.checking': 'Sunucunuz denetleniyor…',
  'settings.server.allGood': 'Az önceki bağlantı şeklinize göre her şey yolunda görünüyor.',
  'settings.server.warnings':
    '{count} konuya bakmanız gerekiyor. Her biri docker-compose.yml dosyanızdaki bir ayarla ' +
    'düzeltilir.',
  'settings.server.versionSentence': 'Sürüm {version}.',
  'settings.server.passed': 'Geçti',
  'settings.server.warning': 'Uyarı',
  'settings.server.activeAndSignedIn': 'Son etkinlik {active} · giriş {signedIn}',
  'settings.server.signedIn': 'Giriş {signedIn}',
  'settings.server.devices': 'Giriş yapılmış cihazlar',
  'settings.server.devicesHint':
    'Bu sunucuda oturumu açık tarayıcılar. Tanımadığınız cihazlardan çıkış yaptırın, ardından ' +
    'parolayı değiştirin.',
  'settings.server.devicesError': 'Cihazlar yüklenemedi.',
  'settings.server.thisDevice': 'Bu cihaz',
  'settings.server.signOutDevice': '{name}: çıkış yaptır',
  'settings.server.signOutDeviceButton': 'Çıkış yaptır',
  'settings.server.signOutOthers': 'Diğer tüm cihazlardan çıkış yap',
  'settings.server.minLength': 'En az {count} karakter kullanın.',
  'settings.server.mismatch': 'Yeni parolalar eşleşmiyor.',
  'settings.server.passwordChanged': 'Parola değiştirildi. Diğer cihazlarda oturum kapatıldı.',
  'settings.server.changePassword': 'Parolayı değiştir',
  'settings.server.changePasswordHint':
    'Bu parola UB-Finance sunucunuzu korur. Değiştirmek, diğer tüm cihazlarda oturumu kapatır.',
  'settings.server.currentPassword': 'Mevcut parola',
  'settings.server.newPassword': 'Yeni parola',
  'settings.server.confirmPassword': 'Yeni parolayı onayla',
  'settings.server.signOut': 'Çıkış yap',
  'settings.server.signOutHint': 'Bu tarayıcıda UB-Finance oturumunu kapatın.',

  // Connected banks
  'settings.banks.intro': 'İşlemleri bankalarınızdan otomatik olarak içe aktarın.',
  'settings.banks.europeanBanks': 'Avrupa bankaları',
  'settings.banks.syncComplete':
    '{provider} senkronu tamamlandı: {count} yeni işlem içe aktarıldı.',
  'settings.banks.addAnotherBank': 'Başka bir banka ekle',
  'settings.banks.addAnotherConnection': 'Başka bir bağlantı ekle',
  'settings.banks.syncing': 'Senkronize ediliyor…',
  'settings.banks.syncAll': 'Tümünü senkronize et',
  'settings.banks.noneConnected': '{provider} ile bağlanmış banka henüz yok.',
  'settings.banks.connectBank': 'Banka bağla',
  'settings.banks.configuration': '{provider} yapılandırması',
  'settings.banks.plaidHint':
    'Banka bağlantılarını etkinleştirmek için Plaid API kimlik bilgilerinizi girin.',
  'settings.banks.simplefinHint':
    'Banka bağlantılarını etkinleştirmek için SimpleFIN kurulum belirtecinizi girin.',
  'settings.banks.enableBankingIntro':
    'PSD2 üzerinden Avrupa bankaları (AEA). Kendi hesaplarınız için, kendi Enable Banking ' +
    'uygulamanızla ücretsiz.',
  'settings.banks.enableBankingApp': 'Enable Banking uygulaması',
} as const;

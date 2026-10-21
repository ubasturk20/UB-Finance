import { count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from './index.js';
import { categoryGroups, categories, transactions } from './schema.js';

type BudgetType = 'fixed' | 'flexible' | 'non_monthly' | 'savings';

// Personal-finance categories for Turkey (UB-Finance). Names are only a starting point:
// people rename, add and delete them in Settings.
const defaultGroups: {
  name: string;
  isIncome: number;
  categories: { name: string; icon: string; budgetType?: BudgetType }[];
}[] = [
  {
    name: 'Gelir',
    isIncome: 1,
    categories: [
      { name: 'Maaş', icon: '💵' },
      { name: 'Ek gelir', icon: '💼' },
      { name: 'Faiz ve getiri', icon: '💹' },
      { name: 'Kira geliri', icon: '🏘️' },
      { name: 'Diğer gelir', icon: '💰' },
    ],
  },
  {
    name: 'Konut',
    isIncome: 0,
    categories: [
      { name: 'Kira', icon: '🏠', budgetType: 'fixed' },
      { name: 'Aidat', icon: '🏢', budgetType: 'fixed' },
      { name: 'Konut kredisi taksidi', icon: '🏦', budgetType: 'fixed' },
      { name: 'Ev bakım ve onarım', icon: '🔨', budgetType: 'flexible' },
      { name: 'Ev eşyası', icon: '🛋️', budgetType: 'non_monthly' },
      { name: 'DASK ve konut sigortası', icon: '🛡️', budgetType: 'non_monthly' },
      { name: 'Emlak vergisi', icon: '🏛️', budgetType: 'non_monthly' },
    ],
  },
  {
    name: 'Faturalar',
    isIncome: 0,
    categories: [
      { name: 'Elektrik', icon: '⚡', budgetType: 'fixed' },
      { name: 'Su', icon: '💧', budgetType: 'fixed' },
      { name: 'Doğalgaz', icon: '🔥', budgetType: 'fixed' },
      { name: 'İnternet', icon: '🌐', budgetType: 'fixed' },
      { name: 'Cep telefonu', icon: '📱', budgetType: 'fixed' },
      { name: 'Dijital abonelikler', icon: '📺', budgetType: 'fixed' },
    ],
  },
  {
    name: 'Market ve yeme-içme',
    isIncome: 0,
    categories: [
      { name: 'Market alışverişi', icon: '🛒', budgetType: 'flexible' },
      { name: 'Restoran', icon: '🍽️', budgetType: 'flexible' },
      { name: 'Kafe', icon: '☕', budgetType: 'flexible' },
      { name: 'Paket servis', icon: '🛵', budgetType: 'flexible' },
    ],
  },
  {
    name: 'Ulaşım',
    isIncome: 0,
    categories: [
      { name: 'Akaryakıt', icon: '⛽', budgetType: 'flexible' },
      { name: 'Toplu taşıma', icon: '🚌', budgetType: 'flexible' },
      { name: 'Taksi', icon: '🚕', budgetType: 'flexible' },
      { name: 'Otopark', icon: '🅿️', budgetType: 'flexible' },
      { name: 'Köprü ve otoyol', icon: '🛣️', budgetType: 'flexible' },
      { name: 'Taşıt kredisi taksidi', icon: '🚗', budgetType: 'fixed' },
      { name: 'Kasko ve trafik sigortası', icon: '🛡️', budgetType: 'non_monthly' },
      { name: 'MTV', icon: '🏛️', budgetType: 'non_monthly' },
      { name: 'Araç bakımı', icon: '🔧', budgetType: 'non_monthly' },
    ],
  },
  {
    name: 'Sağlık',
    isIncome: 0,
    categories: [
      { name: 'Doktor ve hastane', icon: '🩺', budgetType: 'non_monthly' },
      { name: 'Eczane', icon: '💊', budgetType: 'flexible' },
      { name: 'Diş', icon: '🦷', budgetType: 'non_monthly' },
      { name: 'Spor salonu', icon: '🏋️', budgetType: 'flexible' },
      { name: 'Özel sağlık sigortası', icon: '🛡️', budgetType: 'fixed' },
    ],
  },
  {
    name: 'Eğitim ve çocuk',
    isIncome: 0,
    categories: [
      { name: 'Okul ve kurs', icon: '🎓', budgetType: 'non_monthly' },
      { name: 'Kitap ve kırtasiye', icon: '📚', budgetType: 'non_monthly' },
      { name: 'Çocuk bakımı', icon: '👶', budgetType: 'fixed' },
      { name: 'Çocuk harçlığı', icon: '🐷', budgetType: 'flexible' },
    ],
  },
  {
    name: 'Alışveriş ve kişisel',
    isIncome: 0,
    categories: [
      { name: 'Giyim', icon: '👔', budgetType: 'flexible' },
      { name: 'Elektronik', icon: '💻', budgetType: 'non_monthly' },
      { name: 'Kişisel bakım', icon: '✨', budgetType: 'flexible' },
      { name: 'Hediyeler', icon: '🎁', budgetType: 'non_monthly' },
    ],
  },
  {
    name: 'Eğlence ve seyahat',
    isIncome: 0,
    categories: [
      { name: 'Tatil', icon: '🏖️', budgetType: 'non_monthly' },
      { name: 'Bilet (uçak, otobüs)', icon: '✈️', budgetType: 'non_monthly' },
      { name: 'Etkinlik ve sinema', icon: '🎬', budgetType: 'flexible' },
      { name: 'Hobiler', icon: '🎨', budgetType: 'flexible' },
    ],
  },
  {
    name: 'Finans',
    isIncome: 0,
    categories: [
      { name: 'Birikim', icon: '🐷', budgetType: 'savings' },
      { name: 'Yatırım', icon: '📈', budgetType: 'savings' },
      { name: 'BES katkı payı', icon: '🧓', budgetType: 'savings' },
      { name: 'İhtiyaç kredisi taksidi', icon: '🏦', budgetType: 'fixed' },
      { name: 'Kart faiz ve ücretleri', icon: '💳', budgetType: 'flexible' },
      { name: 'Banka ücretleri', icon: '💸', budgetType: 'flexible' },
      { name: 'Vergi ve harçlar', icon: '🏛️', budgetType: 'non_monthly' },
    ],
  },
  {
    name: 'Bağış ve hediyeler',
    isIncome: 0,
    categories: [
      { name: 'Bağış', icon: '❤️', budgetType: 'flexible' },
      { name: 'Hediye', icon: '🤝', budgetType: 'flexible' },
    ],
  },
  {
    name: 'Diğer',
    isIncome: 0,
    categories: [
      { name: 'Çeşitli', icon: '📁', budgetType: 'flexible' },
      { name: 'Nakit çekim', icon: '💵', budgetType: 'flexible' },
    ],
  },
];

/**
 * Adds the default category groups to a new budget. Skips any budget that already
 * has categories or transactions, so a user who deleted the defaults and started
 * tracking their own way doesn't get them back on the next launch.
 * Returns the number of categories created.
 */
export function seedDefaultCategories(): number {
  const [{ groups }] = db.select({ groups: count() }).from(categoryGroups).all();
  const [{ txns }] = db.select({ txns: count() }).from(transactions).all();
  if (groups > 0 || txns > 0) return 0;

  let created = 0;
  db.transaction((tx) => {
    const now = new Date().toISOString();
    defaultGroups.forEach((group, groupIdx) => {
      const groupId = nanoid();
      tx.insert(categoryGroups)
        .values({
          id: groupId,
          name: group.name,
          isIncome: group.isIncome,
          sortOrder: groupIdx,
          createdAt: now,
        })
        .run();

      group.categories.forEach((cat, catIdx) => {
        tx.insert(categories)
          .values({
            id: nanoid(),
            groupId,
            name: cat.name,
            icon: cat.icon,
            budgetType: cat.budgetType ?? null,
            sortOrder: catIdx,
            createdAt: now,
          })
          .run();
        created++;
      });
    });
  });
  return created;
}

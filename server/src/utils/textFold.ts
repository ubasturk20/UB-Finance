// Text compared the way people search in Turkish: case, dotted/dotless i and accents don't
// matter, so "migros" finds "MİGROS", "MIGROS" and "Migros", and "sut" finds "Süt". Bank files
// often write Turkish names in plain ASCII capitals, so both spellings must meet.
// Identical copy in client/src/utils/textFold.ts (keep them in sync).

/** `s` lowercased the Turkish way, without accents, and with ı written as i */
export function foldText(s: string | null | undefined): string {
  return (s ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i');
}

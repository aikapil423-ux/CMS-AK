import type { FIRDocumentItem, FIRItem } from '@/types';

export function savedArrestForm(fir: FIRItem, accusedId: string): FIRDocumentItem | undefined {
  const index = fir.accusedList.findIndex((accused, i) => (accused.id || `${fir.id}-accused-${i + 1}`) === accusedId);
  if (index < 0) return;
  const accused = fir.accusedList[index];
  const name = accused.name.trim().toLowerCase().replace(/\s+/g, ' ');
  const sameNameCount = fir.accusedList.filter(person => person.name.trim().toLowerCase().replace(/\s+/g, ' ') === name).length;
  return fir.documents?.find(document => {
    const isArrestForm = document.documentType === 'IIF_III' || /^arrest_memo_26_8_1_/i.test(document.fileName);
    if (!isArrestForm) return false;
    if (document.arrestAccusedId) return document.arrestAccusedId === accusedId;
    // Older saved arrest memos carry the full accused name in their title.
    if (sameNameCount !== 1 || !name) return false;
    const titleName = document.title.split(' - ').slice(1).join(' - ').trim().toLowerCase().replace(/\s+/g, ' ');
    return titleName === name;
  });
}

export function iifIIIAccused(fir: FIRItem): FIRItem['accusedList'] {
  return (fir.accusedList || []).filter((person, index) => !!savedArrestForm(fir, person.id || `${fir.id}-accused-${index + 1}`));
}

export const SELLERS_LIST = [
  "L.S Mills",
  "Kalaimagal Textiles"
];

export const BUYERS_LIST = [
  "Indo Count Industries",
  "Creative Textile Mills",
  "Samy Traders",
  "G.S. Exports",
  "HYS Developers LLP"
];

export const calculateAgeing = (invoiceDateStr: string) => {
  if (!invoiceDateStr) return { noOfDays: 0, ageingBucket: '0-30 Days' as const };
  const invDate = new Date(invoiceDateStr);
  const today = new Date();
  const diffTime = today.getTime() - invDate.getTime();
  const noOfDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  let ageingBucket: '0-30 Days' | '31-60 Days' | '61-90 Days' | '>90 Days' = '0-30 Days';
  if (noOfDays > 90) ageingBucket = '>90 Days';
  else if (noOfDays > 60) ageingBucket = '61-90 Days';
  else if (noOfDays > 30) ageingBucket = '31-60 Days';
  return { noOfDays, ageingBucket };
};

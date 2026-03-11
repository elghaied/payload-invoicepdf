export const formatCurrency = (amount: number, currency: string): string => {
  return `${currency}${amount.toFixed(2).replace(/\B(?=(?:\d{3})+(?!\d))/g, ',')}`
}

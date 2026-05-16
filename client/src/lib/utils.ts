import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: string | Date | undefined) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function numberToWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  // Simple integer conversion for now
  const numStr = Math.floor(num).toString();

  if (num === 0) return "Zero";

  const convertGroup = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
    return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? convertGroup(n % 100) : "");
  };

  // Very basic implementation for the prototype
  // A robust solution would handle Indian Numbering System (Lakhs/Crores) correctly
  // For this mockup, we'll stick to a simple version or just return a placeholder if complex

  // Let's do a simple Indian system check
  let str = "";
  let n = Math.floor(num);

  // Crores
  if (n >= 10000000) {
    str += convertGroup(Math.floor(n / 10000000)) + "Crore ";
    n %= 10000000;
  }

  // Lakhs
  if (n >= 100000) {
    str += convertGroup(Math.floor(n / 100000)) + "Lakh ";
    n %= 100000;
  }

  // Thousands
  if (n >= 1000) {
    str += convertGroup(Math.floor(n / 1000)) + "Thousand ";
    n %= 1000;
  }

  // Hundreds
  if (n > 0) {
    str += convertGroup(n);
  }

  return (str + " Rupees Only").trim();
}

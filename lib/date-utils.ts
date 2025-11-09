/**
 * Utility functions for date formatting and localization
 */

// تبدیل تاریخ میلادی به جلالی (ساده - برای نمایش)
export function formatDate(date: Date | string | null | undefined, format: 'jalali' | 'gregorian' = 'jalali'): string {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return '-'
  
  if (format === 'jalali') {
    // استفاده از toLocaleDateString با locale فارسی
    return dateObj.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } else {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
}

// فرمت تاریخ و زمان
export function formatDateTime(date: Date | string | null | undefined, format: 'jalali' | 'gregorian' = 'jalali'): string {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return '-'
  
  if (format === 'jalali') {
    return dateObj.toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// فرمت عدد با جداکننده هزارگان
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return num.toLocaleString('fa-IR')
}

// فرمت قیمت (عدد + تومان)
export function formatPrice(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0 تومان'
  return `${num.toLocaleString('fa-IR')} تومان`
}

// تبدیل تاریخ جلالی به میلادی (برای محاسبات)
export function jalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number } {
  // الگوریتم تبدیل جلالی به میلادی
  const gy = jy <= 979 ? 621 : 1600
  const jy2 = jy <= 979 ? 0 : jy - 979
  const days = (365 * jy2) + Math.floor(jy2 / 33) * 8 + Math.floor((jy2 % 33 + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186)
  const gy2 = gy + 400 * Math.floor(days / 146097)
  const days2 = days % 146097
  const gy3 = gy2 + 100 * Math.floor(days2 / 36524)
  const days3 = days2 % 36524
  const gy4 = gy3 + 4 * Math.floor(days3 / 1461)
  const days4 = days3 % 1461
  const gy5 = gy4 + Math.floor((days4 + 3) / 365)
  const day = (days4 + 3) % 365
  const gm = Math.floor(day / 31)
  const gd = day % 31
  
  return {
    year: gy5,
    month: gm + 1,
    day: gd + 1
  }
}

// تبدیل تاریخ میلادی به جلالی (برای محاسبات)
export function gregorianToJalali(gy: number, gm: number, gd: number): { year: number; month: number; day: number } {
  // الگوریتم تبدیل میلادی به جلالی
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let jy = gy <= 1600 ? 0 : 979
  let gy2 = gy <= 1600 ? gy + 621 : gy
  let days = (365 * (gy2 - 1)) + Math.floor((gy2 - 1) / 4) - Math.floor((gy2 - 1) / 100) + Math.floor((gy2 - 1) / 400) + ((gy2 > 1600) ? (g_d_m[gm - 1] + gd) : 0) + 1600
  jy += 33 * Math.floor((days - 1) / 12053)
  days = ((days - 1) % 12053) + 1
  jy += 4 * Math.floor((days - 1) / 1461)
  days = ((days - 1) % 1461) + 1
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = ((days - 1) % 365) + 1
  }
  let jm = (days < 186) ? 1 + Math.floor((days - 1) / 31) : 7 + Math.floor((days - 186) / 30)
  let jd = 1 + ((days < 186) ? ((days - 1) % 31) : ((days - 186) % 30))
  
  return { year: jy, month: jm, day: jd }
}


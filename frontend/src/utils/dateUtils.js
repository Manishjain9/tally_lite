export const dateUtils = {
  today: () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  },

  yesterday: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  },

  getMonthStart: () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  },

  getMonthEnd: () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  },

  getYearStart: () => {
    return `${new Date().getFullYear()}-01-01`;
  },

  getYearEnd: () => {
    return `${new Date().getFullYear()}-12-31`;
  },

  getDaysAgo: (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  },

  formatDateForInput: (date) => {
    if (!date) return dateUtils.today();
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  isSameDay: (date1, date2) => {
    const d1 = new Date(date1).toISOString().split('T')[0];
    const d2 = new Date(date2).toISOString().split('T')[0];
    return d1 === d2;
  },

  isBeforeToday: (date) => {
    return new Date(date) < new Date().setHours(0, 0, 0, 0);
  },

  getMonthYear: () => {
    const d = new Date();
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  },
};

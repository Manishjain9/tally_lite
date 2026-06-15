const moment = require('moment');

const helpers = {
  formatDate: (date, format = 'YYYY-MM-DD') => {
    return moment(date).format(format);
  },

  getTodayDate: () => {
    return moment().format('YYYY-MM-DD');
  },

  getDateRange: (period) => {
    const today = moment();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = today.clone().format('YYYY-MM-DD');
        endDate = today.clone().format('YYYY-MM-DD');
        break;
      case 'week':
        startDate = today.clone().startOf('week').format('YYYY-MM-DD');
        endDate = today.clone().endOf('week').format('YYYY-MM-DD');
        break;
      case 'month':
        startDate = today.clone().startOf('month').format('YYYY-MM-DD');
        endDate = today.clone().endOf('month').format('YYYY-MM-DD');
        break;
      case 'year':
        startDate = today.clone().startOf('year').format('YYYY-MM-DD');
        endDate = today.clone().endOf('year').format('YYYY-MM-DD');
        break;
      default:
        startDate = today.clone().format('YYYY-MM-DD');
        endDate = today.clone().format('YYYY-MM-DD');
    }

    return { startDate, endDate };
  },

  buildPaginationQuery: (page = 1, limit = 20) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    return { offset, limit: limitNum, page: pageNum };
  },

  successResponse: (data = null, message = 'Success') => {
    return {
      success: true,
      message,
      data,
    };
  },

  errorResponse: (message, statusCode = 500, data = null) => {
    return {
      success: false,
      message,
      statusCode,
      ...(data && { data }),
    };
  },

  calculateProfitMargin: (totalSales, totalExpenses) => {
    if (totalSales === 0) return 0;
    return ((totalSales - totalExpenses) / totalSales) * 100;
  },

  groupByDate: (records, dateField = 'created_at') => {
    return records.reduce((grouped, record) => {
      const date = moment(record[dateField]).format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
      return grouped;
    }, {});
  },

  groupByCategory: (records, categoryField) => {
    return records.reduce((grouped, record) => {
      const category = record[categoryField];
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(record);
      return grouped;
    }, {});
  },

  sumByField: (records, field) => {
    return records.reduce((sum, record) => sum + (parseFloat(record[field]) || 0), 0);
  },

  roundToTwo: (num) => {
    return Math.round(num * 100) / 100;
  },

  getPaginationMeta: (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  },
};

module.exports = helpers;

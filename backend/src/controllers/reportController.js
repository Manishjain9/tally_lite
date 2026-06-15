const reportService = require('../services/reportService');
const { STATUS_CODES } = require('../config/constants');
const helpers = require('../utils/helpers');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportController {
  async getDailyReport(req, res, next) {
    try {
      const userId = req.userId;
      const { date, format } = req.query;

      if (!date) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('Date required')
        );
      }

      const report = await reportService.getDailyReport(userId, date);

      if (format === 'excel') {
        return this.exportToExcel(res, report, `Daily_Report_${date}`);
      }

      if (format === 'pdf') {
        return this.exportToPDF(res, report, `Daily_Report_${date}`);
      }

      res.status(STATUS_CODES.OK).json(helpers.successResponse(report));
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyReport(req, res, next) {
    try {
      const userId = req.userId;
      const { month, year, format } = req.query;

      if (!month || !year) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('month and year required')
        );
      }

      const report = await reportService.getMonthlyReport(userId, month, year);

      if (format === 'excel') {
        return this.exportToExcel(res, report, `Monthly_Report_${year}_${month}`);
      }

      if (format === 'pdf') {
        return this.exportToPDF(res, report, `Monthly_Report_${year}_${month}`);
      }

      res.status(STATUS_CODES.OK).json(helpers.successResponse(report));
    } catch (error) {
      next(error);
    }
  }

  async getCustomerReport(req, res, next) {
    try {
      const userId = req.userId;
      const { customerId, format } = req.query;

      if (!customerId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('customerId required')
        );
      }

      const report = await reportService.getCustomerReport(userId, customerId);

      if (format === 'excel') {
        return this.exportToExcel(res, report, `Customer_Report_${customerId}`);
      }

      if (format === 'pdf') {
        return this.exportToPDF(res, report, `Customer_Report_${customerId}`);
      }

      res.status(STATUS_CODES.OK).json(helpers.successResponse(report));
    } catch (error) {
      next(error);
    }
  }

  async getCashReport(req, res, next) {
    try {
      const userId = req.userId;
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('startDate and endDate required')
        );
      }

      const report = await reportService.getCashReport(userId, startDate, endDate);

      if (format === 'excel') {
        return this.exportToExcel(res, report, `Cash_Report_${startDate}_${endDate}`);
      }

      if (format === 'pdf') {
        return this.exportToPDF(res, report, `Cash_Report_${startDate}_${endDate}`);
      }

      res.status(STATUS_CODES.OK).json(helpers.successResponse(report));
    } catch (error) {
      next(error);
    }
  }

  async getOutstandingPaymentReport(req, res, next) {
    try {
      const userId = req.userId;
      const { format } = req.query;

      const report = await reportService.getOutstandingPaymentReport(userId);

      if (format === 'excel') {
        return this.exportToExcel(res, report, 'Outstanding_Payments_Report');
      }

      if (format === 'pdf') {
        return this.exportToPDF(res, report, 'Outstanding_Payments_Report');
      }

      res.status(STATUS_CODES.OK).json(helpers.successResponse(report));
    } catch (error) {
      next(error);
    }
  }

  async getExpenseReport(req, res, next) {
    try {
      const userId = req.userId;
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('startDate and endDate required')
        );
      }

      const report = await reportService.getExpenseReport(userId, startDate, endDate);

      if (format === 'excel') {
        return this.exportToExcel(res, report, `Expense_Report_${startDate}_${endDate}`);
      }

      if (format === 'pdf') {
        return this.exportToPDF(res, report, `Expense_Report_${startDate}_${endDate}`);
      }

      res.status(STATUS_CODES.OK).json(helpers.successResponse(report));
    } catch (error) {
      next(error);
    }
  }

  async exportToExcel(res, data, fileName) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      worksheet.columns = [
        { header: 'Field', key: 'field', width: 30 },
        { header: 'Value', key: 'value', width: 30 },
      ];

      worksheet.getRow(1).font = { bold: true };

      if (data.summary) {
        Object.entries(data.summary).forEach(([key, value]) => {
          worksheet.addRow({ field: key, value });
        });
      }

      const filePath = path.join(__dirname, `../../exports/${fileName}.xlsx`);
      await workbook.xlsx.writeFile(filePath);

      res.download(filePath, `${fileName}.xlsx`, (err) => {
        if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
          console.error('Download error:', err);
        }
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      console.error('Excel export error:', error);
      res.status(STATUS_CODES.INTERNAL_ERROR).json(
        helpers.errorResponse('Failed to export to Excel')
      );
    }
  }

  async exportToPDF(res, data, fileName) {
    try {
      const doc = new PDFDocument();
      const filePath = path.join(__dirname, `../../exports/${fileName}.pdf`);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      doc.fontSize(16).text(fileName, 100, 50);

      if (data.summary) {
        doc.fontSize(12).moveDown();
        Object.entries(data.summary).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });
      }

      doc.end();

      stream.on('finish', () => {
        res.download(filePath, `${fileName}.pdf`, (err) => {
          if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
            console.error('Download error:', err);
          }
          fs.unlinkSync(filePath);
        });
      });
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(STATUS_CODES.INTERNAL_ERROR).json(
        helpers.errorResponse('Failed to export to PDF')
      );
    }
  }
}

module.exports = new ReportController();

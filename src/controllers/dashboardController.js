const dashboardService = require('../services/dashboardService');

const getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const summary = await dashboardService.getSummary(
      req.userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryTotals = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const categoryTotals = await dashboardService.getCategoryTotals(
      req.userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: categoryTotals
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    
    const trends = await dashboardService.getMonthlyTrends(
      req.userId,
      parseInt(months)
    );

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

const getRecentTransactions = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const transactions = await dashboardService.getRecentTransactions(
      req.userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

const getFullDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate, months = 6, recentLimit = 10 } = req.query;
    
    const [summary, categoryTotals, trends, recentTransactions] = await Promise.all([
      dashboardService.getSummary(req.userId, startDate, endDate),
      dashboardService.getCategoryTotals(req.userId, startDate, endDate),
      dashboardService.getMonthlyTrends(req.userId, parseInt(months)),
      dashboardService.getRecentTransactions(req.userId, parseInt(recentLimit))
    ]);

    res.json({
      success: true,
      data: {
        summary,
        categoryTotals,
        trends,
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentTransactions,
  getFullDashboard
};
const Transaction = require('../models/Transaction');

class DashboardService {
  async getSummary(userId, startDate, endDate) {
    const matchQuery = { createdBy: userId };
    
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const summary = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const result = summary[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };
    
    return {
      totalIncome: result.totalIncome,
      totalExpenses: result.totalExpenses,
      netBalance: result.totalIncome - result.totalExpenses,
      totalTransactions: result.transactionCount
    };
  }

  async getCategoryTotals(userId, startDate, endDate) {
    const matchQuery = { createdBy: userId };
    
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const categoryTotals = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              name: '$_id.category',
              total: '$total',
              count: '$count'
            }
          }
        }
      }
    ]);

    const result = {
      income: [],
      expense: []
    };

    categoryTotals.forEach(item => {
      if (item._id === 'income') {
        result.income = item.categories.sort((a, b) => b.total - a.total);
      } else if (item._id === 'expense') {
        result.expense = item.categories.sort((a, b) => b.total - a.total);
      }
    });

    return result;
  }

  async getMonthlyTrends(userId, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Transaction.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format results
    const monthlyData = {};
    trends.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: key,
          income: 0,
          expense: 0
        };
      }
      if (item._id.type === 'income') {
        monthlyData[key].income = item.total;
      } else {
        monthlyData[key].expense = item.total;
      }
    });

    return Object.values(monthlyData);
  }

  async getRecentTransactions(userId, limit = 10) {
    const transactions = await Transaction.find({ createdBy: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name email');

    return transactions;
  }
}

module.exports = new DashboardService();
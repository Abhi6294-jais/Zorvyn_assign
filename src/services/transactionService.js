const Transaction = require('../models/Transaction');

class TransactionService {
  /**
   * Create a new transaction
   */
  async createTransaction(transactionData) {
    const transaction = await Transaction.create(transactionData);
    return await this.getTransactionWithDetails(transaction._id, transactionData.createdBy);
  }

  /**
   * Get transaction by ID with details and verify ownership
   */
  async getTransactionWithDetails(transactionId, userId) {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      createdBy: userId
    }).populate('createdBy', 'name email');

    if (!transaction) {
      throw new Error('Transaction not found or unauthorized');
    }

    return transaction;
  }

  /**
   * Get all transactions for a user with filters and pagination
   */
  async getUserTransactions(userId, filters = {}, pagination = {}) {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = pagination;

    // Build query
    const query = { createdBy: userId };

    if (type) query.type = type;
    if (category) query.category = category;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Search in description
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(skip)
        .populate('createdBy', 'name email'),
      Transaction.countDocuments(query)
    ]);

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: { type, category, startDate, endDate, minAmount, maxAmount, search }
    };
  }

  /**
   * Update transaction
   */
  async updateTransaction(transactionId, userId, updateData) {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, createdBy: userId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!transaction) {
      throw new Error('Transaction not found or unauthorized');
    }

    return transaction;
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId, userId) {
    const transaction = await Transaction.findOneAndDelete({
      _id: transactionId,
      createdBy: userId
    });

    if (!transaction) {
      throw new Error('Transaction not found or unauthorized');
    }

    return transaction;
  }

  /**
   * Delete multiple transactions
   */
  async deleteMultipleTransactions(transactionIds, userId) {
    const result = await Transaction.deleteMany({
      _id: { $in: transactionIds },
      createdBy: userId
    });

    return {
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} transaction(s) deleted successfully`
    };
  }

  /**
   * Get transaction statistics for a user
   */
  async getTransactionStats(userId, startDate, endDate) {
    const matchQuery = { createdBy: userId };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          summary: [
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
                averageIncome: {
                  $avg: {
                    $cond: [{ $eq: ['$type', 'income'] }, '$amount', null]
                  }
                },
                averageExpense: {
                  $avg: {
                    $cond: [{ $eq: ['$type', 'expense'] }, '$amount', null]
                  }
                },
                totalTransactions: { $sum: 1 },
                incomeCount: {
                  $sum: { $cond: [{ $eq: ['$type', 'income'] }, 1, 0] }
                },
                expenseCount: {
                  $sum: { $cond: [{ $eq: ['$type', 'expense'] }, 1, 0] }
                }
              }
            }
          ],
          largestIncome: [
            { $match: { type: 'income' } },
            { $sort: { amount: -1 } },
            { $limit: 1 },
            {
              $project: {
                amount: 1,
                category: 1,
                date: 1,
                description: 1
              }
            }
          ],
          largestExpense: [
            { $match: { type: 'expense' } },
            { $sort: { amount: -1 } },
            { $limit: 1 },
            {
              $project: {
                amount: 1,
                category: 1,
                date: 1,
                description: 1
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0];
    const summary = result.summary[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      averageIncome: 0,
      averageExpense: 0,
      totalTransactions: 0,
      incomeCount: 0,
      expenseCount: 0
    };

    return {
      summary: {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        netBalance: summary.totalIncome - summary.totalExpenses,
        averageIncome: summary.averageIncome || 0,
        averageExpense: summary.averageExpense || 0,
        totalTransactions: summary.totalTransactions,
        incomeCount: summary.incomeCount,
        expenseCount: summary.expenseCount
      },
      largestIncome: result.largestIncome[0] || null,
      largestExpense: result.largestExpense[0] || null
    };
  }

  /**
   * Get category-wise breakdown
   */
  async getCategoryBreakdown(userId, type, startDate, endDate) {
    const matchQuery = { createdBy: userId };

    if (type) matchQuery.type = type;
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const breakdown = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    return breakdown.map(item => ({
      category: item._id.category,
      type: item._id.type,
      total: item.total,
      count: item.count,
      average: item.average
    }));
  }

  /**
   * Get daily transaction summary for a date range
   */
  async getDailySummary(userId, startDate, endDate) {
    const matchQuery = {
      createdBy: userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const dailySummary = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          date: { $first: '$date' },
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
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return dailySummary.map(day => ({
      date: day.date,
      totalIncome: day.totalIncome,
      totalExpenses: day.totalExpenses,
      netBalance: day.totalIncome - day.totalExpenses,
      transactionCount: day.transactionCount
    }));
  }

  /**
   * Bulk create transactions
   */
  async bulkCreateTransactions(transactionsData) {
    const transactions = await Transaction.insertMany(transactionsData, {
      ordered: false // Continue on errors
    });

    return transactions;
  }

  /**
   * Export transactions to CSV format
   */
  async exportTransactionsToCSV(userId, filters = {}) {
    const { transactions } = await this.getUserTransactions(userId, filters, {
      page: 1,
      limit: 10000 // Large limit for export
    });

    // Convert to CSV format
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Created At'];
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      t.type,
      t.category,
      t.amount,
      t.description || '',
      t.createdAt.toISOString()
    ]);

    return { headers, rows };
  }
}

module.exports = new TransactionService();
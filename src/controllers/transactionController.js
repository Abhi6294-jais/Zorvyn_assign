const transactionService = require('../services/transactionService');

const createTransaction = async (req, res, next) => {
  try {
    const transactionData = {
      ...req.body,
      createdBy: req.userId
    };

    const transaction = await transactionService.createTransaction(transactionData);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const result = await transactionService.getUserTransactions(
      req.userId,
      { type, category, startDate, endDate, minAmount, maxAmount, search },
      { page, limit, sortBy, sortOrder }
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionWithDetails(
      req.params.id,
      req.userId
    );

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    if (error.message === 'Transaction not found or unauthorized') {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(
      req.params.id,
      req.userId,
      req.body
    );

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    if (error.message === 'Transaction not found or unauthorized') {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id, req.userId);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Transaction not found or unauthorized') {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    next(error);
  }
};

const bulkDeleteTransactions = async (req, res, next) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({
        success: false,
        message: 'transactionIds array is required'
      });
    }

    const result = await transactionService.deleteMultipleTransactions(
      transactionIds,
      req.userId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getTransactionStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await transactionService.getTransactionStats(
      req.userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  getTransactionStats
};
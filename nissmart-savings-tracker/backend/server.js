const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// GET /api/plans - Get all savings plans
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await prisma.savingsPlan.findMany({
      include: {
        contributions: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate progress percentage for each plan
    const plansWithProgress = plans.map(plan => ({
      ...plan,
      progressPercentage: plan.targetAmount > 0 
        ? Math.round((plan.currentBalance / plan.targetAmount) * 100) 
        : 0
    }));

    res.json(plansWithProgress);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch savings plans' });
  }
});

// POST /api/plans - Create a new savings plan
app.post('/api/plans', async (req, res) => {
  try {
    const { goalName, targetAmount } = req.body;

    // Validation
    if (!goalName || !targetAmount) {
      return res.status(400).json({ 
        error: 'Goal name and target amount are required' 
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({ 
        error: 'Target amount must be positive' 
      });
    }

    const newPlan = await prisma.savingsPlan.create({
      data: {
        goalName: goalName.trim(),
        targetAmount: parseFloat(targetAmount),
        currentBalance: 0
      },
      include: {
        contributions: true
      }
    });

    const planWithProgress = {
      ...newPlan,
      progressPercentage: 0
    };

    res.status(201).json(planWithProgress);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create savings plan' });
  }
});

// POST /api/plans/:id/contribute - Add contribution to a plan
app.post('/api/plans/:id/contribute', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Contribution amount must be positive' 
      });
    }

    // Check if plan exists
    const plan = await prisma.savingsPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Savings plan not found' });
    }

    // Create contribution and update plan balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create contribution
      const contribution = await tx.contribution.create({
        data: {
          amount: parseFloat(amount),
          description: description || null,
          planId: id
        }
      });

      // Update plan balance
      const updatedPlan = await tx.savingsPlan.update({
        where: { id },
        data: {
          currentBalance: plan.currentBalance + parseFloat(amount)
        },
        include: {
          contributions: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return { contribution, plan: updatedPlan };
    });

    const planWithProgress = {
      ...result.plan,
      progressPercentage: result.plan.targetAmount > 0 
        ? Math.round((result.plan.currentBalance / result.plan.targetAmount) * 100) 
        : 0
    };

    res.json({
      contribution: result.contribution,
      plan: planWithProgress
    });
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ error: 'Failed to add contribution' });
  }
});

// POST /api/plans/:id/withdraw - Withdraw from a plan (bonus feature)
app.post('/api/plans/:id/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Withdrawal amount must be positive' 
      });
    }

    // Check if plan exists
    const plan = await prisma.savingsPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Savings plan not found' });
    }

    // Check if withdrawal would make balance negative
    if (plan.currentBalance < parseFloat(amount)) {
      return res.status(400).json({ 
        error: 'Insufficient balance. Cannot withdraw more than current balance.' 
      });
    }

    // Create withdrawal (negative contribution) and update plan balance
    const result = await prisma.$transaction(async (tx) => {
      // Create withdrawal as negative contribution
      const withdrawal = await tx.contribution.create({
        data: {
          amount: -parseFloat(amount),
          description: description || 'Withdrawal',
          planId: id
        }
      });

      // Update plan balance
      const updatedPlan = await tx.savingsPlan.update({
        where: { id },
        data: {
          currentBalance: plan.currentBalance - parseFloat(amount)
        },
        include: {
          contributions: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return { withdrawal, plan: updatedPlan };
    });

    const planWithProgress = {
      ...result.plan,
      progressPercentage: result.plan.targetAmount > 0 
        ? Math.round((result.plan.currentBalance / result.plan.targetAmount) * 100) 
        : 0
    };

    res.json({
      withdrawal: result.withdrawal,
      plan: planWithProgress
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// GET /api/dashboard - Dashboard summary
app.get('/api/dashboard', async (req, res) => {
  try {
    const plans = await prisma.savingsPlan.findMany({
      include: {
        contributions: true
      }
    });

    const totalSavings = plans.reduce((sum, plan) => sum + plan.currentBalance, 0);
    const totalTargets = plans.reduce((sum, plan) => sum + plan.targetAmount, 0);
    const totalContributions = await prisma.contribution.count({
      where: {
        amount: {
          gt: 0
        }
      }
    });

    const averageProgress = plans.length > 0 
      ? Math.round(plans.reduce((sum, plan) => 
          sum + (plan.targetAmount > 0 ? (plan.currentBalance / plan.targetAmount) * 100 : 0), 0
        ) / plans.length)
      : 0;

    res.json({
      totalPlans: plans.length,
      totalSavings,
      totalTargets,
      totalContributions,
      averageProgress
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// DELETE /api/plans/:id - Delete a savings plan
app.delete('/api/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await prisma.savingsPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Savings plan not found' });
    }

    await prisma.savingsPlan.delete({
      where: { id }
    });

    res.json({ message: 'Savings plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete savings plan' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nissmart Savings API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
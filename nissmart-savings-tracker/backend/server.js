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

app.get('/api/dashboard', async (req, res) => {
  try {
    const plans = await prisma.savingsPlan.findMany({
      include: {
        contributions: {
          orderBy: {
            createdAt: 'desc'
          }
        }
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

    // Generate chart data
    const chartData = await generateChartData(plans);

    res.json({
      totalPlans: plans.length,
      totalSavings,
      totalTargets,
      totalContributions,
      averageProgress,
      charts: chartData  // This was missing!
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/contributions - Get all contributions with plan details
app.get('/api/contributions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, planId } = req.query;
    
    const where = planId ? { planId } : {};
    
    const contributions = await prisma.contribution.findMany({
      where,
      include: {
        plan: {
          select: {
            goalName: true,
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.contribution.count({ where });

    res.json({
      contributions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// Helper function to generate chart data
async function generateChartData(plans) {
  try {
    // 1. Monthly contributions trend (line chart)
    const monthlyTrend = await getMonthlyContributionTrend();
    
    // 2. Plans progress distribution (donut chart)
    const progressDistribution = getProgressDistribution(plans);
    
    // 3. Top performing plans (bar chart)
    const topPlans = getTopPerformingPlans(plans);
    
    // 4. Contribution vs Withdrawal comparison (bar chart)
    const contributionComparison = await getContributionComparison();
    
    // 5. Savings by category (pie chart)
    const savingsByCategory = getSavingsByCategory(plans);

    return {
      monthlyTrend,
      progressDistribution,
      topPlans,
      contributionComparison,
      savingsByCategory
    };
  } catch (error) {
    console.error('Error generating chart data:', error);
    return {};
  }
}

async function getMonthlyContributionTrend() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const contributions = await prisma.contribution.findMany({
    where: {
      createdAt: {
        gte: sixMonthsAgo
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const monthlyData = {};
  contributions.forEach(contribution => {
    const monthKey = contribution.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { contributions: 0, withdrawals: 0 };
    }
    
    if (contribution.amount > 0) {
      monthlyData[monthKey].contributions += contribution.amount;
    } else {
      monthlyData[monthKey].withdrawals += Math.abs(contribution.amount);
    }
  });

  const labels = Object.keys(monthlyData).sort();
  const contributionAmounts = labels.map(month => monthlyData[month]?.contributions || 0);
  const withdrawalAmounts = labels.map(month => monthlyData[month]?.withdrawals || 0);

  return {
    labels: labels.map(month => {
      const [year, monthNum] = month.split('-');
      return new Date(year, monthNum - 1).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Contributions',
        data: contributionAmounts,
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4
      },
      {
        label: 'Withdrawals',
        data: withdrawalAmounts,
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.4
      }
    ]
  };
}

function getProgressDistribution(plans) {
  const distribution = {
    completed: 0,
    almostThere: 0, // 75-99%
    onTrack: 0,     // 50-74%
    started: 0,     // 1-49%
    notStarted: 0   // 0%
  };

  plans.forEach(plan => {
    const progress = (plan.currentBalance / plan.targetAmount) * 100;
    if (progress >= 100) distribution.completed++;
    else if (progress >= 75) distribution.almostThere++;
    else if (progress >= 50) distribution.onTrack++;
    else if (progress > 0) distribution.started++;
    else distribution.notStarted++;
  });

  return {
    labels: ['Completed', 'Almost There (75-99%)', 'On Track (50-74%)', 'Getting Started (1-49%)', 'Not Started'],
    datasets: [{
      data: [
        distribution.completed,
        distribution.almostThere,
        distribution.onTrack,
        distribution.started,
        distribution.notStarted
      ],
      backgroundColor: [
        '#28a745', // Green - Completed
        '#17a2b8', // Info - Almost there
        '#ffc107', // Warning - On track
        '#fd7e14', // Orange - Started
        '#6c757d'  // Gray - Not started
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };
}

function getTopPerformingPlans(plans) {
  const sortedPlans = [...plans]
    .sort((a, b) => {
      const progressA = (a.currentBalance / a.targetAmount) * 100;
      const progressB = (b.currentBalance / b.targetAmount) * 100;
      return progressB - progressA;
    })
    .slice(0, 5);

  return {
    labels: sortedPlans.map(plan => plan.goalName.length > 15 ? plan.goalName.substring(0, 15) + '...' : plan.goalName),
    datasets: [{
      label: 'Progress %',
      data: sortedPlans.map(plan => Math.round((plan.currentBalance / plan.targetAmount) * 100)),
      backgroundColor: [
        '#28a745',
        '#17a2b8',
        '#ffc107',
        '#fd7e14',
        '#6f42c1'
      ],
      borderRadius: 8
    }]
  };
}

async function getContributionComparison() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const recentContributions = await prisma.contribution.findMany({
    where: {
      createdAt: {
        gte: last30Days
      }
    }
  });

  let totalContributions = 0;
  let totalWithdrawals = 0;
  let contributionCount = 0;
  let withdrawalCount = 0;

  recentContributions.forEach(contribution => {
    if (contribution.amount > 0) {
      totalContributions += contribution.amount;
      contributionCount++;
    } else {
      totalWithdrawals += Math.abs(contribution.amount);
      withdrawalCount++;
    }
  });

  return {
    labels: ['Contributions (Last 30 Days)', 'Withdrawals (Last 30 Days)'],
    datasets: [{
      label: 'Amount (KSH)',
      data: [totalContributions, totalWithdrawals],
      backgroundColor: ['#28a745', '#dc3545'],
      borderRadius: 8
    }]
  };
}

function getSavingsByCategory(plans) {
  const categories = {};
  
  plans.forEach(plan => {
    let category = 'Other';
    const goalName = plan.goalName.toLowerCase();
    
    if (goalName.includes('school') || goalName.includes('fees') || goalName.includes('education')) {
      category = 'Education';
    } else if (goalName.includes('emergency')) {
      category = 'Emergency Fund';
    } else if (goalName.includes('uniform') || goalName.includes('clothes')) {
      category = 'Clothing';
    } else if (goalName.includes('transport') || goalName.includes('travel')) {
      category = 'Transport';
    } else if (goalName.includes('laptop') || goalName.includes('computer') || goalName.includes('phone')) {
      category = 'Electronics';
    } else if (goalName.includes('book') || goalName.includes('stationery')) {
      category = 'Books & Supplies';
    }
    
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category] += plan.currentBalance;
  });

  return {
    labels: Object.keys(categories),
    datasets: [{
      data: Object.values(categories),
      backgroundColor: [
        '#007bff', // Blue
        '#28a745', // Green
        '#ffc107', // Yellow
        '#dc3545', // Red
        '#6f42c1', // Purple
        '#fd7e14', // Orange
        '#20c997'  // Teal
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };
}

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

// GET /api/contributions - Get all contributions with plan details
app.get('/api/contributions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, planId } = req.query;
    
    const where = planId ? { planId } : {};
    
    const contributions = await prisma.contribution.findMany({
      where,
      include: {
        plan: {
          select: {
            goalName: true,
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.contribution.count({ where });

    res.json({
      contributions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// Helper function to generate chart data
async function generateChartData(plans) {
  try {
    console.log('📊 Generating chart data for', plans.length, 'plans');
    
    // 1. Monthly contributions trend (line chart)
    const monthlyTrend = await getMonthlyContributionTrend();
    
    // 2. Plans progress distribution (donut chart)
    const progressDistribution = getProgressDistribution(plans);
    
    // 3. Top performing plans (bar chart)
    const topPlans = getTopPerformingPlans(plans);
    
    // 4. Contribution vs Withdrawal comparison (bar chart)
    const contributionComparison = await getContributionComparison();
    
    // 5. Savings by category (pie chart)
    const savingsByCategory = getSavingsByCategory(plans);

    console.log('✅ Chart data generated successfully');
    
    return {
      monthlyTrend,
      progressDistribution,
      topPlans,
      contributionComparison,
      savingsByCategory
    };
  } catch (error) {
    console.error('❌ Error generating chart data:', error);
    // Return empty data structure instead of failing
    return {
      monthlyTrend: { labels: [], datasets: [] },
      progressDistribution: { labels: [], datasets: [{ data: [] }] },
      topPlans: { labels: [], datasets: [{ data: [] }] },
      contributionComparison: { labels: [], datasets: [{ data: [] }] },
      savingsByCategory: { labels: [], datasets: [{ data: [] }] }
    };
  }
}

async function getMonthlyContributionTrend() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const contributions = await prisma.contribution.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('📈 Found', contributions.length, 'contributions for monthly trend');

    const monthlyData = {};
    contributions.forEach(contribution => {
      const monthKey = contribution.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { contributions: 0, withdrawals: 0 };
      }
      
      if (contribution.amount > 0) {
        monthlyData[monthKey].contributions += contribution.amount;
      } else {
        monthlyData[monthKey].withdrawals += Math.abs(contribution.amount);
      }
    });

    const labels = Object.keys(monthlyData).sort();
    const contributionAmounts = labels.map(month => monthlyData[month]?.contributions || 0);
    const withdrawalAmounts = labels.map(month => monthlyData[month]?.withdrawals || 0);

    return {
      labels: labels.map(month => {
        if (!month) return '';
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Contributions',
          data: contributionAmounts,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Withdrawals',
          data: withdrawalAmounts,
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.4,
          fill: false
        }
      ]
    };
  } catch (error) {
    console.error('Error generating monthly trend:', error);
    return { labels: [], datasets: [] };
  }
}

function getProgressDistribution(plans) {
  try {
    const distribution = {
      completed: 0,
      almostThere: 0, // 75-99%
      onTrack: 0,     // 50-74%
      started: 0,     // 1-49%
      notStarted: 0   // 0%
    };

    plans.forEach(plan => {
      const progress = plan.targetAmount > 0 ? (plan.currentBalance / plan.targetAmount) * 100 : 0;
      if (progress >= 100) distribution.completed++;
      else if (progress >= 75) distribution.almostThere++;
      else if (progress >= 50) distribution.onTrack++;
      else if (progress > 0) distribution.started++;
      else distribution.notStarted++;
    });

    return {
      labels: ['Completed', 'Almost There (75-99%)', 'On Track (50-74%)', 'Getting Started (1-49%)', 'Not Started'],
      datasets: [{
        data: [
          distribution.completed,
          distribution.almostThere,
          distribution.onTrack,
          distribution.started,
          distribution.notStarted
        ],
        backgroundColor: [
          '#28a745', // Green - Completed
          '#17a2b8', // Info - Almost there
          '#ffc107', // Warning - On track
          '#fd7e14', // Orange - Started
          '#6c757d'  // Gray - Not started
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  } catch (error) {
    console.error('Error generating progress distribution:', error);
    return { labels: [], datasets: [{ data: [] }] };
  }
}

function getTopPerformingPlans(plans) {
  try {
    const sortedPlans = [...plans]
      .filter(plan => plan.targetAmount > 0) // Only plans with targets
      .sort((a, b) => {
        const progressA = (a.currentBalance / a.targetAmount) * 100;
        const progressB = (b.currentBalance / b.targetAmount) * 100;
        return progressB - progressA;
      })
      .slice(0, 5);

    return {
      labels: sortedPlans.map(plan => 
        plan.goalName.length > 15 ? plan.goalName.substring(0, 15) + '...' : plan.goalName
      ),
      datasets: [{
        label: 'Progress %',
        data: sortedPlans.map(plan => Math.round((plan.currentBalance / plan.targetAmount) * 100)),
        backgroundColor: [
          '#28a745',
          '#17a2b8',
          '#ffc107',
          '#fd7e14',
          '#6f42c1'
        ],
        borderRadius: 8
      }]
    };
  } catch (error) {
    console.error('Error generating top plans:', error);
    return { labels: [], datasets: [{ data: [] }] };
  }
}

async function getContributionComparison() {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentContributions = await prisma.contribution.findMany({
      where: {
        createdAt: {
          gte: last30Days
        }
      }
    });

    let totalContributions = 0;
    let totalWithdrawals = 0;

    recentContributions.forEach(contribution => {
      if (contribution.amount > 0) {
        totalContributions += contribution.amount;
      } else {
        totalWithdrawals += Math.abs(contribution.amount);
      }
    });

    return {
      labels: ['Contributions (Last 30 Days)', 'Withdrawals (Last 30 Days)'],
      datasets: [{
        label: 'Amount (KSH)',
        data: [totalContributions, totalWithdrawals],
        backgroundColor: ['#28a745', '#dc3545'],
        borderRadius: 8
      }]
    };
  } catch (error) {
    console.error('Error generating contribution comparison:', error);
    return { labels: [], datasets: [{ data: [] }] };
  }
}

function getSavingsByCategory(plans) {
  try {
    const categories = {};
    
    plans.forEach(plan => {
      let category = 'Other';
      const goalName = plan.goalName.toLowerCase();
      
      if (goalName.includes('school') || goalName.includes('fees') || goalName.includes('education')) {
        category = 'Education';
      } else if (goalName.includes('emergency')) {
        category = 'Emergency Fund';
      } else if (goalName.includes('uniform') || goalName.includes('clothes')) {
        category = 'Clothing';
      } else if (goalName.includes('transport') || goalName.includes('travel')) {
        category = 'Transport';
      } else if (goalName.includes('laptop') || goalName.includes('computer') || goalName.includes('phone')) {
        category = 'Electronics';
      } else if (goalName.includes('book') || goalName.includes('stationery')) {
        category = 'Books & Supplies';
      }
      
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += plan.currentBalance;
    });

    return {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: [
          '#007bff', // Blue
          '#28a745', // Green
          '#ffc107', // Yellow
          '#dc3545', // Red
          '#6f42c1', // Purple
          '#fd7e14', // Orange
          '#20c997'  // Teal
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  } catch (error) {
    console.error('Error generating savings by category:', error);
    return { labels: [], datasets: [{ data: [] }] };
  }
}
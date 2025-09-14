import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { formatKSH } from '../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Charts = ({ chartData }) => {
  if (!chartData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading charts...</span>
        </div>
        <p className="mt-3 text-muted">Preparing your savings insights...</p>
      </div>
    );
  }

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Contribution Trends',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatKSH(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatKSH(value);
          }
        },
        title: {
          display: true,
          text: 'Amount (KSH)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top Performing Savings Plans',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Progress: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: 'Progress (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Savings Plans'
        }
      }
    }
  };

  const contributionComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Contributions vs Withdrawals (Last 30 Days)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${formatKSH(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatKSH(value);
          }
        },
        title: {
          display: true,
          text: 'Amount (KSH)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Progress Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} plans (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Savings by Category',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${formatKSH(value)}`;
          }
        }
      }
    }
  };

  return (
    <div>
      <Row className="g-4">
        {/* Monthly Trends Line Chart */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div style={{ height: '300px' }}>
                {chartData.monthlyTrend && chartData.monthlyTrend.labels?.length > 0 ? (
                  <Line data={chartData.monthlyTrend} options={lineChartOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <div className="display-4 mb-3">📈</div>
                      <h5 className="text-muted">No Monthly Data Yet</h5>
                      <p className="text-muted">Start making contributions to see your trends!</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Progress Distribution Doughnut Chart */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div style={{ height: '300px' }}>
                {chartData.progressDistribution && chartData.progressDistribution.datasets[0].data.some(val => val > 0) ? (
                  <Doughnut data={chartData.progressDistribution} options={doughnutOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <div className="display-4 mb-3">🎯</div>
                      <h5 className="text-muted">No Plans Yet</h5>
                      <p className="text-muted">Create your first savings plan!</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-0">
        {/* Top Plans Performance Bar Chart */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div style={{ height: '300px' }}>
                {chartData.topPlans && chartData.topPlans.labels?.length > 0 ? (
                  <Bar data={chartData.topPlans} options={barChartOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <div className="display-4 mb-3">🏆</div>
                      <h5 className="text-muted">No Plans to Compare</h5>
                      <p className="text-muted">Create multiple plans to see performance comparison!</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Contributions vs Withdrawals */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div style={{ height: '300px' }}>
                {chartData.contributionComparison && chartData.contributionComparison.datasets[0].data.some(val => val > 0) ? (
                  <Bar data={chartData.contributionComparison} options={contributionComparisonOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <div className="display-4 mb-3">⚖️</div>
                      <h5 className="text-muted">No Recent Activity</h5>
                      <p className="text-muted">Make some contributions to see your activity!</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-0">
        {/* Savings by Category Pie Chart */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div style={{ height: '350px' }}>
                {chartData.savingsByCategory && chartData.savingsByCategory.datasets[0].data.some(val => val > 0) ? (
                  <Pie data={chartData.savingsByCategory} options={pieOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <div className="display-4 mb-3">🥧</div>
                      <h5 className="text-muted">No Categories Yet</h5>
                      <p className="text-muted">Create plans with different categories to see breakdown!</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Key Insights Card */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">💡 Key Insights</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-column h-100">
                <div className="mb-3">
                  <h6 className="text-primary mb-2">📊 Your Progress</h6>
                  <p className="mb-1">
                    Keep up the great work with your savings journey!
                  </p>
                  <p className="mb-3">
                    Every contribution brings you closer to your goals.
                  </p>
                </div>

                <div className="mt-auto">
                  <div className="alert alert-info">
                    <strong>💡 Tip:</strong> Regular small contributions often work better than large sporadic ones!
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Motivational Messages */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 bg-gradient-primary text-white">
            <Card.Body className="text-center py-4">
              <h4 className="mb-3">🌟 Keep Up The Great Work!</h4>
              <p className="mb-0">
                Every contribution brings you closer to your dreams! Your financial discipline is building a brighter future! 🎯
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Charts;
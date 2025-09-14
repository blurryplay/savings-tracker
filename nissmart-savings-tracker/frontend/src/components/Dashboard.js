import React from 'react';
import { Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';
import { formatKSH, formatPercentage } from '../utils/formatters';

const Dashboard = ({ data, onCreatePlan, onSwitchToPlans }) => {
  if (!data) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">📊 Dashboard</h2>
          <p className="text-muted mb-0">Overview of your savings progress</p>
        </div>
        <Button variant="primary" onClick={onCreatePlan}>
          <i className="bi bi-plus-circle me-2"></i>
          Create New Plan
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-primary mb-2">🎯</div>
              <h3 className="h4 mb-1">{data.totalPlans}</h3>
              <p className="text-muted mb-0">Active Plans</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-success mb-2">💰</div>
              <h3 className="h4 mb-1">{formatKSH(data.totalSavings)}</h3>
              <p className="text-muted mb-0">Total Saved</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-info mb-2">🏆</div>
              <h3 className="h4 mb-1">{formatKSH(data.totalTargets)}</h3>
              <p className="text-muted mb-0">Total Targets</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-warning mb-2">📈</div>
              <h3 className="h4 mb-1">{data.totalContributions}</h3>
              <p className="text-muted mb-0">Contributions</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Progress Overview */}
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0">
              <h5 className="mb-0">📊 Overall Progress</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-medium">Average Progress</span>
                  <span className="text-primary fw-bold">
                    {formatPercentage(data.averageProgress)}
                  </span>
                </div>
                <ProgressBar 
                  now={data.averageProgress} 
                  variant={data.averageProgress >= 75 ? 'success' : data.averageProgress >= 50 ? 'warning' : 'danger'}
                  className="progress-lg"
                />
              </div>
              
              <Row className="text-center">
                <Col>
                  <div className="border-end">
                    <h6 className="text-muted mb-1">Saved</h6>
                    <p className="h5 text-success mb-0">{formatKSH(data.totalSavings)}</p>
                  </div>
                </Col>
                <Col>
                  <div className="border-end">
                    <h6 className="text-muted mb-1">Remaining</h6>
                    <p className="h5 text-danger mb-0">
                      {formatKSH(data.totalTargets - data.totalSavings)}
                    </p>
                  </div>
                </Col>
                <Col>
                  <h6 className="text-muted mb-1">Target</h6>
                  <p className="h5 text-info mb-0">{formatKSH(data.totalTargets)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0">
              <h5 className="mb-0">🚀 Quick Actions</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <p className="text-muted mb-3">
                  {data.totalPlans === 0 
                    ? "Start your savings journey today!" 
                    : "Keep up the great work with your savings!"
                  }
                </p>
              </div>
              
              <div className="mt-auto">
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={onCreatePlan}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Create New Plan
                  </Button>
                  
                  {data.totalPlans > 0 && (
                    <Button variant="outline-primary" onClick={onSwitchToPlans}>
                      <i className="bi bi-list-ul me-2"></i>
                      View All Plans
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Empty State */}
      {data.totalPlans === 0 && (
        <Row className="mt-5">
          <Col>
            <Card className="border-0 shadow-sm text-center py-5">
              <Card.Body>
                <div className="display-1 mb-3">🎯</div>
                <h3 className="mb-3">Welcome to Nissmart Savings!</h3>
                <p className="text-muted mb-4">
                  Start your savings journey by creating your first savings plan. 
                  Whether it's for school fees, uniforms, or any other goal, we're here to help you succeed.
                </p>
                <Button variant="primary" size="lg" onClick={onCreatePlan}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Your First Plan
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
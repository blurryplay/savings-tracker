import React from 'react';
import { Row, Col, Card, Button, ProgressBar, Badge, Dropdown } from 'react-bootstrap';
import { formatKSH, formatPercentage, formatDate, getProgressColor, truncateText } from '../utils/formatters';

const SavingsPlansList = ({ plans, onCreatePlan, onContribute, onWithdraw, onDelete }) => {
  const getPlanStatus = (plan) => {
    const progress = plan.progressPercentage;
    if (progress >= 100) return { text: 'Completed', variant: 'success' };
    if (progress >= 75) return { text: 'Almost There', variant: 'info' };
    if (progress >= 50) return { text: 'On Track', variant: 'warning' };
    if (progress > 0) return { text: 'In Progress', variant: 'primary' };
    return { text: 'Just Started', variant: 'secondary' };
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">💼 My Savings Plans</h2>
          <p className="text-muted mb-0">
            {plans.length > 0 ? `You have ${plans.length} savings plan${plans.length > 1 ? 's' : ''}` : 'No savings plans yet'}
          </p>
        </div>
        <Button variant="primary" onClick={onCreatePlan}>
          <i className="bi bi-plus-circle me-2"></i>
          Create New Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {plans.length > 0 ? (
        <Row className="g-4">
          {plans.map((plan) => {
            const status = getPlanStatus(plan);
            const progressColor = getProgressColor(plan.progressPercentage);
            
            return (
              <Col key={plan.id} md={6} lg={4}>
                <Card className="h-100 border-0 shadow-sm plan-card">
                  <Card.Header className="bg-white border-bottom-0 pb-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h5 className="mb-1" title={plan.goalName}>
                          {truncateText(plan.goalName, 25)}
                        </h5>
                        <Badge bg={status.variant} className="mb-2">
                          {status.text}
                        </Badge>
                      </div>
                      
                      {/* Actions Dropdown */}
                      <Dropdown align="end">
                        <Dropdown.Toggle 
                          variant="outline-secondary" 
                          size="sm" 
                          className="border-0 shadow-none"
                          id={`dropdown-${plan.id}`}
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item 
                            onClick={() => onContribute(plan)}
                            className="text-success"
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add Money
                          </Dropdown.Item>
                          
                          {plan.currentBalance > 0 && (
                            <Dropdown.Item 
                              onClick={() => onWithdraw(plan)}
                              className="text-warning"
                            >
                              <i className="bi bi-dash-circle me-2"></i>
                              Withdraw
                            </Dropdown.Item>
                          )}
                          
                          <Dropdown.Divider />
                          
                          <Dropdown.Item 
                            onClick={() => onDelete(plan.id)}
                            className="text-danger"
                          >
                            <i className="bi bi-trash me-2"></i>
                            Delete Plan
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </Card.Header>

                  <Card.Body className="pt-2">
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">Progress</small>
                        <small className="fw-bold text-primary">
                          {formatPercentage(plan.progressPercentage)}
                        </small>
                      </div>
                      <ProgressBar 
                        now={Math.min(plan.progressPercentage, 100)} 
                        variant={progressColor}
                        className="progress-sm"
                      />
                    </div>

                    {/* Financial Summary */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="small text-muted">Saved</div>
                          <div className="fw-bold text-success">
                            {formatKSH(plan.currentBalance)}
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="small text-muted">Target</div>
                          <div className="fw-bold text-primary">
                            {formatKSH(plan.targetAmount)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remaining Amount */}
                    <div className="text-center p-2 bg-primary bg-opacity-10 rounded mb-3">
                      <div className="small text-muted">Still needed</div>
                      <div className="fw-bold text-primary">
                        {formatKSH(Math.max(0, plan.targetAmount - plan.currentBalance))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    {plan.contributions && plan.contributions.length > 0 && (
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Last contribution</div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small">
                            {formatKSH(Math.abs(plan.contributions[0].amount))}
                            {plan.contributions[0].amount < 0 && ' (withdrawal)'}
                          </span>
                          <span className="small text-muted">
                            {formatDate(plan.contributions[0].createdAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="d-grid gap-2">
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => onContribute(plan)}
                        className="fw-bold"
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add Money
                      </Button>
                    </div>
                  </Card.Body>

                  <Card.Footer className="bg-white border-top-0 pt-0">
                    <small className="text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      Created {formatDate(plan.createdAt)}
                    </small>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* Empty State */
        <Row>
          <Col>
            <Card className="border-0 shadow-sm text-center py-5">
              <Card.Body>
                <div className="display-1 mb-3">🎯</div>
                <h3 className="mb-3">No Savings Plans Yet</h3>
                <p className="text-muted mb-4">
                  Create your first savings plan to start tracking your progress towards your financial goals.
                  Whether it's for school fees, uniforms, or any other goal, we'll help you stay on track!
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

      {/* Summary Statistics */}
      {plans.length > 0 && (
        <Row className="mt-5">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">📈 Your Savings Summary</h5>
              </Card.Header>
              <Card.Body>
                <Row className="text-center">
                  <Col md={3}>
                    <div className="border-end border-md-end-0 border-lg-end mb-3 mb-md-0">
                      <h4 className="text-primary mb-1">
                        {formatKSH(plans.reduce((sum, plan) => sum + plan.currentBalance, 0))}
                      </h4>
                      <small className="text-muted">Total Saved</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end border-md-end-0 border-lg-end mb-3 mb-md-0">
                      <h4 className="text-info mb-1">
                        {formatKSH(plans.reduce((sum, plan) => sum + plan.targetAmount, 0))}
                      </h4>
                      <small className="text-muted">Total Targets</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end border-md-end-0 border-lg-end mb-3 mb-md-0">
                      <h4 className="text-warning mb-1">
                        {plans.filter(plan => plan.progressPercentage >= 100).length}
                      </h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <h4 className="text-success mb-1">
                      {Math.round(plans.reduce((sum, plan) => sum + plan.progressPercentage, 0) / plans.length)}%
                    </h4>
                    <small className="text-muted">Avg Progress</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SavingsPlansList;
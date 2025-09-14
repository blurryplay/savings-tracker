import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Badge, 
  Button, 
  Form, 
  Row, 
  Col, 
  Spinner,
  Alert,
  InputGroup,
  Pagination
} from 'react-bootstrap';
import { formatKSH, formatDate } from '../utils/formatters';
import { savingsAPI } from '../services/api';

const ContributionHistory = ({ plans }) => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    planId: '',
    type: 'all', // all, contributions, withdrawals
    searchTerm: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    loadContributions();
  }, [filters, pagination.offset]);

  const loadContributions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await savingsAPI.getContributions({
        limit: pagination.limit,
        offset: pagination.offset,
        planId: filters.planId || undefined
      });
      
      let filteredContributions = response.contributions;

      // Apply filters
      if (filters.type === 'contributions') {
        filteredContributions = filteredContributions.filter(c => c.amount > 0);
      } else if (filters.type === 'withdrawals') {
        filteredContributions = filteredContributions.filter(c => c.amount < 0);
      }

      if (filters.searchTerm) {
        filteredContributions = filteredContributions.filter(c => 
          c.plan.goalName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
        );
      }

      setContributions(filteredContributions);
      setPagination(prev => ({ ...prev, ...response.pagination }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset pagination when filtering
  };

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const getTransactionType = (amount) => {
    if (amount > 0) {
      return { type: 'Contribution', variant: 'success', icon: '📈' };
    } else {
      return { type: 'Withdrawal', variant: 'danger', icon: '📉' };
    }
  };

  const exportToCSV = () => {
    if (contributions.length === 0) return;
    
    const csvData = contributions.map(contribution => ({
      Date: formatDate(contribution.createdAt),
      Plan: contribution.plan.goalName,
      Type: contribution.amount > 0 ? 'Contribution' : 'Withdrawal',
      Amount: Math.abs(contribution.amount),
      Description: contribution.description || '',
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savings_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalContributions = contributions
    .filter(c => c.amount > 0)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalWithdrawals = contributions
    .filter(c => c.amount < 0)
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">📊 Transaction History</h2>
          <p className="text-muted mb-0">
            Complete record of all your savings activities
          </p>
        </div>
        <Button 
          variant="outline-primary" 
          onClick={exportToCSV}
          disabled={contributions.length === 0}
        >
          <i className="bi bi-download me-2"></i>
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-success mb-2">📈</div>
              <h5 className="text-success mb-1">{formatKSH(totalContributions)}</h5>
              <small className="text-muted">Total Contributions</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-danger mb-2">📉</div>
              <h5 className="text-danger mb-1">{formatKSH(totalWithdrawals)}</h5>
              <small className="text-muted">Total Withdrawals</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-6 text-primary mb-2">💰</div>
              <h5 className="text-primary mb-1">{formatKSH(totalContributions - totalWithdrawals)}</h5>
              <small className="text-muted">Net Savings</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Label className="fw-bold">Filter by Plan:</Form.Label>
              <Form.Select
                value={filters.planId}
                onChange={(e) => handleFilterChange('planId', e.target.value)}
              >
                <option value="">All Plans</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.goalName}
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={3}>
              <Form.Label className="fw-bold">Transaction Type:</Form.Label>
              <Form.Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="contributions">Contributions Only</option>
                <option value="withdrawals">Withdrawals Only</option>
              </Form.Select>
            </Col>
            
            <Col md={6}>
              <Form.Label className="fw-bold">Search:</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  🔍
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by plan name or description..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* History Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <h5 className="mb-0">Transaction Details</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading transaction history...</p>
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 mb-3">📊</div>
              <h5>No transactions found</h5>
              <p className="text-muted">
                {filters.planId || filters.type !== 'all' || filters.searchTerm
                  ? 'Try adjusting your filters to see more results'
                  : 'Start making contributions to see your transaction history here'
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date & Time</th>
                    <th>Savings Plan</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((contribution) => {
                    const transaction = getTransactionType(contribution.amount);
                    return (
                      <tr key={contribution.id} className="transaction-row">
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-medium">
                              {formatDate(contribution.createdAt)}
                            </span>
                          </div>
                        </td>
                        
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-medium">
                              {contribution.plan.goalName}
                            </span>
                          </div>
                        </td>
                        
                        <td>
                          <Badge 
                            bg={transaction.variant} 
                            className="d-flex align-items-center transaction-type-badge"
                          >
                            <span className="me-1">{transaction.icon}</span>
                            {transaction.type}
                          </Badge>
                        </td>
                        
                        <td>
                          <span className={`fw-bold ${contribution.amount > 0 ? 'text-success' : 'text-danger'}`}>
                            {contribution.amount > 0 ? '+' : '-'}{formatKSH(Math.abs(contribution.amount))}
                          </span>
                        </td>
                        
                        <td>
                          <span className="text-muted">
                            {contribution.description || 'No description'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        
        {/* Pagination */}
        {contributions.length > 0 && pagination.total > pagination.limit && (
          <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} transactions
            </small>
            
            <Pagination className="mb-0">
              <Pagination.Prev 
                disabled={pagination.offset === 0}
                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              />
              
              {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => {
                const pageOffset = i * pagination.limit;
                const isActive = pageOffset === pagination.offset;
                
                return (
                  <Pagination.Item
                    key={i}
                    active={isActive}
                    onClick={() => handlePageChange(pageOffset)}
                  >
                    {i + 1}
                  </Pagination.Item>
                );
              })}
              
              <Pagination.Next 
                disabled={!pagination.hasMore}
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              />
            </Pagination>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
};

export default ContributionHistory;
import React, { useState } from 'react';
import { Modal, Form, Button, Alert, InputGroup, ProgressBar } from 'react-bootstrap';
import { isValidAmount, formatKSH, formatPercentage, getProgressColor } from '../utils/formatters';

const WithdrawModal = ({ show, onHide, plan, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount) {
      newErrors.amount = 'Withdrawal amount is required';
    } else if (!isValidAmount(formData.amount)) {
      newErrors.amount = 'Please enter a valid positive amount';
    } else if (parseFloat(formData.amount) > plan.currentBalance) {
      newErrors.amount = `Cannot withdraw more than current balance (${formatKSH(plan.currentBalance)})`;
    } else if (parseFloat(formData.amount) < 10) {
      newErrors.amount = 'Minimum withdrawal is KSH 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || 'Withdrawal'
      });
      
      // Reset form
      setFormData({ amount: '', description: '' });
      setErrors({});
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ amount: '', description: '' });
    setErrors({});
    onHide();
  };

  // Calculate preview values
  const getPreviewValues = () => {
    if (!isValidAmount(formData.amount)) {
      return {
        newBalance: plan.currentBalance,
        newProgress: plan.progressPercentage
      };
    }

    const withdrawalAmount = parseFloat(formData.amount);
    const newBalance = Math.max(0, plan.currentBalance - withdrawalAmount);
    const newProgress = (newBalance / plan.targetAmount) * 100;

    return { newBalance, newProgress };
  };

  const preview = getPreviewValues();

  // Quick withdrawal amounts (percentage of current balance)
  const getQuickAmounts = () => {
    const percentages = [25, 50, 75, 100];
    return percentages.map(pct => ({
      label: `${pct}%`,
      amount: Math.floor((plan.currentBalance * pct) / 100)
    })).filter(item => item.amount >= 10);
  };

  const quickAmounts = getQuickAmounts();

  if (!plan || plan.currentBalance <= 0) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="border-bottom-0">
        <Modal.Title className="d-flex align-items-center">
          <span className="me-2">💳</span>
          Withdraw from "{plan.goalName}"
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-0">
          {/* Warning Alert */}
          <Alert variant="warning" className="border-0">
            <div className="d-flex align-items-center">
              <span className="me-2">⚠️</span>
              <div>
                <strong>Think carefully!</strong> Withdrawing money will reduce your progress towards your goal.
                Only withdraw if absolutely necessary.
              </div>
            </div>
          </Alert>

          {/* Current Plan Status */}
          <div className="card bg-light mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3">Current Status</h6>
              <div className="row g-3 mb-3">
                <div className="col-4 text-center">
                  <small className="text-muted">Available Balance</small>
                  <div className="fw-bold text-success">
                    {formatKSH(plan.currentBalance)}
                  </div>
                </div>
                <div className="col-4 text-center">
                  <small className="text-muted">Target Amount</small>
                  <div className="fw-bold text-primary">
                    {formatKSH(plan.targetAmount)}
                  </div>
                </div>
                <div className="col-4 text-center">
                  <small className="text-muted">Progress</small>
                  <div className="fw-bold text-info">
                    {formatPercentage(plan.progressPercentage)}
                  </div>
                </div>
              </div>
              <ProgressBar 
                now={Math.min(plan.progressPercentage, 100)} 
                variant={getProgressColor(plan.progressPercentage)}
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          {quickAmounts.length > 0 && (
            <div className="mb-3">
              <Form.Label className="fw-bold">Quick Amounts:</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {quickAmounts.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline-warning"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, amount: item.amount.toString() }))}
                  >
                    {item.label} ({formatKSH(item.amount)})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawal Amount */}
          <div className="mb-3">
            <Form.Label className="fw-bold">
              Withdrawal Amount <span className="text-danger">*</span>
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>KSH</InputGroup.Text>
              <Form.Control
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="10"
                max={plan.currentBalance}
                step="0.01"
                isInvalid={!!errors.amount}
                autoFocus
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.amount}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Maximum: {formatKSH(plan.currentBalance)} | Minimum: KSH 10.00
            </Form.Text>
          </div>

          {/* Reason for Withdrawal */}
          <div className="mb-4">
            <Form.Label className="fw-bold">
              Reason for Withdrawal <span className="text-muted">(Optional)</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Emergency expense, Urgent need, Transferred to another account..."
              maxLength={200}
            />
            <Form.Text className="text-muted">
              Help yourself track why you made this withdrawal
            </Form.Text>
          </div>

          {/* Preview */}
          {isValidAmount(formData.amount) && parseFloat(formData.amount) <= plan.currentBalance && (
            <div className="mb-3">
              <Form.Label className="fw-bold">Preview After Withdrawal:</Form.Label>
              <div className="card border-warning">
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-4 text-center">
                      <small className="text-muted">New Balance</small>
                      <div className="fw-bold text-success">
                        {formatKSH(preview.newBalance)}
                      </div>
                      <small className="text-danger">
                        -{formatKSH(parseFloat(formData.amount))}
                      </small>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted">New Progress</small>
                      <div className="fw-bold text-primary">
                        {formatPercentage(preview.newProgress)}
                      </div>
                      <small className="text-danger">
                        -{formatPercentage(plan.progressPercentage - preview.newProgress)}
                      </small>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted">Still Needed</small>
                      <div className="fw-bold text-warning">
                        {formatKSH(plan.targetAmount - preview.newBalance)}
                      </div>
                    </div>
                  </div>
                  <ProgressBar 
                    now={Math.min(preview.newProgress, 100)} 
                    variant={getProgressColor(preview.newProgress)}
                  />
                  {preview.newProgress < 25 && (
                    <div className="text-center mt-2">
                      <span className="badge bg-warning text-dark">
                        ⚠️ Progress will drop significantly
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Checkbox for Large Withdrawals */}
          {isValidAmount(formData.amount) && parseFloat(formData.amount) > (plan.currentBalance * 0.5) && (
            <div className="mb-3">
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="confirmLargeWithdrawal"
                  required
                />
                <label className="form-check-label text-warning" htmlFor="confirmLargeWithdrawal">
                  <strong>I understand that I'm withdrawing more than 50% of my savings</strong>
                </label>
              </div>
            </div>
          )}

          {/* Motivational Note */}
          <Alert variant="info" className="border-0">
            <div className="d-flex align-items-center">
              <span className="me-2">💡</span>
              <div>
                <strong>Remember:</strong> You can always add money back to this goal later. 
                Consider if this withdrawal is truly necessary for your financial wellbeing.
              </div>
            </div>
          </Alert>
        </Modal.Body>

        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="warning" 
            type="submit" 
            disabled={loading || !isValidAmount(formData.amount) || parseFloat(formData.amount) > plan.currentBalance}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-dash-circle me-2"></i>
                Withdraw {formData.amount ? formatKSH(parseFloat(formData.amount)) : 'Money'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default WithdrawModal;
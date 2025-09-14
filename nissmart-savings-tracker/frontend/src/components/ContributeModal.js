import React, { useState } from 'react';
import { Modal, Form, Button, Alert, InputGroup, ProgressBar } from 'react-bootstrap';
import { isValidAmount, formatKSH, formatPercentage, getProgressColor } from '../utils/formatters';

const ContributeModal = ({ show, onHide, plan, onSubmit }) => {
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
      newErrors.amount = 'Contribution amount is required';
    } else if (!isValidAmount(formData.amount)) {
      newErrors.amount = 'Please enter a valid positive amount';
    } else if (parseFloat(formData.amount) < 10) {
      newErrors.amount = 'Minimum contribution is KSH 10';
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
        description: formData.description.trim() || null
      });
      
      // Reset form
      setFormData({ amount: '', description: '' });
      setErrors({});
    } catch (error) {
      console.error('Error adding contribution:', error);
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
        newProgress: plan.progressPercentage,
        remaining: plan.targetAmount - plan.currentBalance
      };
    }

    const contributionAmount = parseFloat(formData.amount);
    const newBalance = plan.currentBalance + contributionAmount;
    const newProgress = Math.min((newBalance / plan.targetAmount) * 100, 100);
    const remaining = Math.max(0, plan.targetAmount - newBalance);

    return { newBalance, newProgress, remaining };
  };

  const preview = getPreviewValues();

  // Quick contribution amounts
  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

  if (!plan) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="border-bottom-0">
        <Modal.Title className="d-flex align-items-center">
          <span className="me-2">💰</span>
          Add Money to "{plan.goalName}"
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-0">
          {/* Current Plan Status */}
          <div className="card bg-light mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3">Current Status</h6>
              <div className="row g-3 mb-3">
                <div className="col-4 text-center">
                  <small className="text-muted">Current Balance</small>
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
                  <small className="text-muted">Remaining</small>
                  <div className="fw-bold text-warning">
                    {formatKSH(plan.targetAmount - plan.currentBalance)}
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">Progress</small>
                  <small className="fw-bold">
                    {formatPercentage(plan.progressPercentage)}
                  </small>
                </div>
                <ProgressBar 
                  now={Math.min(plan.progressPercentage, 100)} 
                  variant={getProgressColor(plan.progressPercentage)}
                />
              </div>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="mb-3">
            <Form.Label className="fw-bold">Quick Amounts:</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline-success"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                >
                  {formatKSH(amount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Contribution Amount */}
          <div className="mb-3">
            <Form.Label className="fw-bold">
              Contribution Amount <span className="text-danger">*</span>
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
                step="0.01"
                isInvalid={!!errors.amount}
                autoFocus
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.amount}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Minimum contribution: KSH 10.00
            </Form.Text>
          </div>

          {/* Description */}
          <div className="mb-4">
            <Form.Label className="fw-bold">
              Description <span className="text-muted">(Optional)</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Monthly allowance, Gift money, Salary..."
              maxLength={100}
            />
            <Form.Text className="text-muted">
              Add a note to remember where this money came from
            </Form.Text>
          </div>

          {/* Preview */}
          {isValidAmount(formData.amount) && (
            <div className="mb-3">
              <Form.Label className="fw-bold">Preview After Contribution:</Form.Label>
              <div className="card border-success">
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-4 text-center">
                      <small className="text-muted">New Balance</small>
                      <div className="fw-bold text-success">
                        {formatKSH(preview.newBalance)}
                      </div>
                      <small className="text-success">
                        +{formatKSH(parseFloat(formData.amount))}
                      </small>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted">New Progress</small>
                      <div className="fw-bold text-primary">
                        {formatPercentage(preview.newProgress)}
                      </div>
                      <small className="text-primary">
                        +{formatPercentage(preview.newProgress - plan.progressPercentage)}
                      </small>
                    </div>
                    <div className="col-4 text-center">
                      <small className="text-muted">Still Needed</small>
                      <div className="fw-bold text-warning">
                        {formatKSH(preview.remaining)}
                      </div>
                    </div>
                  </div>
                  <ProgressBar 
                    now={Math.min(preview.newProgress, 100)} 
                    variant={getProgressColor(preview.newProgress)}
                  />
                  {preview.newProgress >= 100 && (
                    <div className="text-center mt-2">
                      <span className="badge bg-success">
                        🎉 Goal Completed!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <Alert variant="success" className="border-0">
            <div className="d-flex align-items-center">
              <span className="me-2">🌟</span>
              <div>
                <strong>Keep it up!</strong> Every contribution brings you closer to your goal. 
                {plan.progressPercentage >= 50 
                  ? " You're over halfway there!"
                  : " Small steps lead to big achievements!"
                }
              </div>
            </div>
          </Alert>
        </Modal.Body>

        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || !isValidAmount(formData.amount)}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Adding...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Add {formData.amount ? formatKSH(parseFloat(formData.amount)) : 'Money'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ContributeModal;
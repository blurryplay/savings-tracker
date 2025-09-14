import React, { useState } from 'react';
import { Modal, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { isValidAmount, formatKSH } from '../utils/formatters';

const CreatePlanModal = ({ show, onHide, onSubmit }) => {
  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: ''
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

    if (!formData.goalName.trim()) {
      newErrors.goalName = 'Goal name is required';
    } else if (formData.goalName.trim().length < 3) {
      newErrors.goalName = 'Goal name must be at least 3 characters long';
    }

    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Target amount is required';
    } else if (!isValidAmount(formData.targetAmount)) {
      newErrors.targetAmount = 'Please enter a valid positive amount';
    } else if (parseFloat(formData.targetAmount) < 100) {
      newErrors.targetAmount = 'Target amount must be at least KSH 100';
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
        goalName: formData.goalName.trim(),
        targetAmount: parseFloat(formData.targetAmount)
      });
      
      // Reset form
      setFormData({ goalName: '', targetAmount: '' });
      setErrors({});
    } catch (error) {
      console.error('Error creating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ goalName: '', targetAmount: '' });
    setErrors({});
    onHide();
  };

  const getPreviewAmount = () => {
    if (isValidAmount(formData.targetAmount)) {
      return formatKSH(parseFloat(formData.targetAmount));
    }
    return 'KSH 0.00';
  };

  // Suggested goals for quick selection
  const suggestedGoals = [
    { name: 'School Fees - Term 1', amount: 15000 },
    { name: 'School Fees - Term 2', amount: 15000 },
    { name: 'School Fees - Term 3', amount: 15000 },
    { name: 'School Uniforms', amount: 5000 },
    { name: 'Books & Stationery', amount: 3000 },
    { name: 'Transport Fees', amount: 8000 },
    { name: 'Emergency Fund', amount: 10000 },
    { name: 'Laptop/Computer', amount: 50000 }
  ];

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="border-bottom-0">
        <Modal.Title className="d-flex align-items-center">
          <span className="me-2">🎯</span>
          Create New Savings Plan
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-0">
          {/* Quick Suggestions */}
          <div className="mb-4">
            <label className="form-label fw-bold">Quick Suggestions:</label>
            <div className="d-flex flex-wrap gap-2">
              {suggestedGoals.map((goal, index) => (
                <Button
                  key={index}
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setFormData({
                    goalName: goal.name,
                    targetAmount: goal.amount.toString()
                  })}
                >
                  {goal.name} ({formatKSH(goal.amount)})
                </Button>
              ))}
            </div>
          </div>

          {/* Goal Name */}
          <div className="mb-3">
            <Form.Label className="fw-bold">
              Goal Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="goalName"
              value={formData.goalName}
              onChange={handleChange}
              placeholder="e.g., School Fees - Term 1, Emergency Fund..."
              isInvalid={!!errors.goalName}
              maxLength={100}
            />
            <Form.Control.Feedback type="invalid">
              {errors.goalName}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Choose a descriptive name for your savings goal
            </Form.Text>
          </div>

          {/* Target Amount */}
          <div className="mb-4">
            <Form.Label className="fw-bold">
              Target Amount <span className="text-danger">*</span>
            </Form.Label>
            <InputGroup>
              <InputGroup.Text>KSH</InputGroup.Text>
              <Form.Control
                type="number"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                placeholder="0.00"
                min="100"
                step="0.01"
                isInvalid={!!errors.targetAmount}
              />
            </InputGroup>
            <Form.Control.Feedback type="invalid">
              {errors.targetAmount}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Minimum amount: KSH 100.00
            </Form.Text>
          </div>

          {/* Preview Card */}
          {(formData.goalName || formData.targetAmount) && (
            <div className="mb-3">
              <label className="form-label fw-bold">Preview:</label>
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">
                    {formData.goalName || 'Your Goal Name'}
                  </h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted">Current Balance</small>
                      <div className="fw-bold text-success">KSH 0.00</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Target Amount</small>
                      <div className="fw-bold text-primary">
                        {getPreviewAmount()}
                      </div>
                    </div>
                  </div>
                  <div className="progress mt-2" style={{ height: '8px' }}>
                    <div className="progress-bar" style={{ width: '0%' }}></div>
                  </div>
                  <small className="text-muted">0% complete</small>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <Alert variant="info" className="border-0">
            <Alert.Heading className="h6 mb-2">💡 Pro Tips:</Alert.Heading>
            <ul className="mb-0 small">
              <li>Set realistic and specific goals</li>
              <li>Break large goals into smaller milestones</li>
              <li>Consider setting up automatic contributions</li>
              <li>Review and adjust your targets regularly</li>
            </ul>
          </Alert>
        </Modal.Body>

        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Create Plan
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreatePlanModal;
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Navbar, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Dashboard from './components/Dashboard';
import SavingsPlansList from './components/SavingsPlansList';
import CreatePlanModal from './components/CreatePlanModal';
import ContributeModal from './components/ContributeModal';
import WithdrawModal from './components/WithdrawModal';

import { savingsAPI } from './services/api';

function App() {
  const [plans, setPlans] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [plansData, dashboardData] = await Promise.all([
        savingsAPI.getPlans(),
        savingsAPI.getDashboard()
      ]);
      
      setPlans(plansData);
      setDashboardData(dashboardData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (planData) => {
    try {
      setError('');
      const newPlan = await savingsAPI.createPlan(planData);
      setPlans([newPlan, ...plans]);
      setShowCreateModal(false);
      setSuccess('Savings plan created successfully! 🎉');
      
      // Refresh dashboard data
      const updatedDashboard = await savingsAPI.getDashboard();
      setDashboardData(updatedDashboard);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleContribute = async (contributionData) => {
    try {
      setError('');
      const result = await savingsAPI.addContribution(selectedPlan.id, contributionData);
      
      // Update the plan in the list
      setPlans(plans.map(plan => 
        plan.id === selectedPlan.id ? result.plan : plan
      ));
      
      setShowContributeModal(false);
      setSelectedPlan(null);
      setSuccess(`Contribution of KSH ${contributionData.amount} added successfully! 💰`);
      
      // Refresh dashboard data
      const updatedDashboard = await savingsAPI.getDashboard();
      setDashboardData(updatedDashboard);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleWithdraw = async (withdrawalData) => {
    try {
      setError('');
      const result = await savingsAPI.withdrawFromPlan(selectedPlan.id, withdrawalData);
      
      // Update the plan in the list
      setPlans(plans.map(plan => 
        plan.id === selectedPlan.id ? result.plan : plan
      ));
      
      setShowWithdrawModal(false);
      setSelectedPlan(null);
      setSuccess(`Withdrawal of KSH ${withdrawalData.amount} processed successfully! 💳`);
      
      // Refresh dashboard data
      const updatedDashboard = await savingsAPI.getDashboard();
      setDashboardData(updatedDashboard);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this savings plan? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await savingsAPI.deletePlan(planId);
      setPlans(plans.filter(plan => plan.id !== planId));
      setSuccess('Savings plan deleted successfully! 🗑️');
      
      // Refresh dashboard data
      const updatedDashboard = await savingsAPI.getDashboard();
      setDashboardData(updatedDashboard);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const openContributeModal = (plan) => {
    setSelectedPlan(plan);
    setShowContributeModal(true);
  };

  const openWithdrawModal = (plan) => {
    setSelectedPlan(plan);
    setShowWithdrawModal(true);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <div className="mt-3">
            <h5>Loading your savings...</h5>
            <p className="text-muted">Please wait while we fetch your data</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="App">
      {/* Navigation */}
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#" className="fw-bold">
            💰 Nissmart Savings Tracker
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              active={activeTab === 'plans'} 
              onClick={() => setActiveTab('plans')}
            >
              My Plans
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container>
        {/* Alerts */}
        {error && (
          <Alert 
            variant="danger" 
            onClose={() => setError('')} 
            dismissible
            className="mb-4"
          >
            <Alert.Heading>⚠️ Error</Alert.Heading>
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            variant="success" 
            onClose={() => setSuccess('')} 
            dismissible
            className="mb-4"
          >
            {success}
          </Alert>
        )}

        {/* Main Content */}
        <Row>
          <Col>
            {activeTab === 'dashboard' && (
              <Dashboard 
                data={dashboardData} 
                onCreatePlan={() => setShowCreateModal(true)}
                onSwitchToPlans={() => setActiveTab('plans')}
              />
            )}

            {activeTab === 'plans' && (
              <SavingsPlansList
                plans={plans}
                onCreatePlan={() => setShowCreateModal(true)}
                onContribute={openContributeModal}
                onWithdraw={openWithdrawModal}
                onDelete={handleDeletePlan}
              />
            )}
          </Col>
        </Row>

        {/* Modals */}
        <CreatePlanModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onSubmit={handleCreatePlan}
        />

        {selectedPlan && (
          <>
            <ContributeModal
              show={showContributeModal}
              onHide={() => {
                setShowContributeModal(false);
                setSelectedPlan(null);
              }}
              plan={selectedPlan}
              onSubmit={handleContribute}
            />

            <WithdrawModal
              show={showWithdrawModal}
              onHide={() => {
                setShowWithdrawModal(false);
                setSelectedPlan(null);
              }}
              plan={selectedPlan}
              onSubmit={handleWithdraw}
            />
          </>
        )}
      </Container>

      {/* Footer */}
      <footer className="bg-light text-center py-3 mt-5">
        <Container>
          <small className="text-muted">
            © 2025 Nissmart. Empowering Families. Equipping Institutions. Transforming Generations.
          </small>
        </Container>
      </footer>
    </div>
  );
}

export default App;
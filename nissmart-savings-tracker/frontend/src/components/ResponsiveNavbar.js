import React, { useState } from 'react';
import { Navbar, Nav, Container, Offcanvas } from 'react-bootstrap';

const ResponsiveNavbar = ({ activeTab, onTabChange }) => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const handleClose = () => setShowOffcanvas(false);
  const handleShow = () => setShowOffcanvas(true);

  const handleNavClick = (tab) => {
    onTabChange(tab);
    handleClose(); // Close mobile menu after selection
  };

  const navItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'plans', icon: '🎯', label: 'My Plans' },
    { key: 'analytics', icon: '📈', label: 'Analytics' },
    { key: 'history', icon: '📋', label: 'History' }
  ];

  return (
    <>
      {/* Desktop/Tablet Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4 d-none d-lg-flex">
        <Container>
          <Navbar.Brand href="#" className="fw-bold d-flex align-items-center">
            <span className="me-2">💰</span>
            <span className="d-none d-md-inline">Nissmart Savings Tracker</span>
            <span className="d-md-none">Nissmart</span>
          </Navbar.Brand>
          
          <Nav className="ms-auto">
            {navItems.map((item) => (
              <Nav.Link
                key={item.key}
                active={activeTab === item.key}
                onClick={() => onTabChange(item.key)}
                className="d-flex align-items-center px-3 mx-1"
              >
                <span className="me-2">{item.icon}</span>
                <span className="d-none d-xl-inline">{item.label}</span>
                <span className="d-xl-none">{item.label.split(' ')[0]}</span>
              </Nav.Link>
            ))}
          </Nav>
        </Container>
      </Navbar>

      {/* Mobile Navbar with Hamburger Menu */}
      <Navbar bg="primary" variant="dark" className="mb-4 d-lg-none">
        <Container>
          <Navbar.Brand href="#" className="fw-bold d-flex align-items-center">
            <span className="me-2">💰</span>
            <span>Nissmart</span>
          </Navbar.Brand>

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={handleShow}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Current Tab Indicator */}
          <div className="d-flex align-items-center text-white-50 me-3">
            <span className="me-1">
              {navItems.find(item => item.key === activeTab)?.icon}
            </span>
            <small className="fw-medium">
              {navItems.find(item => item.key === activeTab)?.label}
            </small>
          </div>
        </Container>
      </Navbar>

      {/* Mobile Offcanvas Menu */}
      <Offcanvas
        show={showOffcanvas}
        onHide={handleClose}
        placement="end"
        className="bg-primary text-white"
      >
        <Offcanvas.Header closeButton className="border-bottom border-white-25">
          <Offcanvas.Title className="d-flex align-items-center">
            <span className="me-2">💰</span>
            Nissmart Savings
          </Offcanvas.Title>
        </Offcanvas.Header>
        
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Link
                key={item.key}
                active={activeTab === item.key}
                onClick={() => handleNavClick(item.key)}
                className={`d-flex align-items-center py-3 px-4 text-white border-bottom border-white-25 ${
                  activeTab === item.key ? 'bg-white bg-opacity-20' : ''
                }`}
              >
                <span className="me-3 fs-5">{item.icon}</span>
                <div>
                  <div className="fw-medium">{item.label}</div>
                  <small className="text-white-75">
                    {getNavDescription(item.key)}
                  </small>
                </div>
                {activeTab === item.key && (
                  <span className="ms-auto">✓</span>
                )}
              </Nav.Link>
            ))}
          </Nav>

          {/* Mobile Menu Footer */}
          <div className="mt-auto p-4 border-top border-white-25">
            <small className="text-white-75 d-block text-center">
              Empowering Families<br/>
              Transforming Generations
            </small>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

// Helper function to get descriptions for nav items
const getNavDescription = (key) => {
  const descriptions = {
    dashboard: 'Overview & summary',
    plans: 'Manage your goals',
    analytics: 'Charts & insights',
    history: 'Transaction records'
  };
  return descriptions[key] || '';
};

export default ResponsiveNavbar;
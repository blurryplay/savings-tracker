// Format currency for Kenyan Shillings
export const formatKSH = (amount) => {
  if (amount == null) return 'KSH 0.00';
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount).replace('KES', 'KSH');
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format percentage
export const formatPercentage = (percentage) => {
  return `${Math.round(percentage)}%`;
};

// Validate positive number
export const isValidAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

// Get progress bar color based on percentage
export const getProgressColor = (percentage) => {
  if (percentage >= 100) return 'success';
  if (percentage >= 75) return 'info';
  if (percentage >= 50) return 'warning';
  return 'danger';
};

// Truncate text
export const truncateText = (text, maxLength = 30) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
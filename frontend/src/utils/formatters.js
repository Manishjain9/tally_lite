export const formatCurrency = (amount, currency = '₹') => {
  if (!amount && amount !== 0) return `${currency} 0`;
  return `${currency} ${parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date, format = 'DD-MM-YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'DD-MM-YYYY') return `${day}-${month}-${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return date;
};

export const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  const date = formatDate(dateTime);
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-IN');
};

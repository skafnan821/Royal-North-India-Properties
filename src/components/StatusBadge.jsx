const map = {
  Available: 'green', Paid: 'green', Active: 'green', Accepted: 'green',
  Rented: 'blue', New: 'blue', Pending: 'amber',
  Overdue: 'red', Expired: 'red', Rejected: 'red',
  Inactive: 'gray', Closed: 'gray',
};
export default function StatusBadge({ status }) {
  return <span className={`badge ${map[status] || 'gray'}`}>{status}</span>;
}

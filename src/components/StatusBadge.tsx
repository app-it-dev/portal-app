import type { PostStatus } from '@/types';

interface StatusBadgeProps {
  status: PostStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: PostStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          className: 'badge badge-default',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          className: 'badge badge-destructive',
        };
      case 'analyzing':
        return {
          label: 'Analyzing',
          className: 'badge badge-warning',
        };
      case 'parsed':
        return {
          label: 'Parsed',
          className: 'badge badge-info',
        };
      case 'ready':
        return {
          label: 'Ready',
          className: 'badge badge-success',
        };
      case 'inserted':
        return {
          label: 'Inserted',
          className: 'badge badge-purple',
        };
      default:
        return {
          label: status,
          className: 'badge badge-default',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
}

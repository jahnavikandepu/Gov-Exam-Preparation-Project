import React from 'react';
import { AlertCircle, FolderSearch, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const LoadingState = ({
  message = 'Loading data...',
  fullPage = false,
}) => {
  const container = fullPage
    ? 'min-h-[60vh] flex flex-col items-center justify-center'
    : 'py-12 flex flex-col items-center justify-center';

  return (
    <div className={container}>
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
      </div>
      <p className="mt-4 text-base font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};

export const EmptyState = ({
  title = 'No records found',
  description = 'There are no items matching your criteria at this moment.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="py-12 px-6 text-center max-w-md mx-auto flex flex-col items-center">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <FolderSearch className="h-7 w-7" />}
      </div>
      <h4 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h4>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button size="md" variant="outline" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
}) => {
  return (
    <div className="py-12 px-6 text-center max-w-md mx-auto flex flex-col items-center">
      <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h4 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h4>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button size="md" variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

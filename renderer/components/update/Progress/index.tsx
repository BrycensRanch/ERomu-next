import React from 'react';

const Progress: React.FC<
  React.PropsWithChildren<{
    percent?: number;
  }>
> = props => {
  const { percent = 0 } = props;

  return (
    <div className="update-progress">
      <div className="update-progress-pr">
        <div className="update-progress-rate" style={{ width: `${3 * percent}px` }} />
      </div>
      <span className="update-progress-num">{(percent ?? 0).toString().slice(0, 4)}%</span>
    </div>
  );
};

export default Progress;

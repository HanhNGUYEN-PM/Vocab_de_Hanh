import React from 'react';

interface StarIconProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean;
}

const StarIcon: React.FC<StarIconProps> = ({ filled = false, className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2.75l2.92 5.92 6.54.95-4.73 4.61 1.12 6.52L12 17.77l-5.85 3.08 1.12-6.52-4.73-4.61 6.54-.95L12 2.75z" />
  </svg>
);

export default StarIcon;

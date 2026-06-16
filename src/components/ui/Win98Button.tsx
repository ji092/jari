import React from 'react';

interface Win98ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'danger';
  fullWidth?: boolean;
}

export const Win98Button: React.FC<Win98ButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyle = "px-3 py-1 font-sans text-sm outline-none select-none select-none transition-all duration-75 active:translate-x-[1px] active:translate-y-[1px]";
  
  // Custom 98 border classes
  const activeAndNormalStyle = disabled
    ? "bg-[#c0c0c0] text-[#808080] border-t-2 border-l-2 border-[#fff] border-b-2 border-r-2 border-[#808080] opacity-65 cursor-not-allowed"
    : "bg-[#c0c0c0] text-black win-raised active:border-t-2 active:border-l-2 active:border-[#808080] active:border-b-2 active:border-r-2 active:border-[#fff] active:shadow-[-1px_-1px_0px_0px_#000]";

  const widthStyle = fullWidth ? "w-full" : "";
  
  // Accent styles (e.g. bold font for primary)
  const variantStyle = variant === 'primary' 
    ? "font-bold border-2" // standard primary is just bold in classic win98
    : variant === 'danger'
      ? "hover:bg-[#ff8080] hover:text-white"
      : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${activeAndNormalStyle} ${widthStyle} ${variantStyle} ${className}`}
      {...props}
    >
      <span className="flex items-center justify-center gap-1 active:translate-x-[1px] active:translate-y-[1px]">
        {children}
      </span>
    </button>
  );
};

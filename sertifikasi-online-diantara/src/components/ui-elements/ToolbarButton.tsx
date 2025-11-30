interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ToolbarButton = ({
  onClick,
  isActive,
  children,
  className = "",
}: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isActive ? "bg-gray-200 dark:bg-gray-600" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};

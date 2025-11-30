// components/Modal/index.tsx

type ModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  title?: string; // tambahkan ini
};

export default function Modal({ children, onClose, title }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow dark:bg-dark-2">
        {title && (
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
        )}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-gray-200 p-1 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

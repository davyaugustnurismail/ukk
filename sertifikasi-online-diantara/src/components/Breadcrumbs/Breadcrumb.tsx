import Link from "next/link";

interface BreadcrumbProps {
  mainMenu: string;
  pageName: string;
}

const Breadcrumb = ({ mainMenu, pageName }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <span className="font-medium">{mainMenu} /</span>
          </li>
          <li className="font-medium text-primary">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;

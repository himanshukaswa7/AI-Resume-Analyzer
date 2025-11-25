import { Link } from "react-router";

interface NavbarProps {
  showWipe?: boolean;
  onWipe?: () => void;
  wipeDisabled?: boolean;
}

const Navbar = ({ showWipe, onWipe, wipeDisabled }: NavbarProps) => {
  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">RESUMIND</p>
      </Link>
      <div className="flex items-center gap-3">
        {showWipe && (
          <Link to="/wipe" className="danger-button w-fit" aria-label="Open wipe page">
            Manage Data
          </Link>
        )}
        <Link to="/upload" className="primary-button w-fit" aria-label="Upload resume">
          Upload Resume
        </Link>
      </div>
    </nav>
  );
};

export default Navbar
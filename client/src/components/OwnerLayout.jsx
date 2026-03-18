import { Outlet } from 'react-router-dom';
import OwnerSidebar from './OwnerSidebar';

function OwnerLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar />
      <div className="flex-1 ml-64 p-8">
        <Outlet />
      </div>
    </div>
  );
}

export default OwnerLayout;

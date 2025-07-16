import { useState } from 'react';
import AssignmentSidebar from './AssignmentSidebar';
import ModalPortal from '../utils/ModalPortal';

function JobCell({ date, subcontractor, value, onChange, jobs }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (newJob) => {
    console.log('Saving job:', newJob);
    onChange(newJob);
    setIsOpen(false);
  };

  const handleClick = (e) => {
    console.log('Cell clicked, props:', { date, subcontractor, value, jobs });
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  console.log('JobCell render - isOpen:', isOpen);

  return (
    <>
      {/* Remove the <td> wrapper - let the parent component handle table structure */}
      <div
        onClick={handleClick}
        className="text-sm px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-center"
      >
        {value ? value : <span className="text-gray-400">+</span>}
      </div>

      {isOpen && (
        <ModalPortal>
          <AssignmentSidebar
            date={date}
            subcontractor={subcontractor}
            currentAssignment={value}
            jobs={jobs}
            onSave={handleSave}
            onClose={() => {
              console.log('Closing sidebar');
              setIsOpen(false);
            }}
          />
        </ModalPortal>
      )}
    </>
  );
}

export default JobCell;
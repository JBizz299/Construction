import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export default function ModalPortal({ children }) {
    // Ensure the modal-root exists
    useEffect(() => {
        let modalRoot = document.getElementById('modal-root');
        if (!modalRoot) {
            modalRoot = document.createElement('div');
            modalRoot.id = 'modal-root';
            document.body.appendChild(modalRoot);
        }
    }, []);

    const modalRoot = document.getElementById('modal-root');

    if (!modalRoot) {
        return null; // Don't render if modal-root doesn't exist
    }

    return createPortal(children, modalRoot);
}
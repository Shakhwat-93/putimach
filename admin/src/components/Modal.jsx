import React from 'react';
import './Modal.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export const Modal = ({ isOpen, onClose, title, subtitle, children, className = '', size }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent onClose={onClose} className={className} size={size}>
        {(title || subtitle) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

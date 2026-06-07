/**
 * Disclaimer Modal Component
 * Shows disclaimer on first load
 */

import React from 'react';
import Modal from './Modal';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAccept }) => {
  return (
    <Modal
      isOpen={isOpen}
      title="Welcome to Live TV"
      type="info"
      message="This application streams M3U/M3U8 playlists. Make sure to use only legally available and authorized streams."
      primaryAction={{
        label: 'I Understand',
        onClick: onAccept,
      }}
    >
      <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
        <li>Only stream authorized content</li>
        <li>Check local broadcasting laws</li>
        <li>Support official channels when possible</li>
      </ul>
    </Modal>
  );
};

export default DisclaimerModal;

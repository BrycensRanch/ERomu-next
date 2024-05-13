import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@nextui-org/react';
import Link from 'next/link';
import React, { useCallback, useEffect } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

export default function Disclaimer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEnabled, setIsEnabled] = React.useState(false);
  const handleOpen = () => {
    onOpen();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      setIsEnabled(window.electron.store.get('sessionReplay'));
      if (!window.electron.store.get('hasBeenShownDisclaimer') && window.isProduction) {
        handleOpen();
      }
    }
  }, [isEnabled]); // Empty dependency array ensures that this effect runs only once

  const handleToggle = useCallback(() => {
    setIsEnabled(prevIsEnabled => !prevIsEnabled);
    // Assuming you also want to update the value in electron.store
    // @ts-ignore
    window.electron.store.set('sessionReplay', !isEnabled);
  }, [isEnabled]);

  const buttonText = isEnabled ? (
    <FaTimes className="mr-2 size-5">Disable Session Replay </FaTimes>
  ) : (
    <FaCheck className="mr-2 size-5">Enable Session Replay</FaCheck>
  );

  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      onClose={() => {
        onClose();
        // @ts-ignore
        window.electron.store.set('hasBeenShownDisclaimer', true);
      }}
      className="bg-gray-700"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Enable Session Replay For Debug</ModalHeader>
        <ModalBody>
          {/* Disclaimer content directly added here */}
          <h2 className="mb-2 text-xl font-medium">Improving Your Experience with Rokon</h2>
          <p className="mb-4">
            We want to make sure you have the best possible experience using Rokon. To help us identify and fix any
            issues you might encounter, we use telemetry and a session replay on errors with limited data collection.
            This allows us to see what you see, and understand what you're experiencing, so we can fix it faster. To be
            clear, even with session replay disabled, we will still collect error reports and telemetry data.
          </p>
          {/* ... rest of the disclaimer content ... */}
          <div className="flex items-center justify-between">
            <Link href="/privacy-policy" className="text-blue-500 hover:underline">
              Learn more about session replay and privacy policy.
            </Link>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color={isEnabled ? 'danger' : 'success'}
            variant="solid"
            onPress={() => {
              handleToggle();
              onClose();
            }}
          >
            {buttonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

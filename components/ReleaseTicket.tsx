'use client';

import { useState } from 'react';
import { XCircle } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';

import { Button } from '@/components/ui/button';

export const ReleaseTicket = ({
  eventId,
  waitingListId,
}: {
  eventId: Id<'events'>;
  waitingListId: Id<'waitingList'>;
}) => {
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const releaseTicket = useMutation(api.waitingList.releaseTicket);

  const handleRelease = async () => {
    if (!confirm('Are you sure you want to release your ticket offer?')) return;

    try {
      setIsReleasing(true);
      await releaseTicket({
        eventId,
        waitingListId,
      });
    } catch (error) {
      console.error('Error releasing ticket:', error);
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <Button
      onClick={handleRelease}
      disabled={isReleasing}
      className='mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed'
    >
      <XCircle className='size-4' />
      {isReleasing ? 'Releasing...' : 'Release Ticket Offer'}
    </Button>
  );
};

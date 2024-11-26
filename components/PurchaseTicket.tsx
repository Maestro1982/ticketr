'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket } from 'lucide-react';

import { useUser } from '@clerk/nextjs';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

import { ReleaseTicket } from '@/components/ReleaseTicket';

export const PurchaseTicket = ({ eventId }: { eventId: Id<'events'> }) => {
  const router = useRouter();
  const { user } = useUser();

  const queuePostion = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId: user?.id ?? '',
  });

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const offerExpiresAt = queuePostion?.offerExpiresAt ?? 0;
  const isExpired = Date.now() > offerExpiresAt;

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (isExpired) {
        setTimeRemaining('Expired');
        return;
      }

      const diff = offerExpiresAt - Date.now();
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (minutes > 0) {
        setTimeRemaining(
          `${minutes} minutes${minutes === 1 ? '' : 's'} ${seconds} seconds${seconds === 1 ? '' : 's'}`
        );
      } else {
        setTimeRemaining(`${seconds} seconds${seconds === 1 ? '' : 's'}`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt, isExpired]);

  // Create stripe checkout...
  const handlePurchase = () => {};

  if (!user || !queuePostion || queuePostion.status !== 'offered') {
    return null;
  }

  return (
    <div className='bg-white p-6 rounded-xl shadow-lg border border-amber-200'>
      <div className='space-y-4'>
        <div className=' bg-white rounded-lg p-6 border border-gray-200'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-3'>
              <div className='size-12 rounded-full bg-amber-100 flex items-center justify-center'>
                <Ticket className='size-6 text-amber-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Ticket Reserved
                </h3>
                <p className='text-sm text-gray-500'>
                  Expires in {timeRemaining}
                </p>
              </div>
            </div>

            <div className='text-sm text-gray-600 leading-relaxed'>
              A ticket has been reseved for you. Complete your purchase before
              the timer expires to secure your spot at this event.
            </div>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={isExpired || isLoading}
          className='w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-lg font-bold shadow-md hover:from-amber-600 hover:to-amber-700 transform hover:scale-[1.02] transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg'
        >
          {isLoading
            ? 'Redirecting to checkout...'
            : '"Purchase Your Ticket Now →"'}
        </button>

        <div className='mt-4'>
          <ReleaseTicket eventId={eventId} waitingListId={queuePostion._id} />
        </div>
      </div>
    </div>
  );
};

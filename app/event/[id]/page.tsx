'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { CalendarDays, MapPin, Ticket, Users } from 'lucide-react';

import { useUser } from '@clerk/nextjs';

import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useStorageUrl } from '@/lib/utils';

import { Spinner } from '@/components/Spinner';
import { EventCard } from '@/components/EventCard';

const EventPage = () => {
  const params = useParams();
  const { user } = useUser();

  const event = useQuery(api.events.getById, {
    eventId: params.id as Id<'events'>,
  });

  const availability = useQuery(api.events.getEventAvailability, {
    eventId: params.id as Id<'events'>,
  });

  const imageUrl = useStorageUrl(event?.imageStorageId);

  if (!event || !availability) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Spinner />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Event details */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
          {/* Event image */}
          {imageUrl && (
            <div className='aspect-[21/9] relative w-full'>
              <Image
                src={imageUrl}
                alt={event.name}
                fill
                className='object-cover'
                priority
              />
            </div>
          )}

          {/* Event details in depth*/}
          <div className='p-8'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
              {/* Left column - Event details */}
              <div className='space-y-8'>
                <div>
                  <h1 className='text-4xl font-bold text-gray-900 mb-4'>
                    {event.name}
                  </h1>
                  <p className='text-lg text-gray-600'>{event.description}</p>
                </div>

                <div className='grid grid-cols-2 gap-6'>
                  <div className='bg-gray-50 p-4 rounded-lg border border-gray-100'>
                    <div className='flex items-center text-gray-600 mb-1'>
                      <CalendarDays className='size-5 mr-2 text-blue-600' />
                      <span className='text-sm font-medium'>Date</span>
                    </div>
                    <p className='text-gray-900'>
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className='bg-gray-50 p-4 rounded-lg border border-gray-100'>
                    <div className='flex items-center text-gray-600 mb-1'>
                      <MapPin className='size-5 mr-2 text-blue-600' />
                      <span className='text-sm font-medium'>Location</span>
                    </div>
                    <p className='text-gray-900'>{event.location}</p>
                  </div>

                  <div className='bg-gray-50 p-4 rounded-lg border border-gray-100'>
                    <div className='flex items-center text-gray-600 mb-1'>
                      <Ticket className='size-5 mr-2 text-blue-600' />
                      <span className='text-sm font-medium'>Price</span>
                    </div>
                    <p className='text-gray-900'>€{event.price.toFixed(2)}</p>
                  </div>

                  <div className='bg-gray-50 p-4 rounded-lg border border-gray-100'>
                    <div className='flex items-center text-gray-600 mb-1'>
                      <Users className='size-5 mr-2 text-blue-600' />
                      <span className='text-sm font-medium'>Availability</span>
                    </div>
                    <p className='text-gray-900'>
                      {availability.totalTickets - availability.purchasedCount}{' '}
                      / {availability.totalTickets} left
                    </p>
                  </div>
                </div>

                {/* Additional event information */}
                <div className='bg-blue-50 border border-blue-100 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-blue-900 mb-2'>
                    Event Information
                  </h3>
                  <ul className='space-y-2 text-blue-700'>
                    <li>• Please arrive 30 minutes before the event starts</li>
                    <li>• Tickets are non-refundable</li>
                    <li>• Age restriction: 18+</li>
                  </ul>
                </div>
              </div>

              {/* Right column - Ticket purchase card */}
              <div>
                <div className='sticky top-8 space-y-4'>
                  <EventCard eventId={params.id as Id<'events'>} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EventPage;
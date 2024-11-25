'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export const EventCard = ({ eventId }: { eventId: Id<'events'> }) => {
  const { user } = useUser();
  const router = useRouter();
  const event = useQuery(api.events.getById, { eventId });
  const availability = useQuery(api.events.getEventAvailability, { eventId });

  const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
    eventId,
    userId: user?.id ?? '',
  });

  return <div>Event Card</div>;
};

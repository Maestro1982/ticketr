import { ConvexError, v } from 'convex/values';
import { query, mutation } from '@/convex/_generated/server';
import {
  DURATIONS,
  TICKET_STATUS,
  WAITING_LIST_STATUS,
} from '@/convex/constants';
import { internal } from '@/convex/_generated/api';

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('events')
      .filter((q) => q.eq(q.field('is_cancelled'), undefined))
      .collect();
  },
});

export const getById = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    return await ctx.db.get(eventId);
  },
});

export const getEventAvailability = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('No event found');

    // Count total purchased tickets
    const purchasedCount = await ctx.db
      .query('tickets')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (ticket) =>
              ticket.status === TICKET_STATUS.VALID || TICKET_STATUS.USED
          ).length
      );

    // Count current valid offers
    const now = Date.now();
    const activeOffers = await ctx.db
      .query('waitingList')
      .withIndex('by_event_status', (q) =>
        q.eq('eventId', eventId).eq('status', WAITING_LIST_STATUS.OFFERED)
      )
      .collect()
      .then(
        (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
      );

    const totalReserved = purchasedCount + activeOffers;

    return {
      isSoldOut: totalReserved >= event.totalTickets,
      totalTickets: event.totalTickets,
      purchasedCount,
      activeOffers,
      remainingTickets: Math.max(0, event.totalTickets - totalReserved),
    };
  },
});

// Helper function to check ticket availability for an event
export const checkAvailability = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('Event not found');

    // Count total purchased tickets
    const purchasedCount = await ctx.db
      .query('tickets')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (ticket) =>
              ticket.status === TICKET_STATUS.VALID ||
              ticket.status === TICKET_STATUS.USED
          ).length
      );

    // Count current valid offers
    const now = Date.now();
    const activeOffers = await ctx.db
      .query('waitingList')
      .withIndex('by_event_status', (q) =>
        q.eq('eventId', eventId).eq('status', WAITING_LIST_STATUS.OFFERED)
      )
      .collect()
      .then(
        (entries) =>
          entries.filter((entry) => entry.offerExpiresAt ?? 0 > now).length
      );

    const availableSpots = event.totalTickets - (purchasedCount + activeOffers);

    return {
      available: availableSpots > 0,
      availableSpots,
      totalTickets: event.totalTickets,
      purchasedCount,
      activeOffers,
    };
  },
});

// Join waitinglist for an event
export const joinWatingList = mutation({
  // Function takes an event ID and user ID as arguments
  args: { eventId: v.id('events'), userId: v.string() },
  handler: async (ctx, { eventId, userId }) => {
    // Rate limit check
    /* const status = await rateLimiter.limit(ctx, 'queueJoin', {
      key: userId
    })
    if (!status.ok) {
      throw new ConvexError(
        `You've joined the waitinglist too many times. Please wait ${Math.ceil(status.retryAfter / (60 * 1000))} minutes before trying again.`
      );
    } */

    // First check if user already has an active entry in waiting list for this event
    // Active means any status except EXPIRED
    const existingEntry = await ctx.db
      .query('waitingList')
      .withIndex('by_user_event', (q) =>
        q.eq('userId', userId).eq('eventId', eventId)
      )
      .filter((q) => q.neq(q.field('status'), WAITING_LIST_STATUS.EXPIRED))
      .first();

    // Don't allow duplicate entries
    if (existingEntry) {
      throw new Error('Already in waiting list for this event');
    }

    // Verify the event exists
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error('Event not found');

    // Check if there are any available tickets right now
    const { available } = await checkAvailability(ctx, { eventId });

    const now = Date.now();

    if (available) {
      // If tickets are available, create an offer entry
      const waitingListId = await ctx.db.insert('waitingList', {
        eventId,
        userId,
        status: WAITING_LIST_STATUS.OFFERED, // Mark as offered
        offerExpiresAt: now + DURATIONS.TICKET_OFFER, // Set expiration time
      });

      // Schedule a job to expire this offer after the offer duration
      await ctx.scheduler.runAfter(
        DURATIONS.TICKET_OFFER,
        internal.waitingList.expireOffer,
        {
          waitingListId,
          eventId,
        }
      );
    } else {
      // If no tickets are available, add to waiting list
      await ctx.db.insert('waitingList', {
        eventId,
        userId,
        status: WAITING_LIST_STATUS.WAITING, // Mark as waiting
      });
    }

    // Return appropriate status message
    return {
      success: true,
      status: available
        ? WAITING_LIST_STATUS.OFFERED // If available, status is offered
        : WAITING_LIST_STATUS.WAITING, // If not available, status is waiting
      message: available
        ? `Ticket offered - you have ${DURATIONS.TICKET_OFFER / (60 * 1000)} minutes to purchase`
        : 'Added to the waiting list - you will be notified when a ticket becomes available',
    };
  },
});

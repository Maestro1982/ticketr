'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMutation } from 'convex/react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

import { useStorageUrl } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().min(1, 'Event description is required'),
  location: z.string().min(1, 'Event location is required'),
  eventDate: z
    .date()
    .min(
      new Date(new Date().setHours(0, 0, 0, 0)),
      'Event date must be in the future'
    ),
  price: z.number().min(0, 'Price must be 0 or greater'),
  totalTickets: z.number().min(1, 'Must have at least one tickets'),
});

type FormData = z.infer<typeof formSchema>;

interface initialEventData {
  _id: Id<'events'>;
  name: string;
  description: string;
  location: string;
  eventDate: number;
  price: number;
  totalTickets: number;
  imageStorageId?: Id<'_storage'>;
}

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: initialEventData;
}
export const EventForm = ({ mode, initialData }: EventFormProps) => {
  const router = useRouter();
  const { user } = useUser();
  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const currentImageUrl = useStorageUrl(initialData?.imageStorageId);

  // Image upload
  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateEventImage = useMutation(api.storage.updateEventImage);
  const deleteEventImage = useMutation(api.storage.deleteEventImage);

  const [removedCurrentImage, setRemovedCurrentImage] =
    useState<boolean>(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      location: initialData?.location ?? '',
      eventDate: initialData ? new Date(initialData.eventDate) : new Date(),
      price: initialData?.price ?? 0,
      totalTickets: initialData?.totalTickets ?? 1,
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!user?.id) return;

    startTransition(async () => {
      try {
        let imageStorageId = null;

        // Handle image changes
        if (selectedImage) {
          // Upload new image
          imageStorageId = await handleImageUpload(selectedImage);
        }

        // Handle image deletion/update in edit mode
        if (mode === 'edit' && initialData?.imageStorageId) {
          if (removedCurrentImage || selectedImage) {
            // Delete old image from storage
            await deleteEventImage({ storageId: initialData.imageStorageId });
          }
        }

        if (mode === 'create') {
          const eventId = await createEvent({
            ...values,
            userId: user.id,
            eventDate: values.eventDate.getTime(),
          });

          if (imageStorageId) {
            await updateEventImage({
              eventId,
              storageId: imageStorageId as Id<'_storage'>,
            });
          }

          router.push(`/event/${eventId}`);
        } else {
          // Ensure initialData exists before proceeding with update
          if (!initialData) {
            throw new Error('Initial event data is required for updates');
          }

          // Update event details
          await updateEvent({
            eventId: initialData._id,
            ...values,
            eventDate: values.eventDate.getTime(),
          });

          // Update image - this will now handle both adding new image and removing existing image
          if (imageStorageId || removedCurrentImage) {
            await updateEventImage({
              eventId: initialData._id,
              // If we have a new image, use its ID, otherwise if we're removing the image, pass null
              storageId: imageStorageId
                ? (imageStorageId as Id<'_storage'>)
                : null,
            });
          }

          toast({
            title: 'Event updated',
            description: 'Your event has been successfully updated.',
          });

          router.push(`/event/${initialData._id}`);
        }
      } catch (error) {
        console.error('Failed to handle event:', error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem with your request.',
        });
      }
    });
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
      const { storageId } = await result.json();
      return storageId as Id<'_storage'>;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {/* Form fields */}
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Location</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='eventDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date</FormLabel>
                <FormControl>
                  <Input
                    type='date'
                    {...field}
                    onChange={(e) => {
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null
                      );
                    }}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split('T')[0]
                        : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per Ticket</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <span className='absolute left-2 top-1/2 -translate-y-1/2'>
                      €
                    </span>
                    <Input
                      type='number'
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className='pl-6'
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='totalTickets'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Tickets Available</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image upload */}
          <div className='space-y-4'>
            <label className='block text-sm font-medium text-gray-700'>
              Event Image
            </label>
            <div className='flex mt-1 items-center gap-4'>
              {imagePreview || (!removedCurrentImage && currentImageUrl) ? (
                <div className='relative w-32 aspect-square bg-gray-100 rounded-lg'>
                  <Image
                    src={imagePreview || currentImageUrl!}
                    alt='Preview'
                    fill
                    className='object-contain rounded-lg'
                  />
                  <Button
                    type='button'
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setRemovedCurrentImage(true);
                      if (imageInput.current) {
                        imageInput.current.value = '';
                      }
                    }}
                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full size-6 flex items-center justify-center hover:bg-red-600 transition-colors'
                  >
                    x
                  </Button>
                </div>
              ) : (
                <Input
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  ref={imageInput}
                  className='block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100'
                />
              )}
            </div>
          </div>
        </div>

        <Button
          type='submit'
          disabled={isPending}
          className='w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2'
        >
          {isPending ? (
            <>
              <Loader2 className='size-4 animate-spin' />
              {mode === 'create' ? 'Creating Event...' : 'Updating Event...'}
            </>
          ) : mode === 'create' ? (
            'Create Event'
          ) : (
            'Update Event'
          )}
        </Button>
      </form>
    </Form>
  );
};
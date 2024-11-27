'use client';

import Link from 'next/link';
import Image from 'next/image';

import logo from '@/images/logo.png';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

import { SearchBar } from '@/components/SearchBar';

import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <div className='border-b'>
      <div className='flex flex-col lg:flex-row items-center gap-4 p-4'>
        <div className='flex w-full items-center justify-between lg:w-auto'>
          <Link href='/' className='font-bold shrink-0'>
            <Image
              src={logo}
              alt='logo'
              width={100}
              height={100}
              className='w-24 lg:w-28'
            />
          </Link>

          <div className='lg:hidden'>
            <SignedIn>
              <UserButton />
            </SignedIn>

            <SignedOut>
              <SignInButton mode='modal'>
                <Button className='bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300'>
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Search bar - Full width on mobile */}
        <div className='w-full lg:max-w-2xl'>
          <SearchBar />
        </div>

        {/* Desktop action buttons */}
        <div className='hidden lg:block ml-auto'>
          <SignedIn>
            <div className='flex items-center gap-3'>
              <Link href='/seller'>
                <Button className='bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition'>
                  Sell Tickets
                </Button>
              </Link>

              <Link href='/tickets'>
                <Button className='bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300'>
                  My Tickets
                </Button>
              </Link>
              <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode='modal'>
              <Button className='bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300'>
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Mobile action buttons */}
        <div className='lg:hidden w-full flex justify-center gap-3'>
          <SignedIn>
            <Link href='/seller'>
              <Button className='bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition'>
                Sell Tickets
              </Button>
            </Link>

            <Link href='/tickets'>
              <Button className='bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300'>
                My Tickets
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
};

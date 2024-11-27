import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { SellerDashboard } from '@/components/SellerDashboard';

const SellerPage = async () => {
  const { userId } = await auth();
  if (!userId) redirect('/');

  return (
    <div className='min-h-screen bg-gray-50'>
      <SellerDashboard />
    </div>
  );
};
export default SellerPage;

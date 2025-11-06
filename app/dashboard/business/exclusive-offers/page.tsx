import { redirect } from 'next/navigation';

export default function ExclusiveOffersRedirectPage() {
  // Redirect to the unified deals page, showing the exclusive offers tab by default
  redirect('/dashboard/business/deals');
}
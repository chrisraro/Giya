import { redirect } from 'next/navigation';

export default function DiscountsRedirectPage() {
  // Redirect to the unified deals page, showing the discount tab by default
  redirect('/dashboard/business/deals');
}
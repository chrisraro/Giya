"use client"

import { useSearchParams } from "next/navigation"
import CustomerRewardsPage from "./page"

export default function CustomerRewardsPageWrapper() {
  const searchParams = useSearchParams()
  
  return <CustomerRewardsPage searchParams={searchParams} />
}
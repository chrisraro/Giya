"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Search, Building2, MapPin, Star } from "lucide-react"
import { handleApiError } from "@/lib/error-handler"
import Link from "next/link"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"

interface Business {
  id: string
  business_name: string
  business_category: string
  profile_pic_url: string | null
  points_per_currency: number
  address: string
  gmaps_link: string | null
}

export default function BusinessDirectoryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        // Fetch all businesses
        const { data: businessesData, error: businessesError } = await supabase
          .from("businesses")
          .select("id, business_name, business_category, profile_pic_url, points_per_currency, address, gmaps_link")

        if (businessesError) throw businessesError

        setBusinesses(businessesData || [])
        setFilteredBusinesses(businessesData || [])

        // Get unique categories
        const uniqueCategories = Array.from(
          new Set(businessesData?.map((business: Business) => business.business_category))
        ).filter(Boolean) as string[]
        
        setCategories(uniqueCategories)
      } catch (error) {
        handleApiError(error, "Failed to load businesses", "BusinessDirectory.fetchBusinesses")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [supabase])

  useEffect(() => {
    // Filter businesses based on search term and category
    let result = businesses

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(business => 
        business.business_name.toLowerCase().includes(term) ||
        business.business_category.toLowerCase().includes(term) ||
        business.address.toLowerCase().includes(term)
      )
    }

    if (selectedCategory !== "all") {
      result = result.filter(business => business.business_category === selectedCategory)
    }

    setFilteredBusinesses(result)
  }, [searchTerm, selectedCategory, businesses])

  if (isLoading) {
    return (
      <div className="min-h-svh bg-secondary">
        <header className="border-b bg-background">
          <div className="container-padding-x container mx-auto py-4">
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </header>
        <main className="container-padding-x container mx-auto py-8">
          <div className="flex flex-col gap-6">
            <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <h1 className="text-2xl font-bold text-foreground">Business Directory</h1>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        <div className="flex flex-col gap-6">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem isCurrent>
                Businesses
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Search and Filter Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredBusinesses.length} of {businesses.length} businesses
          </div>

          {/* Business Grid */}
          {filteredBusinesses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No businesses found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((business) => (
                <Card 
                  key={business.id} 
                  className="relative flex flex-col bg-white shadow-sm border border-slate-200 rounded-lg w-full cursor-pointer transition-all hover:shadow-md overflow-hidden"
                  onClick={() => router.push(`/business/${business.id}`)}
                >
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    {business.profile_pic_url ? (
                      <AvatarImage 
                        src={business.profile_pic_url} 
                        alt={business.business_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-2xl font-bold text-primary">{business.business_name.charAt(0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-slate-800 text-xl font-semibold truncate">
                        {business.business_name}
                      </h3>
                      <span className="text-primary text-xl font-semibold">
                        {business.points_per_currency || 100} pts/₱
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal font-light line-clamp-2">
                      {business.business_category} • {business.address}
                    </p>
                    <Button 
                      variant="default" 
                      className="rounded-md w-full mt-6 bg-primary py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-primary/90 focus:shadow-none active:bg-primary/90 hover:bg-primary/90 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none" 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/business/${business.id}`)
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
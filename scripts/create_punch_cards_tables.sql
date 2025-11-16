-- Create punch_cards table
CREATE TABLE public.punch_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    punches_required INTEGER NOT NULL DEFAULT 10,
    reward_description TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create punch_card_customers table
CREATE TABLE public.punch_card_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    punch_card_id UUID NOT NULL REFERENCES public.punch_cards(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    punches_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_punch_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false
);

-- Create punch_card_punches table
CREATE TABLE public.punch_card_punches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    punch_card_customer_id UUID NOT NULL REFERENCES public.punch_card_customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    punch_at TIMESTAMPTZ DEFAULT NOW(),
    transaction_id UUID REFERENCES public.points_transactions(id) ON DELETE SET NULL,
    validated_by UUID REFERENCES public.businesses(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.punch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_card_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_card_punches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for punch_cards
CREATE POLICY "Users can view punch cards for their business" ON public.punch_cards
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = punch_cards.business_id
            AND businesses.id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Businesses can create their own punch cards" ON public.punch_cards
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = auth.uid()
        )
        AND business_id = auth.uid()
    );

CREATE POLICY "Businesses can update their own punch cards" ON public.punch_cards
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = punch_cards.business_id
            AND businesses.id = auth.uid()
        )
    )
    WITH CHECK (
        business_id = auth.uid()
    );

CREATE POLICY "Businesses can delete their own punch cards" ON public.punch_cards
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = punch_cards.business_id
            AND businesses.id = auth.uid()
        )
    );

-- Create RLS policies for punch_card_customers
CREATE POLICY "Users can view their own punch card records" ON public.punch_card_customers
    FOR SELECT TO authenticated
    USING (
        customer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.punch_cards
                WHERE punch_cards.id = punch_card_customers.punch_card_id
                AND punch_cards.business_id = businesses.id
            )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Customers can update their own punch card records" ON public.punch_card_customers
    FOR UPDATE TO authenticated
    USING (
        customer_id = auth.uid()
    )
    WITH CHECK (
        customer_id = auth.uid()
    );

CREATE POLICY "Businesses can update customer punch card records" ON public.punch_card_customers
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.punch_cards
                WHERE punch_cards.id = punch_card_customers.punch_card_id
                AND punch_cards.business_id = businesses.id
            )
        )
    );

-- Create RLS policies for punch_card_punches
CREATE POLICY "Users can view their own punch records" ON public.punch_card_punches
    FOR SELECT TO authenticated
    USING (
        customer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = auth.uid()
            AND businesses.id = punch_card_punches.business_id
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Customers can insert their own punch records" ON public.punch_card_punches
    FOR INSERT TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
    );

-- Create indexes for better performance
CREATE INDEX idx_punch_cards_business_id ON public.punch_cards(business_id);
CREATE INDEX idx_punch_card_customers_punch_card_id ON public.punch_card_customers(punch_card_id);
CREATE INDEX idx_punch_card_customers_customer_id ON public.punch_card_customers(customer_id);
CREATE INDEX idx_punch_card_punches_punch_card_customer_id ON public.punch_card_punches(punch_card_customer_id);
CREATE INDEX idx_punch_card_punches_business_id ON public.punch_card_punches(business_id);
CREATE INDEX idx_punch_card_punches_customer_id ON public.punch_card_punches(customer_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_punch_cards_updated_at 
    BEFORE UPDATE ON public.punch_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
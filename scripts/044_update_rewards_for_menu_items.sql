-- Update rewards table to optionally reference menu items
-- This allows rewards to be either menu items or custom rewards

ALTER TABLE public.rewards
ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL;

-- Create index for menu_item_id
CREATE INDEX IF NOT EXISTS idx_rewards_menu_item ON public.rewards(menu_item_id);

-- Add a column to track if reward uses menu item or custom description
ALTER TABLE public.rewards
ADD COLUMN IF NOT EXISTS use_menu_item BOOLEAN DEFAULT false;

-- Update the reward_name column to be nullable when using menu items
-- (The name will come from the menu_item if use_menu_item is true)
ALTER TABLE public.rewards
ALTER COLUMN reward_name DROP NOT NULL;

-- Add constraint to ensure either custom reward or menu item is specified
ALTER TABLE public.rewards
ADD CONSTRAINT reward_type_check CHECK (
  (use_menu_item = false AND reward_name IS NOT NULL) OR
  (use_menu_item = true AND menu_item_id IS NOT NULL)
);

-- Migration note: Existing rewards will have use_menu_item = false by default,
-- which means they continue to work as custom rewards with reward_name.

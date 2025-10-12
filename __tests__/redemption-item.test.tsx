import React from 'react';
import { render, screen } from '@testing-library/react';
import { RedemptionItem } from '@/components/dashboard/redemption-item';

// Mock next/image
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: ({ src, alt, width, height }: any) => {
      return <img src={src} alt={alt} width={width} height={height} />;
    },
  };
});

describe('RedemptionItem', () => {
  it('renders reward redemption correctly', () => {
    const redemption = {
      id: '1',
      redeemed_at: '2023-01-01T00:00:00Z',
      status: 'completed',
      business_id: 'business1',
      reward_id: 'reward1',
      rewards: {
        reward_name: 'Free Coffee',
        points_required: 100,
        image_url: 'https://example.com/coffee.jpg'
      },
      businesses: {
        business_name: 'Coffee Shop',
        profile_pic_url: 'https://example.com/shop.jpg'
      },
      redemption_type: 'reward' as const
    };

    render(<RedemptionItem redemption={redemption} />);
    
    expect(screen.getByText('Free Coffee')).toBeInTheDocument();
    expect(screen.getByText('100 pts')).toBeInTheDocument();
    expect(screen.getByText('Coffee Shop')).toBeInTheDocument();
    expect(screen.getByText('reward')).toBeInTheDocument();
  });

  it('renders discount redemption correctly', () => {
    const redemption = {
      id: '2',
      redeemed_at: '2023-01-02T00:00:00Z',
      status: 'completed',
      business_id: 'business2',
      discount_offer_id: 'discount1',
      discount_offers: {
        offer_title: '20% Off',
        points_required: 50,
        image_url: 'https://example.com/discount.jpg'
      },
      businesses: {
        business_name: 'Restaurant',
        profile_pic_url: 'https://example.com/restaurant.jpg'
      },
      redemption_type: 'discount' as const
    };

    render(<RedemptionItem redemption={redemption} />);
    
    expect(screen.getByText('20% Off')).toBeInTheDocument();
    expect(screen.getByText('50 pts')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('discount')).toBeInTheDocument();
  });

  it('renders exclusive offer redemption correctly', () => {
    const redemption = {
      id: '3',
      redeemed_at: '2023-01-03T00:00:00Z',
      status: 'completed',
      business_id: 'business3',
      exclusive_offer_id: 'exclusive1',
      exclusive_offers: {
        offer_title: 'VIP Experience',
        points_required: 200,
        image_url: 'https://example.com/vip.jpg'
      },
      businesses: {
        business_name: 'Spa',
        profile_pic_url: 'https://example.com/spa.jpg'
      },
      redemption_type: 'exclusive' as const
    };

    render(<RedemptionItem redemption={redemption} />);
    
    expect(screen.getByText('VIP Experience')).toBeInTheDocument();
    expect(screen.getByText('200 pts')).toBeInTheDocument();
    expect(screen.getByText('Spa')).toBeInTheDocument();
    expect(screen.getByText('exclusive')).toBeInTheDocument();
  });
});
# Giya Receipt Processing System

## Overview

The Giya Receipt Processing System is a comprehensive solution that enables customers to earn loyalty points by scanning table QR codes, authenticating with Facebook or phone number, and uploading receipt photos. The system automatically processes receipts using OCR technology, attributes sales to specific affiliates/influencers, and awards points to customers.

## Core Workflow

1. **Table QR Scanning**: Customer scans a QR code at their table using the Giya mobile app
2. **Authentication**: Customer authenticates using Facebook Login or phone number verification
3. **Receipt Capture**: Customer takes a photo of their receipt or uploads an image
4. **OCR Processing**: System extracts data from the receipt using OCR technology
5. **Affiliate Attribution**: System attributes the sale to specific Ad/Influencer sources
6. **Points Awarding**: System calculates and awards loyalty points based on receipt value
7. **Analytics Dashboard**: Business owners view Ad Spend vs. Verified Revenue metrics

## System Components

### 1. Table QR Scanner

The table QR scanner component allows customers to scan QR codes placed at restaurant tables. The QR codes follow the format:

```
giya://table/{business_id}/{table_id}
```

The scanner validates that the QR code belongs to an active business before proceeding.

### 2. Authentication Flow

Customers can authenticate using either:
- **Facebook Login**: Single sign-on using Facebook credentials
- **Phone Number Verification**: Phone number input with SMS verification code

Both authentication methods are tracked for analytics purposes.

### 3. Receipt Upload

The receipt upload component supports:
- Camera capture for immediate photo taking
- File selection from device storage
- Image validation (JPEG, PNG, WebP formats, max 10MB)
- Preview display before upload
- Secure storage in Supabase storage

### 4. OCR Processing

The system processes receipt images using OCR technology to extract:
- Total amount spent
- Currency
- Individual items and prices
- Merchant information
- Transaction timestamp

In the current implementation, a mock OCR service is used. For production, Google Vision API integration is available.

### 5. Affiliate Attribution

The system tracks affiliate links through:
- Referral codes in URL parameters
- Session storage for persistent tracking
- Automatic attribution to receipts
- Commission calculation for influencers

### 6. Points Awarding

Points are awarded based on business-configured rates:
- Points per currency unit spent
- Automatic calculation based on receipt total
- Real-time point balance updates
- Transaction history tracking

### 7. Business Analytics Dashboard

Business owners can view comprehensive analytics including:
- Ad Spend vs. Verified Revenue comparison
- Daily revenue trends
- Receipt volume metrics
- Points issuance statistics
- Top-performing products/services
- ROI calculations

## Database Schema

### Receipts Table

```sql
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  image_url text not null,
  original_filename text,
  upload_timestamp timestamp with time zone default now(),
  status receipt_status default 'uploaded',
  processed_at timestamp with time zone,
  ocr_data jsonb,
  total_amount numeric(10, 2),
  currency_code text default 'PHP',
  points_earned integer,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  auth_method_used auth_method,
  table_qr_code text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Business Analytics Table

```sql
create table if not exists public.business_analytics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  date date not null,
  ad_spend numeric(10, 2) default 0.00,
  verified_revenue numeric(10, 2) default 0.00,
  total_receipts integer default 0,
  total_points_issued integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, date)
);
```

## Security Measures

The system implements multiple security measures:

1. **Input Validation**: All user inputs are sanitized and validated
2. **File Validation**: Image uploads are checked for type and size
3. **Rate Limiting**: API calls are rate-limited to prevent abuse
4. **Authentication Verification**: Receipt ownership is verified before processing
5. **QR Code Validation**: QR codes are validated against expected formats
6. **Request Throttling**: Sensitive operations are throttled
7. **Activity Monitoring**: Suspicious activities are logged and monitored

## API Integration

### Google Vision API

For production deployment, the system can integrate with Google Vision API for OCR processing:

1. Fetch image from Supabase storage
2. Convert image to base64 format
3. Send to Google Vision API endpoint
4. Parse response to extract receipt data
5. Process and store structured data

### Supabase Integration

The system uses Supabase for:
- Authentication (Facebook, phone number)
- Database storage (receipts, analytics)
- File storage (receipt images)
- Real-time updates
- Row Level Security (RLS) policies

## Implementation Notes

### Frontend Components

- `TableQRScanner`: Handles QR code scanning and validation
- `FacebookAuthFlow`: Manages dual authentication flow
- `ReceiptUpload`: Handles image capture and upload
- `BusinessAnalyticsDashboard`: Displays analytics charts and metrics

### Backend Services

- `ocr-service.ts`: OCR processing logic
- `affiliate-tracking.ts`: Affiliate attribution and commission calculation
- `points-awarding.ts`: Points calculation and awarding
- `security-utils.ts`: Security validation and monitoring

### Database Triggers

A trigger automatically updates business analytics when receipts are processed:

```sql
create trigger update_business_analytics_trigger
  after update of status on public.receipts
  for each row
  when (new.status = 'processed' and old.status != 'processed')
  execute function update_business_analytics();
```

## Future Enhancements

1. **AI-Powered Receipt Parsing**: Advanced machine learning for better receipt data extraction
2. **Multi-Currency Support**: Support for multiple currencies and automatic conversion
3. **Real-Time Analytics**: WebSocket-based real-time dashboard updates
4. **Mobile App Integration**: Native mobile app with offline capabilities
5. **Advanced Affiliate Features**: Tiered commission structures and performance tracking
6. **Customer Segmentation**: Personalized offers based on spending patterns
7. **Fraud Detection**: AI-based anomaly detection for suspicious receipts

## Troubleshooting

### Common Issues

1. **QR Code Not Recognized**: Ensure proper lighting and camera focus
2. **Authentication Failures**: Check internet connection and Facebook app permissions
3. **Upload Errors**: Verify image format and size requirements
4. **Processing Delays**: System may experience delays during high traffic periods

### Error Handling

All components implement proper error handling with user-friendly error messages and logging for debugging purposes.

## Conclusion

The Giya Receipt Processing System provides a seamless way for customers to earn loyalty points while giving business owners valuable insights into their marketing ROI. The system is designed to be scalable, secure, and user-friendly.
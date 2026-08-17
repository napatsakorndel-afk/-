export type DistanceType = 'REGULAR' | '5K' | 'vip' | 'vip_duo' | 'vip_trio' | 'donation' | 'souvenir';
export type ShirtSizeType = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | '4XL' | '5XL' | '6XL' | '7XL' | 'NONE';
export type RegistrationStatus = 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';

export interface Registration {
  id: string; // Dynamic reference e.g., LSED-XXXXXX
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string; // For verification
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodType: 'A' | 'B' | 'AB' | 'O' | 'Unknown';
  emergencyContactName: string;
  emergencyContactPhone: string;
  distance: DistanceType;
  shirtSize: ShirtSizeType;
  status: RegistrationStatus;
  price: number;
  slipUrl?: string; // base64 or reference
  bibNumber?: string; // e.g. L03-0104
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string;
  taxDeduction?: boolean;
  donorType?: 'personal' | 'corporate';
  donorName?: string;
  taxId?: string;
  receiptAddress?: string;
  receiptDeliveryType?: 'same' | 'custom';
  receiptDeliveryAddress?: string;
  donationObjective?: 'education' | 'fund' | 'project' | 'other';
  donationObjectiveDetail?: string;
  deliveryMethod?: 'pickup' | 'shipping';
  shippingAddress?: string;
  shippingTrackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  qrPayload?: string;
  qrAccountName?: string;
  paymentBankName?: string;
  paymentAccountNo?: string;
  paymentAccountName?: string;
  paymentQrImage?: string;
}

export interface EventStats {
  totalRegistered: number;
  totalApproved: number;
  totalPendingVerification: number;
  totalPendingPayment: number;
  totalRejected: number;
  totalIncome: number;
  byDistance: Record<DistanceType, number>;
  byShirtSize: Record<ShirtSizeType, number>;
  byStatus: Record<RegistrationStatus, number>;
}

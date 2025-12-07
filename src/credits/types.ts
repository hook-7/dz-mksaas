/**
 * Credit transaction type enum
 */
export enum CREDIT_TRANSACTION_TYPE {
  MONTHLY_REFRESH = 'MONTHLY_REFRESH',        // Credits earned by monthly refresh (free users)
  REGISTER_GIFT = 'REGISTER_GIFT',            // Credits earned by register gift
  PURCHASE_PACKAGE = 'PURCHASE_PACKAGE',      // Credits earned by purchase package
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL', // Credits earned by subscription renewal
  LIFETIME_MONTHLY = 'LIFETIME_MONTHLY',      // Credits earned by lifetime plan monthly distribution
  USAGE = 'USAGE',                            // Credits spent by usage
  TRANSFER_OUT = 'TRANSFER_OUT',              // Credits transferred out
  TRANSFER_IN = 'TRANSFER_IN',                // Credits transferred in
  EXPIRE = 'EXPIRE',                          // Credits expired
}

/**
 * Credit package price
 */
export interface CreditPackagePrice {
  priceId: string;                   // Stripe price ID (not product id)
  amount: number;                    // Price amount in currency units (dollars, euros, etc.)
  currency: string;                  // Currency code (e.g., USD)
  allowPromotionCode?: boolean;      // Whether to allow promotion code for this price
}

/**
 * Credit package
 */
export interface CreditPackage {
  id: string;                          // Unique identifier for the package
  amount: number;                      // Amount of credits in the package
  price: CreditPackagePrice;           // Price of the package
  popular: boolean;                    // Whether the package is popular
  name?: string;                       // Display name of the package
  description?: string;                // Description of the package
  expireDays?: number;                 // Number of days to expire the credits, undefined means default 30 days
  disabled?: boolean;                  // Whether the package is disabled in the UI
  // 会员等级限制：all | free | personal | business | pro-seller
  targetMembershipCode?: string | null;
  // 商品ID（如 S001），用于展示
  sku?: string | null;
  // 额外说明字段，用于商城展示
  description2?: string | null;
  // 库存
  stock?: number | null;
}

/**
 * Credit transaction
 */
export interface CreditTransaction {
  id: string;                              // Unique identifier for the transaction
  userId: string;                          // User ID who owns this transaction
  type: string;                            // Transaction type (CREDIT_TRANSACTION_TYPE)
  description: string | null;              // Transaction description
  amount: number;                          // Credit amount (positive for earning, negative for spending)
  remainingAmount: number | null;          // Remaining credit amount (for tracking expiration)
  paymentId: string | null;                // Associated invoice ID
  expirationDate: Date | null;             // Credit expiration date
  expirationDateProcessedAt: Date | null;  // Timestamp when expiration was processed
  createdAt: Date;                         // Transaction creation timestamp
  updatedAt: Date;                         // Transaction last update timestamp
}

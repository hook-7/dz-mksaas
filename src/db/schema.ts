import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: text('role'),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	customerId: text('customer_id'),
	phoneNumber: text('phone_number'),
	phoneNumberVerified: boolean('phone_number_verified').notNull().default(false),
	tkSaasUserId: text('tk_saas_user_id'),
	synced: boolean('synced').notNull().default(false),
}, (table) => ({
	userIdIdx: index("user_id_idx").on(table.id),
	userCustomerIdIdx: index("user_customer_id_idx").on(table.customerId),
	userRoleIdx: index("user_role_idx").on(table.role),
	userPhoneIdx: index("user_phone_idx").on(table.phoneNumber),
	userTkSaasUserIdIdx: index("user_tk_saas_user_id_idx").on(table.tkSaasUserId),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
}, (table) => ({
	sessionTokenIdx: index("session_token_idx").on(table.token),
	sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
	accountUserIdIdx: index("account_user_id_idx").on(table.userId),
	accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
	accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull(),
	scene: text('scene'), // payment scene: 'lifetime', 'credit', 'subscription'
	interval: text('interval'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	sessionId: text('session_id'),
	invoiceId: text('invoice_id').unique(), // unique constraint for avoiding duplicate processing
	status: text('status').notNull(),
	paid: boolean('paid').notNull().default(false), // indicates whether payment is completed (set in invoice.paid event)
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	paymentTypeIdx: index("payment_type_idx").on(table.type),
	paymentSceneIdx: index("payment_scene_idx").on(table.scene),
	paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
	paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
	paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
	paymentStatusIdx: index("payment_status_idx").on(table.status),
	paymentPaidIdx: index("payment_paid_idx").on(table.paid),
	paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
	paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
	paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

export const userCredit = pgTable("user_credit", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	currentCredits: integer("current_credits").notNull().default(0),
	lastRefreshAt: timestamp("last_refresh_at"), // deprecated
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
}));

export const creditTransaction = pgTable("credit_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(),
	description: text("description"),
	amount: integer("amount").notNull(),
	remainingAmount: integer("remaining_amount"),
	paymentId: text("payment_id"), // field name is paymentId, but actually it's invoiceId
	expirationDate: timestamp("expiration_date"),
	expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
	creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

export const storeUserRelationship = pgTable("store_user_relationship", {
	id: text("id").primaryKey(),
	storeId: text("store_id").notNull(),
	parentUserId: text("parent_user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	childUserId: text("child_user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	relationshipRole: text("relationship_role").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	storeUserRelationshipUniqueIdx: uniqueIndex("store_user_relationship_store_parent_child_idx").on(table.storeId, table.parentUserId, table.childUserId),
	storeUserRelationshipParentIdx: index("store_user_relationship_parent_idx").on(table.parentUserId),
	storeUserRelationshipChildIdx: index("store_user_relationship_child_idx").on(table.childUserId),
	storeUserRelationshipStoreIdx: index("store_user_relationship_store_idx").on(table.storeId),
}));

export const inviteLink = pgTable("invite_link", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	link: text("link").notNull(),
	expiresAt: timestamp("expires_at").notNull().default(sql`now() + interval '24 hours'`),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	inviteLinkUserIdIdx: index("invite_link_user_id_idx").on(table.userId),
	inviteLinkExpiresAtIdx: index("invite_link_expires_at_idx").on(table.expiresAt),
	inviteLinkLinkIdx: uniqueIndex("invite_link_link_idx").on(table.link),
}));

export const shop = pgTable("shop", {
	id: text("id").primaryKey(),
	shopCode: text("shop_code").notNull().unique(),
	shopName: text("shop_name").notNull(),
	shopType: text("shop_type"),
	region: text("region"),
	status: text("status").notNull().default("initializing"),
	shopAvatar: text("shop_avatar"),
	boundAt: timestamp("bound_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	shopCodeIdx: uniqueIndex("shop_code_idx").on(table.shopCode),
	shopStatusIdx: index("shop_status_idx").on(table.status),
	shopRegionIdx: index("shop_region_idx").on(table.region),
	shopTypeIdx: index("shop_type_idx").on(table.shopType),
}));

/**
 * Product table - 统一管理所有付费产品
 * 包括：会员订阅计划、积分包等
 * 每个产品只有一个价格，价格信息直接存储在产品表中
 */
export const product = pgTable("product", {
	id: text("id").primaryKey(),
	name: text("name").notNull(), // 产品名称
	description: text("description"), // 产品描述
	productType: text("product_type").notNull(), // ProductTypes.SUBSCRIPTION_PLAN | ProductTypes.CREDIT_PACKAGE
	// 产品类型特定配置（JSON）
	// subscription_plan: { isFree, isLifetime, credits: { enable, amount, expireDays } }
	// credit_package: { amount, expireDays }
	config: text("config"), // JSON 格式的配置
	// 价格信息
	stripePriceId: text("stripe_price_id"), // Stripe Price ID (可以为空，后续配置)
	amount: integer("amount").notNull(), // 价格金额（以最小货币单位，如分）
	currency: text("currency").notNull().default("USD"), // 货币代码
	paymentType: text("payment_type").notNull(), // 'subscription' | 'one_time'
	interval: text("interval"), // 'month' | 'year' (仅订阅类型)
	trialPeriodDays: integer("trial_period_days"), // 试用期天数
	allowPromotionCode: boolean("allow_promotion_code").notNull().default(false), // 是否允许优惠码
	originalAmount: integer("original_amount"), // 原价（用于显示折扣）
	discountRate: integer("discount_rate"), // 折扣系数（0-100，如 80 表示 8 折）
	// 其他字段
	popular: boolean("popular").notNull().default(false), // 是否推荐
	disabled: boolean("disabled").notNull().default(false), // 是否禁用
	sortOrder: integer("sort_order").notNull().default(0), // 排序顺序
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	productTypeIdx: index("product_type_idx").on(table.productType),
	productDisabledIdx: index("product_disabled_idx").on(table.disabled),
	productSortOrderIdx: index("product_sort_order_idx").on(table.sortOrder),
	productStripePriceIdIdx: index("product_stripe_price_id_idx").on(table.stripePriceId),
}));

/**
 * Membership tier table - 会员等级与折扣配置
 * 用于定义不同会员等级（免费版、个人版、商家版、大卖版）及其对应的全局折扣系数
 */
export const membershipTier = pgTable("membership_tier", {
	id: text("id").primaryKey(), // 可以使用 uuid，在应用层生成
	// 会员等级代码：对应前端/产品中的 plan 标识
	// free | personal | business | pro-seller
	code: text("code").notNull().unique(),
	// 显示名称（可选），例如：免费版 / 个人版 / 商家版 / 大卖版
	name: text("name"),
	// 等级顺序：1 = 免费版，2 = 个人版，3 = 商家版，4 = 大卖版
	level: integer("level").notNull(),
	// 会员折扣系数（0-100，例如 90 表示 9 折）
	discountRate: integer("discount_rate").notNull(),
	// 是否禁用该等级
	disabled: boolean("disabled").notNull().default(false),
	// 排序用，越小越靠前
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	membershipTierCodeIdx: uniqueIndex("membership_tier_code_idx").on(table.code),
	membershipTierLevelIdx: index("membership_tier_level_idx").on(table.level),
	membershipTierDisabledIdx: index("membership_tier_disabled_idx").on(table.disabled),
	membershipTierSortOrderIdx: index("membership_tier_sort_order_idx").on(table.sortOrder),
}));


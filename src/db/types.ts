import {
  account,
  creditTransaction,
  inviteLink,
  payment,
  session,
  storeUserRelationship,
  user,
  userCredit,
  verification,
} from "./schema";

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type UserCredit = typeof userCredit.$inferSelect;
export type CreditTransaction = typeof creditTransaction.$inferSelect;
export type StoreUserRelationship = typeof storeUserRelationship.$inferSelect;
export type InviteLink = typeof inviteLink.$inferSelect;

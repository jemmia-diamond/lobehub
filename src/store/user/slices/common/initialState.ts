import { type Plans, type ReferralStatusString } from '@lobechat/types';

export interface CommonState {
  isFreePlan?: boolean;
  /** @deprecated Use onboarding field instead */
  isOnboard: boolean;
  isShowPWAGuide: boolean;
  isUserCanEnableTrace: boolean;
  isUserHasConversation: boolean;
  isUserStateInit: boolean;
  larkProfile?: { unit?: string; department?: string; email?: string; jobTitle?: string; managerName?: string; name?: string } | null;
  referralStatus?: ReferralStatusString;
  subscriptionPlan?: Plans;
}

export const initialCommonState: CommonState = {
  isFreePlan: true,
  isOnboard: false,
  isShowPWAGuide: false,
  isUserCanEnableTrace: false,
  isUserHasConversation: false,
  isUserStateInit: false,
  referralStatus: undefined,
};

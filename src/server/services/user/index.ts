import { ENABLE_BUSINESS_FEATURES } from '@lobechat/business-const';
import { type LobeChatDatabase } from '@lobechat/database';

import { initNewUserForBusiness } from '@/business/server/user';
import { UserModel } from '@/database/models/user';
import { authEnv } from '@/envs/auth';
import { initializeServerAnalytics } from '@/libs/analytics';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import { FileS3 } from '@/server/modules/S3';

type CreatedUser = {
  createdAt?: Date | null;
  email?: string | null;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  phone?: string | null;
  username?: string | null;
};

export class UserService {
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async initUser(user: CreatedUser) {
    // 1. Assign Role based on Whitelists
    if (user.email) {
      const adminEmails = authEnv.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
      const betaEmails =
        authEnv.BETA_WHITE_LIST_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];

      let role = 'user';
      if (adminEmails.includes(user.email.toLowerCase())) {
        role = 'admin';
      } else if (betaEmails.includes(user.email.toLowerCase())) {
        role = 'beta';
      }

      try {
        const userModel = new UserModel(this.db, user.id);
        await userModel.updateUser({ role });
        console.info(`[UserService] Assigned role "${role}" to user ${user.email}`);
      } catch (error) {
        console.error(`[UserService] Failed to assign role to user ${user.email}`, error);
      }
    }

    if (ENABLE_BUSINESS_FEATURES) {
      try {
        await initNewUserForBusiness(user.id, user.createdAt);
      } catch (error) {
        console.error(error);
        console.error('Failed to init new user for business');
      }
    }

    const analytics = await initializeServerAnalytics();
    analytics?.identify(user.id, {
      email: user.email ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      phone: user.phone ?? undefined,
      username: user.username ?? undefined,
    });
    analytics?.track({
      name: 'user_register_completed',
      properties: {
        role: (user as any).role, // Capture role in analytics if possible
        spm: 'user_service.init_user.user_created',
      },
      userId: user.id,
    });
  }

  getUserApiKeys = async (id: string) => {
    return UserModel.getUserApiKeys(this.db, id, KeyVaultsGateKeeper.getUserKeyVaults);
  };

  getUserAvatar = async (id: string, image: string) => {
    const s3 = new FileS3();
    const s3FileUrl = `user/avatar/${id}/${image}`;

    try {
      const file = await s3.getFileByteArray(s3FileUrl);
      if (!file) {
        return null;
      }
      return Buffer.from(file);
    } catch (error) {
      console.error('Failed to get user avatar', error);
    }
  };
}

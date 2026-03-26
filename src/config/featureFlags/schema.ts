import { z } from 'zod';

// Define a union type for feature flag values: either boolean or array of user IDs
const FeatureFlagValue = z.union([z.boolean(), z.array(z.string())]);

export const FeatureFlagsSchema = z.object({
  check_updates: FeatureFlagValue.optional(),
  show_help_menu: FeatureFlagValue.optional(),

  // settings
  provider_settings: FeatureFlagValue.optional(),
  show_get_desktop_app: FeatureFlagValue.optional(),
  show_language_settings: FeatureFlagValue.optional(),
  show_memory: FeatureFlagValue.optional(),

  openai_api_key: FeatureFlagValue.optional(),
  openai_proxy_url: FeatureFlagValue.optional(),

  jemmia_api_key: FeatureFlagValue.optional(),
  jemmia_proxy_url: FeatureFlagValue.optional(),

  // profile
  api_key_manage: FeatureFlagValue.optional(),
  edit_agent: FeatureFlagValue.optional(),
  enable_agent: FeatureFlagValue.optional(),

  ai_image: FeatureFlagValue.optional(),
  speech_to_text: FeatureFlagValue.optional(),
  token_counter: FeatureFlagValue.optional(),

  welcome_suggest: FeatureFlagValue.optional(),
  changelog: FeatureFlagValue.optional(),

  market: FeatureFlagValue.optional(),
  knowledge_base: FeatureFlagValue.optional(),

  rag_eval: FeatureFlagValue.optional(),

  enable_search: FeatureFlagValue.optional(),
  enable_tools: FeatureFlagValue.optional(),
  enable_model: FeatureFlagValue.optional(),
  enable_file_upload: FeatureFlagValue.optional(),
  enable_lark_tools: FeatureFlagValue.optional(),
  enable_mention_employee: FeatureFlagValue.optional(),
  enable_mention_doc: FeatureFlagValue.optional(),
  show_lark_search_filter_sort: FeatureFlagValue.optional(),
  show_lark_search_filter_owner: FeatureFlagValue.optional(),
  show_lark_search_filter_chat: FeatureFlagValue.optional(),
  show_lark_search_filter_wiki: FeatureFlagValue.optional(),
  show_lark_search_filter_format: FeatureFlagValue.optional(),
  show_upload_file: FeatureFlagValue.optional(),
  show_upload_lark: FeatureFlagValue.optional(),
  show_upload_image: FeatureFlagValue.optional(),
  show_upload_folder: FeatureFlagValue.optional(),

  // internal flag
  cloud_promotion: FeatureFlagValue.optional(),

  // The new custom MVP restriction flags
  enable_pages: FeatureFlagValue.optional(),
  enable_resource: FeatureFlagValue.optional(),
  enable_video: FeatureFlagValue.optional(),
  enable_system_settings: FeatureFlagValue.optional(),

  enable_image_generation: FeatureFlagValue.optional(),
  enable_video_generation: FeatureFlagValue.optional(),

  // the flags below can only be used with commercial license
  // if you want to use it in the commercial usage
  // please contact us for more information: hello@lobehub.com
  commercial_hide_github: FeatureFlagValue.optional(),
  commercial_hide_docs: FeatureFlagValue.optional(),

  // authentication
  auth_sso_lark: FeatureFlagValue.optional(),
  auth_sso_google: FeatureFlagValue.optional(),
  auth_sso_github: FeatureFlagValue.optional(),
  auth_email_password: FeatureFlagValue.optional(),

  home_recent_page: FeatureFlagValue.optional(),
  home_recent_topic: FeatureFlagValue.optional(),
  home_suggestion: FeatureFlagValue.optional(),
  home_profile: FeatureFlagValue.optional(),
  show_home_topic_history: FeatureFlagValue.optional(),
  show_message_share: FeatureFlagValue.optional(),
  show_message_action_menu: FeatureFlagValue.optional(),
  show_chat_share: FeatureFlagValue.optional(),
  show_chat_more_menu: FeatureFlagValue.optional(),
  enable_view_more_upload_file: FeatureFlagValue.optional(),
  show_message_edit: FeatureFlagValue.optional(),
  show_agent_list_sidebar: FeatureFlagValue.optional(),
});

export type IFeatureFlags = z.infer<typeof FeatureFlagsSchema>;

/**
 * Evaluate a feature flag value against a user ID
 * @param flagValue - The feature flag value (boolean or array of user IDs)
 * @param userId - The current user ID
 * @returns boolean indicating if the feature is enabled for the user
 */
export const evaluateFeatureFlag = (
  flagValue: boolean | string[] | undefined,
  userId?: string,
): boolean | undefined => {
  if (typeof flagValue === 'boolean') return flagValue;

  if (Array.isArray(flagValue)) {
    return userId ? flagValue.includes(userId) : false;
  }
};

export const DEFAULT_FEATURE_FLAGS: IFeatureFlags = {
  provider_settings: false,
  show_get_desktop_app: false,
  show_language_settings: true,
  show_memory: false,

  openai_api_key: false,
  openai_proxy_url: false,

  jemmia_api_key: false,
  jemmia_proxy_url: false,

  api_key_manage: false,
  edit_agent: true,
  enable_agent: false,

  ai_image: false,

  check_updates: true,
  show_help_menu: false,
  welcome_suggest: true,
  token_counter: true,

  knowledge_base: true,
  rag_eval: true,

  enable_search: false,
  enable_tools: true,
  enable_model: true,
  enable_file_upload: true,
  enable_lark_tools: true,
  enable_mention_employee: false,
  enable_mention_doc: true,
  show_lark_search_filter_sort: true,
  show_lark_search_filter_owner: false,
  show_lark_search_filter_chat: false,
  show_lark_search_filter_wiki: false,
  show_lark_search_filter_format: false,
  show_upload_file: true,
  show_upload_lark: true,
  show_upload_image: false,
  show_upload_folder: false,

  cloud_promotion: false,

  market: false,
  speech_to_text: false,
  changelog: false,

  enable_pages: false,
  enable_resource: false,
  enable_video: false,
  enable_system_settings: false,

  enable_image_generation: false,
  enable_video_generation: false,

  // the flags below can only be used with commercial license
  // if you want to use it in the commercial usage
  // please contact us for more information: hello@lobehub.com
  commercial_hide_github: true,
  commercial_hide_docs: false,

  auth_sso_lark: true,
  auth_sso_google: false,
  auth_sso_github: false,
  auth_email_password: false,

  home_recent_page: false,
  home_recent_topic: false,
  home_suggestion: false,
  home_profile: false,
  show_home_topic_history: true,
  show_message_share: false,
  show_message_action_menu: false,
  show_chat_share: false,
  show_chat_more_menu: false,
  enable_view_more_upload_file: false,
  show_message_edit: false,
  show_agent_list_sidebar: false,
};

export const mapFeatureFlagsEnvToState = (config: IFeatureFlags, userId?: string) => {
  return {
    isAgentEditable: evaluateFeatureFlag(config.edit_agent, userId),
    showProvider: evaluateFeatureFlag(config.provider_settings, userId),
    showGetDesktopApp: evaluateFeatureFlag(config.show_get_desktop_app, userId),
    showLanguageSettings: evaluateFeatureFlag(config.show_language_settings, userId),
    showMemory: evaluateFeatureFlag(config.show_memory, userId),

    showOpenAIApiKey: evaluateFeatureFlag(config.openai_api_key, userId),
    showOpenAIProxyUrl: evaluateFeatureFlag(config.openai_proxy_url, userId),

    showJemmiaApiKey: evaluateFeatureFlag(config.jemmia_api_key, userId),
    showJemmiaProxyUrl: evaluateFeatureFlag(config.jemmia_proxy_url, userId),

    showApiKeyManage: evaluateFeatureFlag(config.api_key_manage, userId),

    showAiImage: evaluateFeatureFlag(config.ai_image, userId),
    showChangelog: evaluateFeatureFlag(config.changelog, userId),
    showHelpMenu: evaluateFeatureFlag(config.show_help_menu, userId),

    enableCheckUpdates: evaluateFeatureFlag(config.check_updates, userId),
    showWelcomeSuggest: evaluateFeatureFlag(config.welcome_suggest, userId),

    enableAgent: evaluateFeatureFlag(config.enable_agent, userId),
    enableKnowledgeBase: evaluateFeatureFlag(config.knowledge_base, userId),
    enableRAGEval: evaluateFeatureFlag(config.rag_eval, userId),
    enableSearch: evaluateFeatureFlag(config.enable_search, userId),
    enableTools: evaluateFeatureFlag(config.enable_tools, userId),
    enableModel: evaluateFeatureFlag(config.enable_model, userId),
    enableFileUpload: evaluateFeatureFlag(config.enable_file_upload, userId),
    enableLarkTools: evaluateFeatureFlag(config.enable_lark_tools, userId),
    enableMentionEmployee: evaluateFeatureFlag(config.enable_mention_employee, userId),
    enableMentionDoc: evaluateFeatureFlag(config.enable_mention_doc, userId),
    showLarkSearchFilterSort: evaluateFeatureFlag(config.show_lark_search_filter_sort, userId),
    showLarkSearchFilterOwner: evaluateFeatureFlag(config.show_lark_search_filter_owner, userId),
    showLarkSearchFilterChat: evaluateFeatureFlag(config.show_lark_search_filter_chat, userId),
    showLarkSearchFilterWiki: evaluateFeatureFlag(config.show_lark_search_filter_wiki, userId),
    showLarkSearchFilterFormat: evaluateFeatureFlag(config.show_lark_search_filter_format, userId),
    showUploadFile: evaluateFeatureFlag(config.show_upload_file, userId),
    showUploadLark: evaluateFeatureFlag(config.show_upload_lark, userId),
    showUploadImage: evaluateFeatureFlag(config.show_upload_image, userId),
    showUploadFolder: evaluateFeatureFlag(config.show_upload_folder, userId),

    showCloudPromotion: evaluateFeatureFlag(config.cloud_promotion, userId),

    showMarket: evaluateFeatureFlag(config.market, userId),
    enableSTT: evaluateFeatureFlag(config.speech_to_text, userId),

    enablePages: evaluateFeatureFlag(config.enable_pages, userId),
    enableResource: evaluateFeatureFlag(config.enable_resource, userId),
    enableVideo: evaluateFeatureFlag(config.enable_video, userId),
    enableSystemSettings: evaluateFeatureFlag(config.enable_system_settings, userId),

    enableImageGeneration: evaluateFeatureFlag(config.enable_image_generation, userId),
    enableVideoGeneration: evaluateFeatureFlag(config.enable_video_generation, userId),

    hideGitHub: evaluateFeatureFlag(config.commercial_hide_github, userId),
    hideDocs: evaluateFeatureFlag(config.commercial_hide_docs, userId),

    enableAuthSsoLark: evaluateFeatureFlag(config.auth_sso_lark, userId),
    enableAuthSsoGoogle: evaluateFeatureFlag(config.auth_sso_google, userId),
    enableAuthSsoGithub: evaluateFeatureFlag(config.auth_sso_github, userId),
    enableAuthEmailPassword: evaluateFeatureFlag(config.auth_email_password, userId),

    showHomeRecentTopic: evaluateFeatureFlag(config.home_recent_topic, userId),
    showHomeRecentPage: evaluateFeatureFlag(config.home_recent_page, userId),
    showHomeSuggestion: evaluateFeatureFlag(config.home_suggestion, userId),
    showHomeTopicHistory: evaluateFeatureFlag(config.show_home_topic_history, userId),
    showHomeProfile: evaluateFeatureFlag(config.home_profile, userId),
    showMessageShare: evaluateFeatureFlag(config.show_message_share, userId),
    showMessageActionMenu: evaluateFeatureFlag(config.show_message_action_menu, userId),
    showChatShare: evaluateFeatureFlag(config.show_chat_share, userId),
    showChatMoreMenu: evaluateFeatureFlag(config.show_chat_more_menu, userId),
    enableViewMoreUploadFile: evaluateFeatureFlag(config.enable_view_more_upload_file, userId),
    showMessageEdit: evaluateFeatureFlag(config.show_message_edit, userId),
    showAgentListSidebar: evaluateFeatureFlag(config.show_agent_list_sidebar, userId),
  };
};

export type IFeatureFlagsState = ReturnType<typeof mapFeatureFlagsEnvToState>;

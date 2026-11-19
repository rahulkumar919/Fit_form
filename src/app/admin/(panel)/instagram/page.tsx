import { getAdminSocialPosts, getHomepageSettings } from "@/services/homepage";
import { getShopLinkOptions } from "@/services/admin";
import { SocialManager } from "@/components/admin/social-manager";

export const dynamic = "force-dynamic";

export default async function AdminInstagramPage() {
  const [posts, options, layout] = await Promise.all([getAdminSocialPosts(), getShopLinkOptions(), getHomepageSettings()]);
  return <SocialManager posts={posts} options={options} handle={layout.instagramHandle} />;
}

import { getMediaAssets } from "@/services/admin";
import { MediaLibrary } from "@/components/admin/media-library";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  return <MediaLibrary assets={await getMediaAssets()} />;
}

export type AnnouncementNode = {
  id: string;
  title: string;
  date: string;
  type: string;
  content: string;
  assetUrl?: string; // RENAMED FROM mediaUrl TO AVOID STALE CACHE
};

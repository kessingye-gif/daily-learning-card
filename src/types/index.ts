export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  createdAt?: string;
  membershipRole?: 'owner' | 'admin' | 'member';
}

export interface Card {
  id: number;
  title: string;
  content: string;
  image_url: string;
  admin_id?: string;
  group_id?: string;
  username: string;
  avatar_url: string;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  view_count: number;
  created_at: string;
  is_liked?: boolean;
  is_favorited?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  card_id: number;
  user_id: string;
  username: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export interface Stats {
  total_cards: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
  membership_role?: 'owner' | 'admin' | 'member';
}

export interface GroupInvite {
  id: number;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'approved' | 'rejected';
  invitee_username?: string;
  invitee_avatar?: string;
  inviter_username?: string;
}

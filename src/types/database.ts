export type Role = 'student' | 'admin'
export type ItemType = 'lost' | 'found'
export type ItemStatus = 'active' | 'claim_pending' | 'resolved' | 'removed'
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  department: string | null
  year: number | null
  avatar_url: string | null
  created_at: string
}

export interface Item {
  id: string
  user_id: string
  type: ItemType
  title: string
  description: string
  category: string
  location: string
  date_occurred: string
  occurred_time: string | null
  image_url: string | null
  status: ItemStatus
  created_at: string
  updated_at?: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'department' | 'year'> | null
}

export interface Claim {
  id: string
  item_id: string
  claimant_id: string
  message: string
  status: ClaimStatus
  created_at: string
  updated_at: string
  items?: Item | null
  profiles?: Pick<Profile, 'id' | 'full_name' | 'department' | 'year'> | null
}

export interface MatchResult {
  matched_item_id: string
  title: string
  item_type: ItemType
  location: string | null
  date_occurred: string | null
  score: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export const CATEGORIES = [
  'ID Card',
  'Wallet',
  'Keys',
  'Phone',
  'Earphones',
  'Charger',
  'Book',
  'Bag',
  'Bottle',
  'Documents',
  'Electronics',
  'Clothing',
  'Other',
] as const

export const CAMPUS_LOCATIONS = [
  'Main Gate',
  'Library',
  'Cafeteria',
  'Administration Block',
  'Computer Lab',
  'Mechanical Block',
  'Civil Block',
  'Electrical Block',
  'Playground',
  'Hostel A',
  'Hostel B',
  'Auditorium',
  'Parking Area',
  'Other',
] as const
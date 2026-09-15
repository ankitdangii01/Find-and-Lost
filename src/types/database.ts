export type Role = 'student' | 'staff'
export type ItemType = 'lost' | 'found'
export type ItemStatus = 'active' | 'claim_pending' | 'resolved' | 'removed'
export type ClaimStatus = 'pending' | 'accepted' | 'rejected'

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
  image_url: string | null
  status: ItemStatus
  created_at: string
  updated_at?: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'department' | 'year'> | null
}

export interface ItemWithClaimCount extends Item {
  claim_count?: number
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
  claimant?: Pick<Profile, 'id' | 'full_name' | 'department' | 'year'> | null
  profiles?: Pick<Profile, 'id' | 'full_name' | 'department' | 'year'> | null
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

export interface Category {
  id: string
  name: string
  icon: string | null
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
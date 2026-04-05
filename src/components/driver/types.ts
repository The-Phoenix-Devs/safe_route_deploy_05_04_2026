
export interface Student {
  id: string;
  name: string;
  grade: string;
  boardedAt: string | null;
  leftAt: string | null;
  isOnBoard: boolean;
  pickupPoint?: string;
  guardianName?: string;
  guardianMobile?: string;
  /** For FCM push alongside SMS/WhatsApp */
  guardian_profile_id?: string;
}

export interface StudentCheckListProps {
  isActive: boolean;
  journeyType?: 'none' | 'pickup' | 'drop';
}

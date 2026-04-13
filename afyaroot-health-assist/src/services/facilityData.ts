export interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'health_center' | 'dispensary';
  distance: number; // km
  availability: number; // 0-100%
  specialties: string[];
  beds: number;
  occupancy: number; // 0-100%
  phone: string;
  location: { lat: number; lng: number };
}

export const facilities: Facility[] = [
  {
    id: 'f1', name: 'Kapsabet County Referral Hospital', type: 'hospital',
    distance: 5.2, availability: 72, specialties: ['Emergency', 'Surgery', 'Maternity', 'Pediatrics'],
    beds: 200, occupancy: 78, phone: '+254-700-100-001',
    location: { lat: 0.2, lng: 35.1 },
  },
  {
    id: 'f2', name: 'Nandi Hills Sub-County Hospital', type: 'hospital',
    distance: 12.8, availability: 85, specialties: ['Emergency', 'General', 'Maternity'],
    beds: 80, occupancy: 62, phone: '+254-700-100-002',
    location: { lat: 0.1, lng: 35.18 },
  },
  {
    id: 'f3', name: 'Chepterit Health Center', type: 'health_center',
    distance: 2.1, availability: 90, specialties: ['General', 'Maternal Care', 'Immunization'],
    beds: 20, occupancy: 45, phone: '+254-700-100-003',
    location: { lat: 0.22, lng: 35.05 },
  },
  {
    id: 'f4', name: 'Kabiyet Dispensary', type: 'dispensary',
    distance: 1.5, availability: 95, specialties: ['General', 'First Aid'],
    beds: 5, occupancy: 20, phone: '+254-700-100-004',
    location: { lat: 0.25, lng: 35.02 },
  },
  {
    id: 'f5', name: 'Mosoriot Health Center', type: 'health_center',
    distance: 8.4, availability: 60, specialties: ['General', 'Dental', 'Eye Care'],
    beds: 30, occupancy: 70, phone: '+254-700-100-005',
    location: { lat: 0.15, lng: 35.12 },
  },
  {
    id: 'f6', name: 'Baraton University Hospital', type: 'hospital',
    distance: 15.0, availability: 88, specialties: ['Surgery', 'Emergency', 'Lab', 'Radiology'],
    beds: 120, occupancy: 55, phone: '+254-700-100-006',
    location: { lat: 0.28, lng: 35.08 },
  },
];

export function getRecommendedFacility(urgency: 'emergency' | 'high' | 'normal'): Facility {
  const sorted = [...facilities].sort((a, b) => {
    if (urgency === 'emergency') {
      const aScore = (a.type === 'hospital' ? 100 : 0) + (100 - a.occupancy) - a.distance * 2;
      const bScore = (b.type === 'hospital' ? 100 : 0) + (100 - b.occupancy) - b.distance * 2;
      return bScore - aScore;
    }
    if (urgency === 'high') {
      const aScore = (a.type !== 'dispensary' ? 50 : 0) + a.availability - a.distance * 3;
      const bScore = (b.type !== 'dispensary' ? 50 : 0) + b.availability - b.distance * 3;
      return bScore - aScore;
    }
    return a.distance - b.distance;
  });
  return sorted[0];
}

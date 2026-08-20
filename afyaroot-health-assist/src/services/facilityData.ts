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
  county?: string;
  sub_county?: string;
  address?: string;
}

export const facilities: Facility[] = [
  {
    "id": "30386",
    "name": "Kakamega Orthopaedic Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Orthopedics",
      "General Surgery"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 56 30001",
    "location": {
      "lat": 0.4485,
      "lng": 34.855
    },
    "county": "Kakamega",
    "sub_county": "Malava",
    "address": "East Kabras, Kakamega"
  },
  {
    "id": "17825",
    "name": "Kakamega Grace Medical Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30002",
    "location": {
      "lat": 0.283,
      "lng": 34.752
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "25996",
    "name": "Equity Afia Medical Clinic (Kakamega)",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Pediatrics"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 700 395395",
    "location": {
      "lat": 0.284,
      "lng": 34.753
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "23989",
    "name": "St.Christine Medical Centre-Kakamega",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30004",
    "location": {
      "lat": 0.282,
      "lng": 34.751
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Sheywe, Kakamega"
  },
  {
    "id": "15914",
    "name": "Kakamega Forest Dispensary",
    "type": "dispensary",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Nursing"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30005",
    "location": {
      "lat": 0.235,
      "lng": 34.86
    },
    "county": "Kakamega",
    "sub_county": "Shinyalu",
    "address": "Isukha Central, Kakamega"
  },
  {
    "id": "34063",
    "name": "Kakamega Dental Suite",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Dentistry"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30006",
    "location": {
      "lat": 0.289,
      "lng": 34.76
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Mahiakalo, Kakamega"
  },
  {
    "id": "33831",
    "name": "St. Raphael Kakamega Medical Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30007",
    "location": {
      "lat": 0.285,
      "lng": 34.754
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "33689",
    "name": "Sonar Imaging Centre-Kakamega",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Radiology"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30008",
    "location": {
      "lat": 0.288,
      "lng": 34.761
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Mahiakalo, Kakamega"
  },
  {
    "id": "24868",
    "name": "Oasis Doctors Plaza Kakamega",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Obstetrics & Gynecology",
      "Pediatrics",
      "General Surgery"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 56 30009",
    "location": {
      "lat": 0.286,
      "lng": 34.755
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "32949",
    "name": "West Hill Eye Centre-Kakamega",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Ophthalmology"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30010",
    "location": {
      "lat": 0.2835,
      "lng": 34.7525
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "32950",
    "name": "Avenue Health Care Limited-Kakamega",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine",
      "Pediatrics"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30011",
    "location": {
      "lat": 0.2815,
      "lng": 34.7505
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Sheywe, Kakamega"
  },
  {
    "id": "21434",
    "name": "Marie Stopes Kakamega Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Obstetrics & Gynecology"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30012",
    "location": {
      "lat": 0.281,
      "lng": 34.75
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Sheywe, Kakamega"
  },
  {
    "id": "23968",
    "name": "Kakamega Medcare Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30013",
    "location": {
      "lat": 0.2812,
      "lng": 34.7502
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Sheywe, Kakamega"
  },
  {
    "id": "28940",
    "name": "Eminent Smiles Dental Clinic Kakamega",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Dentistry"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30014",
    "location": {
      "lat": 0.2885,
      "lng": 34.7605
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Mahiakalo, Kakamega"
  },
  {
    "id": "24247",
    "name": "Bliss GVS Health Care Ltd Kakamega",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30015",
    "location": {
      "lat": 0.2882,
      "lng": 34.7602
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Mahiakalo, Kakamega"
  },
  {
    "id": "15892",
    "name": "Gk Prisons Dispensary (Kakamega Central)",
    "type": "dispensary",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30016",
    "location": {
      "lat": 0.2845,
      "lng": 34.7535
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "29077",
    "name": "Kakamega Satelite Blood Transfusion Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Hematology"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30017",
    "location": {
      "lat": 0.2838,
      "lng": 34.7528
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "27335",
    "name": "Kakamega High School Medical Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "School Health"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30018",
    "location": {
      "lat": 0.2842,
      "lng": 34.7532
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "23500",
    "name": "Kakamega Hilltop Medical Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30019",
    "location": {
      "lat": 0.29,
      "lng": 34.745
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Butsotso East, Kakamega"
  },
  {
    "id": "15844",
    "name": "Kakamega Central Nursing Home",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Nursing Care",
      "General Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30020",
    "location": {
      "lat": 0.2825,
      "lng": 34.7515
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Sheywe, Kakamega"
  },
  {
    "id": "15915",
    "name": "Kakamega County General Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Obstetrics & Gynecology",
      "Pediatrics",
      "General Surgery",
      "Internal Medicine",
      "Orthopedics"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 56 31122",
    "location": {
      "lat": 0.2828,
      "lng": 34.7519
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "21905",
    "name": "The Agakhan Medical Centre Kakamega",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine",
      "Pediatrics"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30021",
    "location": {
      "lat": 0.2888,
      "lng": 34.7608
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Mahiakalo, Kakamega"
  },
  {
    "id": "21020",
    "name": "Kakamega County Beyond Zero Mobile Clinic",
    "type": "dispensary",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Maternal & Child Health"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 56 30022",
    "location": {
      "lat": 0.2832,
      "lng": 34.7522
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Shirere, Kakamega"
  },
  {
    "id": "KMHFR-10003",
    "name": "Masinde Muliro University Clinic (MMUST Clinic)",
    "type": "dispensary",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 702 597360",
    "location": {
      "lat": 0.2882,
      "lng": 34.7675
    },
    "county": "Kakamega",
    "sub_county": "Lurambi",
    "address": "Mahiakalo, Kakamega"
  },
  {
    "id": "KMHFR-10006",
    "name": "Mukumu Mission Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "General Medicine",
      "Obstetrics & Gynecology"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 722 890456",
    "location": {
      "lat": 0.2052,
      "lng": 34.7788
    },
    "county": "Kakamega",
    "sub_county": "Shinyalu",
    "address": "Isukha Central, Kakamega"
  },
  {
    "id": "KMHFR-10001",
    "name": "Kenyatta National Hospital (KNH)",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Cardiology",
      "Oncology"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 20 2726300",
    "location": {
      "lat": -1.3013,
      "lng": 36.8016
    },
    "county": "Nairobi",
    "sub_county": "Kibra",
    "address": "Woodley/Kenyatta Golf Course, Nairobi"
  },
  {
    "id": "KMHFR-10004",
    "name": "M.P. Shah Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Cardiology",
      "Pediatrics"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 20 4291000",
    "location": {
      "lat": -1.2647,
      "lng": 36.8118
    },
    "county": "Nairobi",
    "sub_county": "Westlands",
    "address": "Parklands/Highridge, Nairobi"
  },
  {
    "id": "KMHFR-10005",
    "name": "The Nairobi Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Oncology",
      "Radiology"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 703 082000",
    "location": {
      "lat": -1.2941,
      "lng": 36.8041
    },
    "county": "Nairobi",
    "sub_county": "Dagoretti North",
    "address": "Kilimani, Nairobi"
  },
  {
    "id": "KMHFR-10007",
    "name": "Alupe Sub-County Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "General Medicine"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 711 223344",
    "location": {
      "lat": 0.4912,
      "lng": 34.1235
    },
    "county": "Busia",
    "sub_county": "Teso South",
    "address": "Angorom, Busia"
  },
  {
    "id": "KMHFR-10008",
    "name": "Coast General Teaching & Referral Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "General Surgery",
      "Obstetrics & Gynecology"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 41 2314201",
    "location": {
      "lat": -4.05,
      "lng": 39.6667
    },
    "county": "Mombasa",
    "sub_county": "Mvita",
    "address": "Tononoka, Mombasa"
  },
  {
    "id": "KMHFR-10009",
    "name": "Jaramogi Oginga Odinga Teaching & Referral Hospital (JOOTRH)",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Pediatrics",
      "Internal Medicine"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 57 2020804",
    "location": {
      "lat": -0.1022,
      "lng": 34.7617
    },
    "county": "Kisumu",
    "sub_county": "Kisumu Central",
    "address": "Market Milimani, Kisumu"
  },
  {
    "id": "KMHFR-10010",
    "name": "Moi Teaching and Referral Hospital (MTRH Eldoret)",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Oncology",
      "Nephrology",
      "Cardiology"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 53 2033471",
    "location": {
      "lat": 0.5143,
      "lng": 35.2698
    },
    "county": "Uasin Gishu",
    "sub_county": "Ainabkoi",
    "address": "Kaptagat, Uasin Gishu"
  },
  {
    "id": "KMHFR-10011",
    "name": "Nakuru Level 5 Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "General Surgery",
      "Pediatrics"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 51 2215500",
    "location": {
      "lat": -0.2833,
      "lng": 36.0667
    },
    "county": "Nakuru",
    "sub_county": "Nakuru East",
    "address": "Biashara, Nakuru"
  },
  {
    "id": "13320",
    "name": "USIU-Africa Health Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Emergency First Response"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 730 116000",
    "location": {
      "lat": -1.2188,
      "lng": 36.881
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Roysambu, Nairobi"
  },
  {
    "id": "13173",
    "name": "Ruaraka Uhai Neema Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Pediatrics",
      "Obstetrics & Gynecology",
      "General Surgery",
      "Internal Medicine"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 721 451498",
    "location": {
      "lat": -1.2272,
      "lng": 36.8852
    },
    "county": "Nairobi",
    "sub_county": "Ruaraka",
    "address": "Utalii, Nairobi"
  },
  {
    "id": "13214",
    "name": "St. Francis Community Hospital Kasarani",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Critical Care",
      "General Surgery",
      "Nephrology",
      "Pediatrics",
      "Obstetrics & Gynecology",
      "Orthopedics"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 722 201411",
    "location": {
      "lat": -1.2227,
      "lng": 36.9085
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Kasarani, Nairobi"
  },
  {
    "id": "24089",
    "name": "Kenyatta University Teaching, Referral and Research Hospital (KUTRRH)",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Oncology",
      "Cardiology",
      "Neurosurgery",
      "Cardiothoracic Surgery",
      "Critical Care",
      "Nephrology"
    ],
    "beds": 150,
    "occupancy": 45,
    "phone": "+254 800 721038",
    "location": {
      "lat": -1.1758,
      "lng": 36.9158
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Kahawa West, Nairobi"
  },
  {
    "id": "13019",
    "name": "Kasarani Sub-County Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Public Health",
      "Maternal Health",
      "Pediatrics"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 720 123456",
    "location": {
      "lat": -1.2225,
      "lng": 36.897
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Kasarani, Nairobi"
  },
  {
    "id": "26012",
    "name": "Equity Afia Medical Centre (Roysambu / Kasarani)",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Dentistry",
      "Pediatrics"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 765 000001",
    "location": {
      "lat": -1.2175,
      "lng": 36.8885
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Roysambu, Nairobi"
  },
  {
    "id": "23541",
    "name": "Bliss Healthcare Kasarani",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Family Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 730 704000",
    "location": {
      "lat": -1.2198,
      "lng": 36.886
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Roysambu, Nairobi"
  },
  {
    "id": "12863",
    "name": "Aga Khan University Hospital Outreach (Garden City / Roasters)",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Pediatrics",
      "Cardiology",
      "Internal Medicine",
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 730 011200",
    "location": {
      "lat": -1.2335,
      "lng": 36.877
    },
    "county": "Nairobi",
    "sub_county": "Ruaraka",
    "address": "Ruaraka, Nairobi"
  },
  {
    "id": "13002",
    "name": "Gertrude's Children's Hospital (Garden City Clinic)",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Pediatrics",
      "Child Health",
      "Pediatric Nursing"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 20 7206000",
    "location": {
      "lat": -1.233,
      "lng": 36.8765
    },
    "county": "Nairobi",
    "sub_county": "Ruaraka",
    "address": "Ruaraka, Nairobi"
  },
  {
    "id": "13144",
    "name": "Neema Hospital Kahawa Sukari",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "General Surgery",
      "Pediatrics",
      "Obstetrics & Gynecology"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 722 660034",
    "location": {
      "lat": -1.1895,
      "lng": 36.9325
    },
    "county": "Kiambu",
    "sub_county": "Ruiru",
    "address": "Kahawa Sukari, Kiambu"
  },
  {
    "id": "13170",
    "name": "Roysambu Health Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Maternal & Child Health",
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 711 223344",
    "location": {
      "lat": -1.215,
      "lng": 36.885
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Roysambu, Nairobi"
  },
  {
    "id": "32988",
    "name": "Avenue Healthcare (Garden City Clinic)",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine",
      "Dentistry",
      "Pediatrics"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 711 060000",
    "location": {
      "lat": -1.2332,
      "lng": 36.8768
    },
    "county": "Nairobi",
    "sub_county": "Ruaraka",
    "address": "Ruaraka, Nairobi"
  },
  {
    "id": "13038",
    "name": "Kenyatta University Health Services Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Student Health",
      "General Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 20 8710901",
    "location": {
      "lat": -1.1812,
      "lng": 36.9275
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Kahawa, Nairobi"
  },
  {
    "id": "USIU-ROYS-01",
    "name": "The Aga Khan University Hospital – Roysambu Speciality Care Centre",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "Internal Medicine",
      "Pediatrics",
      "Emergency Medicine"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 20 3662000",
    "location": {
      "lat": -1.21712,
      "lng": 36.8897
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Jewel Complex, TRM"
  },
  {
    "id": "USIU-ROYS-02",
    "name": "Aga Khan Roysambu Medical & Dialysis Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Nephrology",
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 20 2717077",
    "location": {
      "lat": -1.217624,
      "lng": 36.888787
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Jewel Complex, off Thika Rd/Kamiti Rd"
  },
  {
    "id": "USIU-ROYS-03",
    "name": "MEDANTER Hospital",
    "type": "hospital",
    "distance": 1.5,
    "availability": 80,
    "specialties": [
      "General Medicine",
      "General Surgery"
    ],
    "beds": 50,
    "occupancy": 45,
    "phone": "+254 754 810005",
    "location": {
      "lat": -1.2178,
      "lng": 36.8891
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "TRM Drive"
  },
  {
    "id": "USIU-ROYS-04",
    "name": "GracePoint HealthCare Roysambu",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 715 787878",
    "location": {
      "lat": -1.2172,
      "lng": 36.8895
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Jewel Complex"
  },
  {
    "id": "USIU-ROYS-05",
    "name": "Medanta Africare – Thika Road Mall Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine",
      "Cardiology Clinic"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 732 109650",
    "location": {
      "lat": -1.2177,
      "lng": 36.889
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "TRM, Thika Road"
  },
  {
    "id": "USIU-ROYS-06",
    "name": "AAR Healthcare Roysambu Outpatient Centre",
    "type": "hospital",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Family Practice",
      "Pediatrics"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 731 191076",
    "location": {
      "lat": -1.2165,
      "lng": 36.8872
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Royal Plaza, off Kamiti Road"
  },
  {
    "id": "USIU-ROYS-07",
    "name": "Roysambu Onsite Surgical Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Surgery",
      "Day Surgery"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 722 907623",
    "location": {
      "lat": -1.21715,
      "lng": 36.88965
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Jewel Plaza, 4th Floor"
  },
  {
    "id": "USIU-ROYS-08",
    "name": "Marurui Health Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Primary Care",
      "Maternal Health"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000108",
    "location": {
      "lat": -1.209629,
      "lng": 36.874267
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Marurui Shopping Centre"
  },
  {
    "id": "USIU-ROYS-09",
    "name": "Partners For Care Medical Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Public Health"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000109",
    "location": {
      "lat": -1.211541,
      "lng": 36.874459
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Marurui"
  },
  {
    "id": "USIU-ROYS-10",
    "name": "Mimosa Cottage Hospital",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Obstetrics & Gynecology",
      "General Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000110",
    "location": {
      "lat": -1.20999,
      "lng": 36.873918
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Marurui"
  },
  {
    "id": "USIU-ROYS-11",
    "name": "Gateway Health Care Thome",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Family Medicine"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000111",
    "location": {
      "lat": -1.20956,
      "lng": 36.874859
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Thome/Marurui"
  },
  {
    "id": "USIU-ROYS-12",
    "name": "Equity Afia Medical Centre - Marurui",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Maternal Health"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 765 000012",
    "location": {
      "lat": -1.210033,
      "lng": 36.876245
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Marurui"
  },
  {
    "id": "USIU-ROYS-13",
    "name": "Kenya Women & Children Wellness Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Maternal & Child Health",
      "Counseling"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000113",
    "location": {
      "lat": -1.204401,
      "lng": 36.883388
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Mirema Drive, Marurui"
  },
  {
    "id": "USIU-ROYS-14",
    "name": "Vivo Health Clinics",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice",
      "Preventive Care"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000114",
    "location": {
      "lat": -1.210001,
      "lng": 36.874194
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Ushindi Avenue, Marurui"
  },
  {
    "id": "USIU-ROYS-15",
    "name": "Mirema Medical Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine",
      "Nursing"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000115",
    "location": {
      "lat": -1.211302,
      "lng": 36.887699
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Mirema Shopping Centre"
  },
  {
    "id": "USIU-ROYS-16",
    "name": "Mirema Curafa Franchise Clinic Ltd",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Primary Care"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000116",
    "location": {
      "lat": -1.209542,
      "lng": 36.885206
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Mirema Springs Estate"
  },
  {
    "id": "USIU-ROYS-17",
    "name": "Care and Cure Health Services",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Emergency Care",
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000117",
    "location": {
      "lat": -1.227697,
      "lng": 36.876437
    },
    "county": "Nairobi",
    "sub_county": "Ruaraka",
    "address": "Garden City/EABL area"
  },
  {
    "id": "USIU-ROYS-18",
    "name": "Royalstone Afya Limited",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000118",
    "location": {
      "lat": -1.20669,
      "lng": 36.890251
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Lumumba Drive, Roysambu"
  },
  {
    "id": "USIU-ROYS-19",
    "name": "Bar Hostess Empowerment Support Program – Roysambu",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Public Health",
      "Counseling"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000119",
    "location": {
      "lat": -1.210834,
      "lng": 36.891544
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "TRM/Roysambu"
  },
  {
    "id": "USIU-ROYS-20",
    "name": "Penda Medical Centre – Zimmerman",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Family Medicine",
      "Pediatrics"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 20 7909045",
    "location": {
      "lat": -1.208759,
      "lng": 36.89205
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Zimmerman, Base Road"
  },
  {
    "id": "USIU-ROYS-21",
    "name": "St Teresa Medical Clinic – Zimmerman",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000121",
    "location": {
      "lat": -1.20599,
      "lng": 36.89528
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Zimmerman"
  },
  {
    "id": "USIU-ROYS-22",
    "name": "Deliverance Church Kasarani Medical Clinic – Zimmerman",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Primary Care"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000122",
    "location": {
      "lat": -1.211924,
      "lng": 36.895864
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Zimmerman Shopping Centre"
  },
  {
    "id": "USIU-ROYS-23",
    "name": "Zimmer Medical Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Medicine",
      "Maternal Health"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000123",
    "location": {
      "lat": -1.2032,
      "lng": 36.9038
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Zimmerman, off Kamiti Road"
  },
  {
    "id": "USIU-ROYS-24",
    "name": "Zimmerman Pickens Dispensary",
    "type": "dispensary",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Nursing",
      "Primary Care"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000124",
    "location": {
      "lat": -1.200733,
      "lng": 36.878403
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Picken Garden Estate"
  },
  {
    "id": "USIU-ROYS-25",
    "name": "The St. Mary Integrated Medical Centre",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000125",
    "location": {
      "lat": -1.205276,
      "lng": 36.896394
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Zimmerman, off Kamiti Road"
  },
  {
    "id": "USIU-ROYS-26",
    "name": "The St. Mary Integrated Medical Centre – Annex",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000126",
    "location": {
      "lat": -1.212577,
      "lng": 36.893634
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Near Co-operative Bank, Zimmerman"
  },
  {
    "id": "USIU-ROYS-27",
    "name": "Zimma Health Care",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000127",
    "location": {
      "lat": -1.20694,
      "lng": 36.89414
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Zimmerman"
  },
  {
    "id": "USIU-ROYS-28",
    "name": "Index Medical Services",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "General Practice"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000128",
    "location": {
      "lat": -1.20683,
      "lng": 36.89472
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Success Stage, off Kamiti Road"
  },
  {
    "id": "USIU-ROYS-29",
    "name": "Miamis Dental Clinic",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "Dentistry"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000129",
    "location": {
      "lat": -1.206971,
      "lng": 36.894033
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Mishael Plaza, Zimmerman"
  },
  {
    "id": "USIU-ROYS-30",
    "name": "LEA Toto Zimmerman",
    "type": "health_center",
    "distance": 1.5,
    "availability": 92,
    "specialties": [
      "HIV Medicine",
      "Counseling"
    ],
    "beds": 10,
    "occupancy": 45,
    "phone": "+254 720 000130",
    "location": {
      "lat": -1.20876,
      "lng": 36.89465
    },
    "county": "Nairobi",
    "sub_county": "Kasarani",
    "address": "Kamiti Road, Zimmerman"
  }
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

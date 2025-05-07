
import { Assignment } from '@/types/assignment';

// Mock data with current dates
export const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Vandskade inspektion',
    description: 'Komplet inspektion af vandskade i kælderområdet.',
    date: '2025-05-06',
    fromTime: '09:00',
    toTime: '11:00',
    location: 'Aarhus Central',
    car: 'Van 1',
    employees: ['John Doe'],
    published: true
  },
  {
    id: '2',
    title: 'Brandskade restaurering',
    description: 'Første vurdering af brandskade i lejlighed.',
    date: '2025-05-07',
    fromTime: '13:00',
    toTime: '16:00',
    location: 'København Syd',
    car: 'Truck 3',
    employees: ['Jane Smith'],
    published: false
  },
  {
    id: '3',
    title: 'Skimmelsvamp vurdering',
    description: 'Inspicer og vurder skimmelsvamp skade på køkkenvægge.',
    date: '2025-05-09',
    fromTime: '10:00',
    toTime: '12:30',
    location: 'Odense Øst',
    car: 'Van 2',
    employees: ['Mike Johnson', 'Anna Williams'],
    published: false
  },
  {
    id: '4',
    title: 'Vandskade opfølgning',
    description: 'Opfølgning på tidligere vandskade.',
    date: '2025-05-13', // Next week
    fromTime: '14:00',
    toTime: '16:00',
    location: 'Aalborg',
    car: 'Van 1',
    employees: ['John Doe'],
    published: false
  },
  {
    id: '5',
    title: 'Brandinspektion',
    description: 'Rutinemæssig inspektion af brandskader.',
    date: '2025-05-15', // Next week
    fromTime: '09:00',
    toTime: '11:30',
    location: 'Esbjerg',
    car: 'Sedan 1',
    employees: ['Jane Smith'],
    published: false
  },
  // Current week mock assignments 
  {
    id: '6',
    title: 'Akut vandskade',
    description: 'Hurtig inspektion af vandskade i lejlighed.',
    date: '2025-05-07', // Current week
    fromTime: '08:00',
    toTime: '10:00',
    location: 'Vejle Centrum',
    car: 'Van 3',
    employees: ['John Doe'],
    published: true
  },
  {
    id: '7',
    title: 'Fugtmåling',
    description: 'Standard fugtmåling efter tidligere vandskade.',
    date: '2025-05-07', // Current week
    fromTime: '11:00',
    toTime: '12:30',
    location: 'Kolding Nord',
    car: 'Van 1',
    employees: ['John Doe'],
    published: true
  },
  {
    id: '8',
    title: 'Tag inspektion',
    description: 'Inspektion af tag efter storm',
    date: '2025-05-08', // Current week 
    fromTime: '09:00',
    toTime: '11:30',
    location: 'Horsens',
    car: 'Van 2',
    employees: ['Jane Smith', 'Mike Johnson'],
    published: true
  },
  {
    id: '9',
    title: 'Kælder udtørring',
    description: 'Opsætning af udstyr til udtørring af kælder',
    date: '2025-05-08', // Current week
    fromTime: '13:00',
    toTime: '15:30',
    location: 'Fredericia',
    car: 'Truck 2',
    employees: ['Anna Williams'],
    published: false
  },
  {
    id: '10',
    title: 'Skade vurdering',
    description: 'Generel vurdering af vandskadet ejendom',
    date: '2025-05-10', // Current week (weekend)
    fromTime: '10:00',
    toTime: '12:00',
    location: 'Middelfart',
    car: 'Van 3',
    employees: ['Mike Johnson'],
    published: false
  }
];

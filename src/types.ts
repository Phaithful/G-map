export interface Location {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description?: string;
  openingHours?: string;
  distance?: string;   // optional, for showing in cards
  imageUrl?: string;   // optional, for cards
}

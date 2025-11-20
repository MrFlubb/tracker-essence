export interface FuelEntry {
  prix: number;      // Price in currency (e.g., Euros)
  litres: number;    // Volume in Liters
  kilometres: number; // Distance driven since last refill
  date?: string;     // Optional date string if backend requires/returns it
}

export interface FuelChartData {
  id: string | number;
  date: string;
  fullDate: string;
  pricePerLiter: number;
  totalCost: number;
  distance: number;
  volume: number;
  efficiency?: number; // L/100km calculation
}

export interface APIResponse {
  success: boolean;
  message?: string;
  data?: any;
}
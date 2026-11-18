export type NearEarthObject = {
  id: string | null;
  name: string | null;
  isPotentiallyHazardousAsteroid: boolean | null;
  estimatedDiameterMinKm: number | null;
  estimatedDiameterMaxKm: number | null;
  closeApproachDate: string | null;
  relativeVelocityKph: string | null;
  missDistanceKm: string | null;
}

export type NearEarthObjectFeed = {
  elementCount: number | null;
  objects: (NearEarthObject | null)[] | null;
}

export type NearEarthObjectsInput = {
  startDate: string;
  endDate: string;
}

export type NasaCloseApproach = {
  close_approach_date: string;
  relative_velocity: { kilometers_per_hour: string };
  miss_distance: { kilometers: string };
}

export type NasaNearEarthObject = {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data: NasaCloseApproach[];
}

export type NasaNeoFeed = {
  element_count?: number | null;
  near_earth_objects?: {
    [date: string]: NasaNearEarthObject[];
  } | null;
}

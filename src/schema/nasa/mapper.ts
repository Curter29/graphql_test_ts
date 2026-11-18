import { NasaNeoFeed, NearEarthObjectFeed } from './types';

export const mapNeoFeed = (raw: NasaNeoFeed): NearEarthObjectFeed => ({
  elementCount: raw.element_count ?? null,
  objects: Object.values(raw.near_earth_objects ?? {}).flat().map(object => {
    const approach = object.close_approach_data[0];
    return {
      id: object.id,
      name: object.name,
      isPotentiallyHazardousAsteroid: object.is_potentially_hazardous_asteroid,
      estimatedDiameterMinKm: object.estimated_diameter.kilometers.estimated_diameter_min,
      estimatedDiameterMaxKm: object.estimated_diameter.kilometers.estimated_diameter_max,
      closeApproachDate: approach?.close_approach_date ?? null,
      relativeVelocityKph: approach?.relative_velocity.kilometers_per_hour ?? null,
      missDistanceKm: approach?.miss_distance.kilometers ?? null,
    };
  }),
});

import type { MeshInContextSDK } from '../../../.mesh';
import { ContextType } from '../../types';
import { mapNeoFeed } from './mapper';
import { NearEarthObjectFeed, NearEarthObjectsInput } from './types';

export const nearEarthObjects = async (
  _parent: unknown,
  args: NearEarthObjectsInput,
  context: ContextType,
): Promise<NearEarthObjectFeed | null> => {
  const { getBuiltMesh } = await import('../../../.mesh');
  const mesh = await getBuiltMesh();
  const meshContext =
    await mesh.getEnveloped(context).contextFactory() as ContextType & MeshInContextSDK;
  const raw = await meshContext.NASA.Query.neoFeed({
    args,
    context: meshContext,
    selectionSet: '{ element_count near_earth_objects }',
  });
  if (raw instanceof Error) {
    throw raw;
  }
  return raw == null ? null : mapNeoFeed(raw);
};

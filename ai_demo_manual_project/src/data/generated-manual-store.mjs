import { createDocumentationHubState } from "../core/manual-pilot.mjs";

const generatedSystems = new Map();

export function setGeneratedSystemState(systemId, payload) {
  generatedSystems.set(systemId, {
    ...payload,
    updatedAt: new Date().toISOString()
  });
}

export function getGeneratedSystemState(systemId) {
  return generatedSystems.get(systemId) ?? null;
}

export function hasGeneratedSystemState(systemId) {
  return generatedSystems.has(systemId);
}

export function clearGeneratedSystemState(systemId) {
  generatedSystems.delete(systemId);
}

export function buildGeneratedSystemSnapshot(systemId) {
  const generated = getGeneratedSystemState(systemId);
  if (!generated) {
    return { available: false };
  }

  const hubState = createDocumentationHubState(generated.source, generated.changeEvent, {
    syncedAt: generated.uploadMeta?.uploadedAt ?? new Date().toISOString(),
    sourceRepository: generated.source.upstreamRepository
  });

  return {
    available: true,
    source: generated.source,
    changeEvent: generated.changeEvent,
    uploadMeta: generated.uploadMeta,
    hubState
  };
}

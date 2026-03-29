/**
 * Testes para verificar que ParseUUIDPipe esta aplicado nos controllers.
 * Fonte: docs/backend/07-controllers.md (ParseUUIDPipe em todos :id params)
 * Fonte: docs/backend/10-validation.md (UUID v4 validation)
 */
import { ParseUUIDPipe } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { ClusterController } from '../../src/modules/cluster/cluster.controller';
import { NodeController } from '../../src/modules/node/node.controller';
import { FileController } from '../../src/modules/file/file.controller';
import { HealthController } from '../../src/modules/health/health.controller';

function hasParseUUIDPipe(controller: any, methodName: string): boolean {
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    controller,
    methodName,
  );
  if (!metadata) return false;

  return Object.values(metadata).some((param: any) => {
    if (!param?.pipes) return false;
    return param.pipes.some(
      (pipe: any) =>
        pipe === ParseUUIDPipe ||
        pipe?.name === 'ParseUUIDPipe' ||
        (typeof pipe === 'function' && pipe === ParseUUIDPipe) ||
        (typeof pipe === 'object' && pipe instanceof ParseUUIDPipe),
    );
  });
}

describe('ParseUUIDPipe on controllers', () => {
  it('ClusterController.findById should use ParseUUIDPipe on :id', () => {
    expect(hasParseUUIDPipe(ClusterController, 'findById')).toBe(true);
  });

  it('NodeController.findById should use ParseUUIDPipe on :id', () => {
    expect(hasParseUUIDPipe(NodeController, 'findById')).toBe(true);
  });

  it('NodeController.drain should use ParseUUIDPipe on :id', () => {
    expect(hasParseUUIDPipe(NodeController, 'drain')).toBe(true);
  });

  it('NodeController.remove should use ParseUUIDPipe on :id', () => {
    expect(hasParseUUIDPipe(NodeController, 'remove')).toBe(true);
  });

  it('FileController.findById should use ParseUUIDPipe on :id', () => {
    expect(hasParseUUIDPipe(FileController, 'findById')).toBe(true);
  });

  it('FileController.remove should use ParseUUIDPipe on :id', () => {
    expect(hasParseUUIDPipe(FileController, 'remove')).toBe(true);
  });

  it('HealthController.resolveAlert should use ParseUUIDPipe on :id', () => {
    expect(hasParseUUIDPipe(HealthController, 'resolveAlert')).toBe(true);
  });
});

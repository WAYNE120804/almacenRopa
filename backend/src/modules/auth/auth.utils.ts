export function normalizeLoginIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function serializeUserScopes(
  scopes:
    | Array<{
        vendedorId: string | null;
        rifaVendedorId: string | null;
      }>
    | undefined
) {
  const vendedorIds = new Set<string>();
  const rifaVendedorIds = new Set<string>();

  for (const scope of scopes || []) {
    if (scope.vendedorId) {
      vendedorIds.add(scope.vendedorId);
    }

    if (scope.rifaVendedorId) {
      rifaVendedorIds.add(scope.rifaVendedorId);
    }
  }

  return {
    vendedorIds: [...vendedorIds],
    rifaVendedorIds: [...rifaVendedorIds],
  };
}

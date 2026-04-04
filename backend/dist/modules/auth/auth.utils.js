"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLoginIdentifier = normalizeLoginIdentifier;
exports.serializeUserScopes = serializeUserScopes;
function normalizeLoginIdentifier(value) {
    return value.trim().toLowerCase();
}
function serializeUserScopes(scopes) {
    const vendedorIds = new Set();
    const rifaVendedorIds = new Set();
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

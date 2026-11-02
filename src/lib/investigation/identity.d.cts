interface IdentityEntity { id: string; name: string; type: string; props?: Record<string, unknown>; source?: string; sources?: string[]; confidence?: number }
declare const identity: {
  sameIdentity(a: IdentityEntity, b: IdentityEntity): { same: boolean; reason?: string; confidence?: number };
  mergeGroup(entities: IdentityEntity[]): IdentityEntity;
};
export = identity;

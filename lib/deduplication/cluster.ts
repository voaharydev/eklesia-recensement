import type { DuplicateBucket, DuplicateGroup, DuplicateMatchType } from "./types";

class UnionFind {
  private parent = new Map<string, string>();

  find(id: string): string {
    const parent = this.parent.get(id);
    if (!parent || parent === id) {
      this.parent.set(id, id);
      return id;
    }
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootB, rootA);
    }
  }

  groups(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const id of Array.from(this.parent.keys())) {
      const root = this.find(id);
      const list = result.get(root) ?? [];
      list.push(id);
      result.set(root, list);
    }
    for (const ids of Array.from(result.values())) {
      ids.sort();
    }
    return result;
  }
}

function stableGroupId(personIds: string[]): string {
  return personIds.slice().sort().join(":");
}

export function clusterDuplicateBuckets(
  buckets: DuplicateBucket[],
): { groupId: string; personIds: string[]; matchTypes: DuplicateMatchType[] }[] {
  const uf = new UnionFind();
  const matchTypesByPerson = new Map<string, Set<DuplicateMatchType>>();

  for (const bucket of buckets) {
    for (const personId of bucket.personIds) {
      if (!matchTypesByPerson.has(personId)) {
        matchTypesByPerson.set(personId, new Set());
      }
      matchTypesByPerson.get(personId)!.add(bucket.matchType);
    }

    for (let i = 1; i < bucket.personIds.length; i += 1) {
      uf.union(bucket.personIds[0]!, bucket.personIds[i]!);
    }
  }

  const rawGroups = uf.groups();
  const aggregatedMatchTypes = new Map<string, Set<DuplicateMatchType>>();

  for (const bucket of buckets) {
    for (const personId of bucket.personIds) {
      const root = uf.find(personId);
      if (!aggregatedMatchTypes.has(root)) {
        aggregatedMatchTypes.set(root, new Set());
      }
      aggregatedMatchTypes.get(root)!.add(bucket.matchType);
    }
  }

  return Array.from(rawGroups.entries()).map(([root, personIds]) => {
    const sortedIds = personIds.slice().sort();
    const types = aggregatedMatchTypes.get(root) ?? new Set<DuplicateMatchType>();
    return {
      groupId: stableGroupId(sortedIds),
      personIds: sortedIds,
      matchTypes: Array.from(types).sort() as DuplicateMatchType[],
    };
  });
}

export function buildDuplicateGroups(
  clusters: { groupId: string; personIds: string[]; matchTypes: DuplicateMatchType[] }[],
  personsById: Map<string, DuplicateGroup["persons"][number]>,
): DuplicateGroup[] {
  return clusters
    .map((cluster) => ({
      id: cluster.groupId,
      matchTypes: cluster.matchTypes,
      persons: cluster.personIds
        .map((id) => personsById.get(id))
        .filter((p): p is DuplicateGroup["persons"][number] => p != null),
    }))
    .filter((group) => group.persons.length >= 2)
    .sort((a, b) => a.persons[0]!.lastName.localeCompare(b.persons[0]!.lastName));
}

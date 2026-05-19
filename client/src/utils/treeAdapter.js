// Converts API persons + relationships → react-family-tree node format
export function buildTreeNodes(persons, relationships) {
  return persons.map((person) => {
    const id = String(person.id);

    const parents = relationships
      .filter(r => r.type === 'PARENT_OF' && String(r.personBId) === id)
      .map(r => ({ id: String(r.personAId), type: 'blood' }));

    const children = relationships
      .filter(r => r.type === 'PARENT_OF' && String(r.personAId) === id)
      .map(r => ({ id: String(r.personBId), type: 'blood' }));

    const spouses = relationships
      .filter(r => r.type === 'SPOUSE_OF' &&
        (String(r.personAId) === id || String(r.personBId) === id))
      .map(r => ({
        id: String(r.personAId) === id ? String(r.personBId) : String(r.personAId),
        type: 'married',
      }));

    return {
      id,
      gender: person.gender === 'FEMALE' ? 'female' : 'male',
      parents,
      children,
      siblings: [],
      spouses,
    };
  });
}

// Pick best root: oldest person by birthDate, fallback to first
export function pickRoot(persons) {
  if (!persons.length) return null;
  const sorted = [...persons].sort((a, b) => {
    const ay = parseInt(a.birthDate) || 9999;
    const by = parseInt(b.birthDate) || 9999;
    return ay - by;
  });
  return String(sorted[0].id);
}

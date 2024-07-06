import Filter from 'bad-words';
const filter = new Filter();

export function checkProfanity(text) {
  return { profane: filter.isProfane(text), profaneText: filter.clean(text) };
};

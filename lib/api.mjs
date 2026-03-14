import Pokedex from 'pokedex-promise-v2';

const P = new Pokedex({ cacheLimit: 60 * 60 * 1000, timeout: 10000 });

export { P };

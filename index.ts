import {Console, Effect, Schedule} from 'effect';
import {Schema} from '@effect/schema';
import type {ParseError} from '@effect/schema/ParseResult';
import {HttpClient} from '@effect/platform';
import {type BunContext, BunRuntime} from '@effect/platform-bun';
import * as Http from '@effect/platform/HttpClient';

const POKEMON_URL_PREFIX = 'https://pokeapi.co/api/v2/pokemon-species';
const ROWS_PER_PAGE = 5;

const Pokemon = Schema.Struct({
  name: Schema.String,
  url: Schema.String
});
type Pokemon = Schema.Schema.Type<typeof Pokemon>;
type PokemonArray = Schema.Schema.Type<(typeof Pokemon)[]>;
const pikachu = {
  name: 'Pikachu',
  url: 'https://pokeapi.co/api/v2/pokemon-species/1/'
};

const divide = (a: number, b: number): Effect.Effect<number, Error, never> =>
  b === 0
    ? Effect.fail(new Error('Cannot divide by zero'))
    : Effect.succeed(a / b);

async function fetchPokemonPage(page: number) {
  const offset = (page - 1) * ROWS_PER_PAGE;
  const url = POKEMON_URL_PREFIX + `?offset=${offset}&limit=${ROWS_PER_PAGE}`;
  const response = await fetch(url);
  const json = await response.json();
  return json.results as Pokemon[];
}

// Type parameters of the Effect generic type are
// success type, error type, and requirements.
function getPokemonPage(
  page: number
): Effect.Effect<PokemonArray, HttpClient.error.HttpClientError> {
  const offset = (page - 1) * ROWS_PER_PAGE;
  const url = POKEMON_URL_PREFIX + `?offset=${offset}&limit=${ROWS_PER_PAGE}`;
  Effect.timeout('1 seconds');
  Effect.retry({times: 3});
  return Http.request.get(url).pipe(
    // Effect.catchTag('ParseError', () => Effect.succeed(pikachu)),
    Http.client.fetch,
    Http.response.json
  );
  // Using the exponential backoff retry strategy.
  // return Effect.retry(Schedule.exponential(1000).pipe(Schedule.compose(Schedule.recurs(3)));

  // Is this for observing the processing?
  // Effect.withSpan('getPokemonPage2', { attributes: { id: page } });
}

async function load() {
  const page = 1;
  // const pokemonList = await getPokemonPage(page);
  // console.log("index.ts load: pokemonList =", pokemonList);
  BunRuntime.runMain(
    getPokemonPage(page).pipe(
      Effect.andThen(res => Console.log(typeof res, res.results))
    )
  );
}

load();

// const result = divide(42, 6);
// console.log('index.ts : result =', result);
// const program = Console.log('Hello, World!');
// Effect.runSync(program);

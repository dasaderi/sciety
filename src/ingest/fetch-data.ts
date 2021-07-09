import { performance } from 'perf_hooks';
import axios from 'axios';
import chalk from 'chalk';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';

const axiosGet = async <D>(url: string, headers: Record<string, string>) => {
  const startTime = performance.now();
  return axios.get<D>(url, { headers }).finally(() => {
    if (process.env.INGEST_LOG === 'io') {
      const endTime = performance.now();
      process.stdout.write(chalk.yellow(`Fetched ${url} (${Math.round(endTime - startTime)}ms)\n`));
    }
  });
};

export const fetchData = <D>(url: string, headers: Record<string, string> = {}): TE.TaskEither<string, D> => pipe(
  TE.tryCatch(
    async () => axiosGet<D>(url, headers),
    String,
  ),
  TE.map((response) => response.data),
);

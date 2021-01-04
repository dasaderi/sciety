import { Middleware } from '@koa/router';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { BadRequest } from 'http-errors';
import {
  commandHandler, CommitEvents, validateCommand, ValidCommand,
} from './command-handler';
import { GetAllEvents } from './respond-helpful-command';
import toReviewId from '../types/review-id';
import { User } from '../types/user';

type Ports = {
  commitEvents: CommitEvents;
  getAllEvents: GetAllEvents;
};

export const respondHandler = (ports: Ports): Middleware<{ user: User }> => async (context, next) => {
  const { user } = context.state;
  const reviewId = toReviewId(context.request.body.reviewid);

  const referrer = (context.request.headers.referer ?? '/') as string;
  const command = context.request.body.command as string;
  const validatedCommand = validateCommand(command);

  await commandHandler(
    ports.commitEvents,
    ports.getAllEvents,
    pipe(
      validatedCommand,
      O.getOrElse<ValidCommand>(() => { throw new BadRequest(); }),
    ),
    user.id,
    reviewId,
  )();

  context.redirect(`${referrer}#${reviewId.toString()}`);

  await next();
};

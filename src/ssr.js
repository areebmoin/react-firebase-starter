/**
 * React Starter Kit for Firebase
 * https://github.com/kriasoft/react-firebase-starter
 * Copyright (c) 2015-present Kriasoft | MIT License
 */

/* @flow */

import serialize from 'serialize-javascript';
import createHistory from 'history/createMemoryHistory';
import { fetchQuery } from 'relay-runtime';
import { Router } from 'express';

import authenticate from './authenticate';
import templates from './templates';
import routes from './router';
import createRelay from './createRelay.node';
import config from './config';
import assets from './assets.json';

const router = new Router();

router.get('*', authenticate, async (req, res, next) => {
  try {
    const { path: pathname } = req;
    const history = createHistory({ initialEntries: [pathname] });
    const relay = createRelay(req);

    // Find a matching route for the URL path
    const route = await routes.resolve({
      pathname,
      history,
      fetchQuery: fetchQuery.bind(undefined, relay),
    });

    if (route.redirect) {
      res.redirect(route.redirect, route.status || 301);
    } else {
      if (process.env.GCP_PROJECT === 'react-firebase-graphql') {
        res.set('Cache-Control', 'public, max-age=600, s-maxage=900');
      }
      res.send(
        templates.ok({
          title: route.title,
          description: route.description,
          assets: (route.chunks || []).reduce(
            (chunks, name) => [...chunks, ...assets[name]],
            assets.main,
          ),
          data: serialize(req.data, { isJSON: true }),
          config: JSON.stringify(config),
        }),
      );
    }
  } catch (err) {
    next(err);
  }
});

export default router;
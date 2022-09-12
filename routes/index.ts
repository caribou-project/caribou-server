import * as GET from './resolvers/get';

import { IRoutes } from '../types';

const routes: IRoutes = {
    get: [{
        path: "/subtitles",
        resolve: GET.getSubtitles
    }, {
        path: '/subtitle/:imdb_id',
        resolve: GET.getSubtitle
    }],
    post: []
}

export default routes;
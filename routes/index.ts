import * as GET from './resolvers/get';

import { IRoutes } from '../types';

const routes: IRoutes = {
    get: [{
        path: "/search",
        resolve: GET.searchSubtitles
    }, {
        path: '/subtitle/:track_id',
        resolve: GET.getSubtitle
    }],
    post: []
}

export default routes;
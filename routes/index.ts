import * as GET from './resolvers/get';

import { IRoutes } from '../types';

const routes: IRoutes = {
    get: [{
        path: "/search",
        resolve: GET.searchSubtitles
    }, {
        path: '/subtitle/:track_id',
        resolve: GET.getSubtitle
    }, {
        path: '/subtitles',
        resolve: GET.getSubtitles
    }],
    post: []
}

export default routes;
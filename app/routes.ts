import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/Auth', 'routes/Auth.tsx')
] satisfies RouteConfig;

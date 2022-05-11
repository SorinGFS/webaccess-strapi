'use strict';
// proxy plugin
const createError = require('http-errors');
// proxy options for strapi
module.exports = {
    userResDecorator: async function (proxyRes, proxyResData, userReq, userRes) {
        if (userReq.server.auth && userReq.server.auth.mode) {
            if (!userReq.authenticated && proxyRes.headers['content-type'] && /json/.test(proxyRes.headers['content-type'])) {
                const data = JSON.parse(proxyResData.toString('utf8'));
                let login;
                if (data.jwt) {
                    // strapi user token
                    // if user audience not defined in Strapi User means the user have access to all hosts managed by that strapi instalation (if mode than ome exists)
                    if (!data.user.audience || data.user.audience.split(',').includes(userReq.hostname)) {
                        login = await userReq.server.auth.jwt.login(userReq, data.jwt, data.user);
                        data.jwt = login.jwt;
                        if (login.refresh) data.refresh = login.refresh;
                    } else {
                        throw createError(403, 'Forbidden origin.');
                    }
                } else if (data.data && data.data.token) {
                    // strapi admin token
                    login = await userReq.server.auth.jwt.login(userReq, data.data.token, data.data.user);
                    data.data.token = login.jwt;
                    if (login.refresh) data.data.refresh = login.refresh;
                } else {
                    return proxyResData;
                }
                return JSON.stringify(data);
            } else {
                return proxyResData;
            }
        } else {
            return proxyResData;
        }
    },
};

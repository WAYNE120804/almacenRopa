"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecialChannelsDashboard = getSpecialChannelsDashboard;
const supervision_service_1 = require("./supervision.service");
async function getSpecialChannelsDashboard(req, res, next) {
    try {
        res.json(await (0, supervision_service_1.getSpecialChannelDashboard)(req.authUser));
    }
    catch (error) {
        next(error);
    }
}

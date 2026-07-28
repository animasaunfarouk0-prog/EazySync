// src/config/prisma.js
//
// Single shared Prisma client instance. Every service imports FROM HERE,
// so that we don't have multiple instances of PrismaClient floating around.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;

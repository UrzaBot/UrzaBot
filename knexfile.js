module.exports = {
  development: {
    client: "sqlite3",
    connection: { filename: "./data/dev.db3" },
    useNullAsDefault: true,
    migrations: {
      directory: "./data/migrations",
    },
    seeds: { directory: "./data/seeds" },
    pool: {
      afterCreate: (conn, done) => {
        conn.run("PRAGMA foreign_keys = ON", done);
      },
    },
  },
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    useNullAsDefault: true,
    migrations: {
      directory: "./data/migrations",
    },
    seeds: {
      directory: "./data/seeds",
    },
    pool: {
      // afterCreate: (conn, done) => {
      //   conn.run("PRAGMA foreign_keys = ON", done);
      // },
      min: 2,
      max: 10,
    },
  },
};

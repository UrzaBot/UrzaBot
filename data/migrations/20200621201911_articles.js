exports.up = function (knex) {
  return knex.schema
    .createTable("articles", tbl => {
      tbl.increments();
      tbl.string("url").notNullable().unique();
      tbl.string("title").notNullable();
      tbl.string("author");
      tbl.date("date");
      tbl.string("image_url");
      tbl.string("category");
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("articles");
};

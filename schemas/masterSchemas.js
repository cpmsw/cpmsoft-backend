const masterSchemas = {
  customers: {
    table: "customers",
    columns: ["id", "name", "email", "phone"],
    required: ["name"],
    allowDelete: true
  },

  terms: {
    table: "terms",
    columns: ["id", "name", "days"],
    required: ["name", "days"],
    allowDelete: true
  },

  status: {
    table: "status",
    columns: ["id", "name"],
    required: ["name"],
    allowDelete: false
  }
};

module.exports = masterSchemas;
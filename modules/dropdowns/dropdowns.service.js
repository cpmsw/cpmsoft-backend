const appDb = require("cpmsoft-core/common/db/appDb");
const crud =
  require("cpmsoft-core/common/services/baseCrudService");

const TABLE = "list_dropdowns";


async function getList(
  tenantId,
  type
) {

  const dropdownType =
    String(type || "")
      .trim()
      .toUpperCase();


  const result =
    await appDb.query(
      `
        SELECT
          id,
          dropdown_value,
          dropdown_code,
          sort_order
        FROM list_dropdowns
        WHERE tenant_id = $1
          AND dropdown_type = $2
          AND is_active = true
          AND deleted_at IS NULL
        ORDER BY
          sort_order,
          dropdown_value
      `,
      [
        tenantId,
        dropdownType
      ]
    );


  return result.rows;
}


async function getAll(
  tenantId
) {

  const result =
    await appDb.query(
      `
        SELECT
          dropdown_type,
          id,
          dropdown_value,
          dropdown_code,
          sort_order
        FROM list_dropdowns
        WHERE tenant_id = $1
          AND is_active = true
          AND deleted_at IS NULL
        ORDER BY
          dropdown_type,
          sort_order,
          dropdown_value
      `,
      [tenantId]
    );


  const grouped = {};


  for (const row of result.rows) {

    if (
      !grouped[row.dropdown_type]
    ) {
      grouped[row.dropdown_type] = [];
    }


    grouped[row.dropdown_type].push({
      id: row.id,
      value: row.dropdown_value,
      code: row.dropdown_code
    });

  }


  return grouped;
}


async function create(
  tenantId,
  userId,
  type,
  data
) {

  const payload = {
    dropdown_type:
      String(type || "")
        .trim()
        .toUpperCase(),

    dropdown_value:
      data.dropdown_value,

    dropdown_code:
      data.dropdown_code,

    sort_order:
      data.sort_order ?? 0,

    is_active: true
  };


  return crud.create(
    TABLE,
    tenantId,
    userId,
    payload
  );
}


async function update(
  tenantId,
  userId,
  id,
  data
) {

  return crud.update(
    TABLE,
    tenantId,
    userId,
    id,
    data
  );
}


async function softDelete(
  tenantId,
  userId,
  id
) {

  return crud.softDelete(
    TABLE,
    tenantId,
    userId,
    id
  );
}


module.exports = {
  getList,
  getAll,
  create,
  update,
  softDelete
};
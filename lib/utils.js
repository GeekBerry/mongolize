function dropUndefinedValues(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) {
      delete obj[k];
    }
  }
  return obj;
}

module.exports = {
  dropUndefinedValues,
};

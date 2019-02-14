const { dropUndefinedKeys } = require('./utils');

function subClass(MongooseModel) {
  class Model extends MongooseModel {
    /**
     * @param scopeName {String}
     * @return {Query}
     */
    static scope(scopeName) {
      const where = (this.schema.options.scopes || {})[scopeName]; //  this.schema.options 一定存在
      if (!where) {
        throw new Error(`unknown scope name "${scopeName}" in model "${this.modelName}"`);
      }
      return this.where(where);
    }

    /**
     * @param id {String}
     * @return {Promise<Model>}
     * @exception Error
     */
    static async getById(id) {
      const model = await this.findById(id);
      if (model === null) {
        throw new Error(`can not found "${this.name}" by id "${id}"`);
      }
      return model;
    }

    /**
     * @param ids {String[]}
     * @return {Promise<Model[]>}
     */
    static findAllByIds(ids) {
      return this.findAll({ _id: { $in: ids } });
    }

    /**
     * @param args
     * @return {Promise<[Model, ...]>}
     */
    static findAll(...args) {
      return this.find(...args);
    }

    /**
     * collection.count is deprecated use collection.countDocuments instead
     * @return {Promise<Number>}
     */
    static count() {
      return this.countDocuments();
    }

    /**
     * @return {Promise<Query>}
     */
    static truncate() {
      return this.deleteMany();
    }

    /**
     * @param conditions {Object}
     * @param data {Object}
     * @param args Array
     */
    static async updateOne(conditions, data, ...args) {
      data = dropUndefinedKeys(data);

      const { nModified } = await super.updateOne(conditions, data, ...args);
      if (nModified !== 1) {
        throw new Error(`updateOne "${this.name}" failed`);
      }
    }

    /**
     * 为 model 对象实现 update 方法 (原有的 update 方法即将被废弃, 在此将其替换)
     * @param data {Object}
     * @return {Promise<Model>}
     * @exception Error
     */
    async update(data) {
      await this.constructor.updateOne({ _id: this.id }, data); // 注意是 "_id" 有下划线

      for (const [k, v] of Object.entries(data)) {
        this[k] = v;
      }

      return this;
    }

    /**
     * 同步远端数据
     * @param options {Object|Array}
     * @return {Promise<Model>}
     * @exception Error
     */
    async sync(options) {
      const model = await this.constructor.findById(this.id).select(options);
      if (!model) {
        throw new Error(`Can not find "${this.constructor.modelName}" by id ObjectId("${this.id}")`);
      }

      // 用 Object.entries(model.toObject()) 代价太大
      for (const [k, v] of Object.entries(model._doc)) { // eslint-disable-line
        this[k] = v;
      }

      return this;
    }
  }

  return Model;
}

module.export = subClass;

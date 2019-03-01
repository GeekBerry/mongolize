const { dropUndefinedValues } = require('./utils');

function modelClass(MongooseModel) {
  class Model extends MongooseModel {
    /**
     * @param scopeName {string}
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
     * collection.count is deprecated use collection.countDocuments instead
     * @return {Promise<Query|number>}
     */
    static count() {
      return this.countDocuments();
    }

    // ------------------------------- Find -----------------------------------
    /**
     * 要求 id 必须存在
     * @param id {string}
     * @param fields {object}
     * @param options {object}
     * @return {Promise<Model>}
     */
    static async getById(id, fields = undefined, options = undefined) {
      const model = await this.findById(id, fields, options);
      if (!model) {
        throw new Error(`can not found ${this.modelName} by id ${id}`);
      }
      return model;
    }

    /**
     * 要求所查的 ids 全部找到
     * @param ids {string[]}
     * @param fields {object}
     * @param options {object}
     * @return {Promise<Model[]>}
     */
    static async getAllByIds(ids, fields = undefined, options = undefined) {
      const models = await this.findAllByIds(ids, fields, options);
      if (models.length !== ids.length) {
        throw new Error(`can not found all ${this.modelName} by ids [${ids.join(',')}]`);
      }

      return models;
    }

    /**
     * @param conditions {object|undefined}
     * @param fields? {object|Array}
     * @param options? {object}
     * @return {Promise<Query|Model[]>}
     */
    static findAll(conditions = undefined, fields = undefined, options = undefined) {
      if (conditions !== undefined) {
        conditions = dropUndefinedValues(conditions);
      }
      return this.find(conditions, fields, options);
    }

    /**
     * @param ids {String[]}
     * @param fields {Object|Array}
     * @param options {Object}
     * @return {Promise<Query|Model[]>}
     */
    static findAllByIds(ids, fields = undefined, options = undefined) {
      return this.findAll({ _id: { $in: ids } }, fields, options);
    }

    /**
     * @param conditions {Object}
     * @param fields {Object|Array}
     * @param options {Object}
     * @return {Promise<Query|Model>}
     * @exception Error
     */
    static findOne(conditions, fields = undefined, options = undefined) {
      if (conditions !== undefined) {
        conditions = dropUndefinedValues(conditions);
      }
      return super.findOne(conditions, fields, options);
    }

    // ------------------------------- Update ---------------------------------
    /**
     * @param conditions {object}
     * @param data {object}
     * @param options {object}
     * @return undefined
     * @exception Error
     */
    static async updateOne(conditions, data, options = undefined) {
      conditions = dropUndefinedValues(conditions);
      if (Object.keys(conditions).length === 0) {
        throw new Error('updateOne not support empty condition');
      }

      data = dropUndefinedValues(data); // 可以通过更新空 data 更新 updatedAt 本身
      const { nModified } = await super.updateOne(conditions, data, options);
      if (nModified !== 1) {
        throw new Error(`updateOne "${this.modelName}" failed`);
      }
    }

    /**
     * 通过 Id 进行更新
     * @param id {string}
     * @param data {object}
     * @return {Promise<undefined>}
     * @exception Error
     */
    static async updateById(id, data) {
      await this.updateOne({ _id: id }, data); // 注意是 "_id" 有下划线
    }

    // ------------------------------- Delete ---------------------------------
    /**
     * 依照条件进行删除
     * @param conditions {object}
     * @return {Promise<undefined>}
     * @exception Error
     */
    static async deleteOne(conditions) {
      conditions = dropUndefinedValues(conditions);
      if (Object.keys(conditions).length === 0) {
        throw new Error('deleteOne not support empty condition');
      }

      const { deletedCount } = await super.deleteOne(conditions);
      if (deletedCount !== 1) {
        throw new Error(`deleteOne "${this.modelName}" failed`);
      }
    }

    /**
     * @param id {string}
     * @return {Promise<undefined>}
     * @exception Error
     */
    static async deleteById(id) {
      await this.deleteOne({ _id: id });
    }

    /**
     * @return {Promise<Query|number>}
     */
    static truncate() {
      return this.deleteMany();
    }

    // ============================== Operate this ============================
    /**
     * 为 model 对象实现 update 方法 (原有的 update 方法即将被废弃, 在此将其替换)
     * @param data {Object}
     * @return {Promise<Model>}
     * @exception Error
     */
    async update(data) {
      await this.constructor.updateById(this.id, data);

      for (const [k, v] of Object.entries(data)) {
        this[k] = v;
      }

      return this;
    }

    /**
     * 同步远端数据
     * @param fields {Object|Array}
     * @return {Promise<Model>}
     * @exception Error
     */
    async sync(fields) {
      const model = await this.constructor.findById(this.id, fields);
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

module.exports = modelClass;
